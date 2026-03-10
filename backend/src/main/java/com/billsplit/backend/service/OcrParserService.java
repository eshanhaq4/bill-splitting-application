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

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Service
public class OcrParserService {
    private static final Pattern ITEM_PATTERN = Pattern.compile("^(?:\\d+\\s*[xX]\\s*)?(.+?)\\s+\\$?(\\d+\\.\\d{2})$");
    private static final Pattern TAX_PATTERN = Pattern.compile("(?i).*tax\\s+\\$?(\\d+\\.\\d{2}).*");
    private static final Pattern TIP_PATTERN = Pattern.compile("(?i).*(tip|gratuity)\\s+\\$?(\\d+\\.\\d{2}).*");
    private static final List<String> SKIP_KEYWORDS = List.of("tax", "tip", "subtotal", "total", "thank", "date", "phone", "credit", "debit", "gratuity");

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedReceiptResult {
        private List<ParsedReceiptItem> items;
        private BigDecimal tax;
        private BigDecimal tip;
    }
    
    public ParsedReceiptResult extractItems(Path receiptImagePath) throws IOException, InterruptedException {
        String result = runTesseract(receiptImagePath);

        List<ParsedReceiptItem> items = parseReceipt(result);
        BigDecimal tax = extractTax(result);
        BigDecimal tip = extractTip(result);

        return new ParsedReceiptResult(items, tax, tip);
    }

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

    private List<ParsedReceiptItem> parseReceipt(String ocrResult) {
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
    private BigDecimal extractTax(String ocrResult) {
        String[] lines = ocrResult.split("\\r?\\n");

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) continue;

            Matcher matcher = TAX_PATTERN.matcher(trimmedLine);
            if (matcher.matches()) {
                return new BigDecimal(matcher.group(1));
            }
        }
        return null;
    }

    private BigDecimal extractTip(String ocrResult) {
        String[] lines = ocrResult.split("\\r?\\n");

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) continue;

            Matcher matcher = TIP_PATTERN.matcher(trimmedLine);
            if (matcher.matches()) {
                return new BigDecimal(matcher.group(2));
            }
        }
        return null;
    }
}