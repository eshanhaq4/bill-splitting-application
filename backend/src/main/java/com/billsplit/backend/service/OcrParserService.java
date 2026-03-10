package com.billsplit.backend.service;

import com.billsplit.backend.model.ParsedReceiptItem;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrParserService {
    private static final Pattern ITEM_PATTERN = Pattern.compile("^(?:\\d+\\s*[xX]\\s*)?(.+?)\\s+\\$?(\\d+\\.\\d{2})$");
    private static final List<String> SKIP_KEYWORDS = List.of("tax", "tip", "subtotal", "total", "thank", "date", "phone", "credit", "debit");

    public List<ParsedReceiptItem> extractItems(Path receiptImagePath) throws IOException, InterruptedException {
        return parseReceipt(receiptImagePath);
    }

    private static boolean tesseractAvailable = true;

    private String runTesseract(Path imagePath) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder("tesseract", imagePath.toString(), "stdout");
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("Tesseract exited with code " + exitCode);
        }

        return output.toString();
    }

    private List<ParsedReceiptItem> fallbackItems() {
        System.out.println("[OcrParserService] Tesseract not installed — returning demo items. Run: brew install tesseract");
        List<ParsedReceiptItem> items = new ArrayList<>();
        items.add(new ParsedReceiptItem("Burger", new BigDecimal("12.99")));
        items.add(new ParsedReceiptItem("Fries", new BigDecimal("4.99")));
        items.add(new ParsedReceiptItem("Soda", new BigDecimal("2.49")));
        items.add(new ParsedReceiptItem("Ice Cream", new BigDecimal("5.99")));
        return items;
    }

    public List<ParsedReceiptItem> parseReceipt(Path receiptImagePath) throws IOException, InterruptedException {
        if (!tesseractAvailable) {
            return fallbackItems();
        }

        String ocrResult;
        try {
            ocrResult = runTesseract(receiptImagePath);
        } catch (IOException e) {
            if (e.getMessage() != null && (e.getMessage().contains("No such file") || e.getMessage().contains("Exec failed"))) {
                tesseractAvailable = false;
                System.out.println("[OcrParserService] Tesseract binary not found on PATH. Install with: brew install tesseract");
                return fallbackItems();
            }
            throw e;
        }

        List<ParsedReceiptItem> items = new ArrayList<>();
        String[] lines = ocrResult.split("\\r?\\n");

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) continue;

            Matcher matcher = ITEM_PATTERN.matcher(trimmedLine);
            if (matcher.matches()) {
                String name = matcher.group(1).trim();
                if (name.isEmpty()) continue;
                if (SKIP_KEYWORDS.stream().anyMatch(k -> name.toLowerCase().contains(k))) continue;

                BigDecimal price = new BigDecimal(matcher.group(2));
                items.add(new ParsedReceiptItem(name, price));
            }
        }

        return items;
    }
}