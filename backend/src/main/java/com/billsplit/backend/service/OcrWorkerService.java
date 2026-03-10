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
            List<ParsedReceiptItem> parsedItems = ocrParserService.extractItems(receiptImage);

            Optional<Session> sessionOpt = sessionRepository.findById(UUID.fromString(job.getSessionId()));
            
            if (sessionOpt.isPresent()) {
                Session session = sessionOpt.get();
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
            e.printStackTrace();
        }
    }

    public void poll() {
        while (true) {
            String jobJson = redisQueueService.dequeue(queueName, 5);
            if (jobJson != null) {
                processOcrJob(jobJson);
            }
        }
    }
}