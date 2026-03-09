package com.billsplit.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class SupabaseStorageService {
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String supabaseBucket;

    public Path downloadReceipt(String imagePath) throws IOException {
        String receiptUrl = supabaseUrl + "/storage/v1/object/public/" + supabaseBucket + "/" + imagePath;

        URL url = new URL(receiptUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Authorization", "Bearer " + supabaseKey);
        connection.setRequestProperty("apiKey", supabaseKey);
        
        if (connection.getResponseCode() == 200) {
            try (InputStream inputStream = connection.getInputStream()) {
                Path tempFile = Files.createTempFile("receipt-", ".jpg");
                Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
                return tempFile;
            }
        } else {
            throw new IOException("Failed to download file from Supabase: " + connection.getResponseMessage());
        }
    }