package com.billsplit.backend.service;

import com.billsplit.backend.model.Item;
import com.billsplit.backend.model.OcrJob;
import com.billsplit.backend.model.ParsedReceiptItem;
import com.billsplit.backend.model.Session;
import com.billsplit.backend.repository.ItemRepository;
import com.billsplit.backend.repository.SessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;

import java.math.BigDecimal;

@Service
public class OcrWorkerService {
    private final RedisQueueService redisQueueService;
    private final SupabaseStorageService supabaseStorageService;
    private final OcrParserService ocrParserService;
    private final ItemRepository itemRepository;
    private final SessionRepository sessionRepository;
    private final ObjectMapper objectMapper;
    private final SessionEventPublisher sessionEventPublisher;

    @Value("${ocr.queue.name}")
    private String queueName;

    public OcrWorkerService(RedisQueueService redisQueueService, SupabaseStorageService supabaseStorageService,
                        OcrParserService ocrParserService, ItemRepository itemRepository,
                        SessionRepository sessionRepository, ObjectMapper objectMapper,
                        SessionEventPublisher sessionEventPublisher) {
        this.redisQueueService = redisQueueService;
        this.supabaseStorageService = supabaseStorageService;
        this.ocrParserService = ocrParserService;
        this.itemRepository = itemRepository;
        this.sessionRepository = sessionRepository;
        this.objectMapper = objectMapper;
        this.sessionEventPublisher = sessionEventPublisher;
    }

    public void processOcrJob(String jobJson) {
        try {
            OcrJob job = objectMapper.readValue(jobJson, OcrJob.class);
            Path receiptImage = supabaseStorageService.downloadReceipt(job.getImagePath());
            
            OcrParserService.ParsedReceiptResult parsedResult = ocrParserService.extractItems(receiptImage);
            List<ParsedReceiptItem> parsedItems = parsedResult.getItems();
            BigDecimal tax = parsedResult.getTax();
            BigDecimal tip = parsedResult.getTip();

            Optional<Session> sessionOpt = sessionRepository.findById(UUID.fromString(job.getSessionId()));
            
            if (sessionOpt.isPresent()) {
                Session session = sessionOpt.get();
                
                if (tax != null) {
                    session.setTax(tax);
                }
                if (tip != null) {
                    session.setTip(tip);
                }
                sessionRepository.save(session);

                for (ParsedReceiptItem parsedItem : parsedItems) {
                    Item item = new Item();
                    item.setName(parsedItem.getName());
                    item.setPrice(parsedItem.getPrice());
                    item.setSession(session);
                    item.setCreatedAt(java.time.OffsetDateTime.now());
                    Item savedItem = itemRepository.save(item);

                    // Emit per-item event
                    sessionEventPublisher.publish(job.getSessionId(), "OCR_ITEM_PARSED", Map.of(
                        "item", Map.of(
                            "id", savedItem.getId().toString(),
                            "name", savedItem.getName(),
                            "price", savedItem.getPrice(),
                            "category", savedItem.getCategory() != null ? savedItem.getCategory() : ""
                        )
                    ));
                }
            }

            Files.deleteIfExists(receiptImage);
        } catch (Exception e) {
            System.out.println("[OcrWorkerService] ERROR processing OCR job: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void poll() {
        System.out.println("[OcrWorkerService] Starting polling loop on queue: " + queueName);
        while (true) {
            try {
                String jobJson = redisQueueService.dequeue(queueName, 5);
                if (jobJson != null) {
                    System.out.println("[OcrWorkerService] Dequeued job: " + jobJson);
                    processOcrJob(jobJson);
                }
            } catch (Exception e) {
                System.out.println("[OcrWorkerService] FATAL poll error: " + e.getMessage());
                e.printStackTrace();
                try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
            }
        }
    }
}