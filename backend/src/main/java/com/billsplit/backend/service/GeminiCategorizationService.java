package com.billsplit.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class GeminiCategorizationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<String> categorizeItems(List<String> itemNames) {
        if (itemNames.isEmpty()) return List.of();

        String itemList = String.join("\n", itemNames.stream()
            .map(name -> "- " + name)
            .toList());

        String prompt = """
            Categorize each food item below into exactly one of these categories:
            VEGAN, VEGETARIAN, MEAT, SEAFOOD, NONE
            
            Rules:
            - VEGAN: no animal products at all
            - VEGETARIAN: no meat/seafood but may have dairy/eggs
            - NONE: non-food items, drinks, or unclear
            
            Respond with ONLY a JSON array of strings in the same order as the input.
            Example: ["MEAT","VEGAN","NONE"]
            
            Items:
            """ + itemList;

        try {
            String requestBody = objectMapper.writeValueAsString(java.util.Map.of(
                "contents", List.of(java.util.Map.of(
                    "parts", List.of(java.util.Map.of("text", prompt))
                ))
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText().trim();

            // Strip markdown code fences if present
            text = text.replaceAll("```json|```", "").trim();

            JsonNode categories = objectMapper.readTree(text);
            List<String> result = new java.util.ArrayList<>();
            for (JsonNode node : categories) {
                result.add(node.asText("NONE"));
            }
            return result;

        } catch (Exception e) {
            System.err.println("[GeminiCategorizationService] Error: " + e.getMessage());
            return itemNames.stream().map(n -> "NONE").toList();
        }
    }
}