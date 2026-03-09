package com.billsplit.backend.model;

import lombok.Data;

@Data
public class OcrJob {
    private String jobId;
    private String sessionId;
    private String uploaderId;
    private String imagePath;
    private String createdAt;
}