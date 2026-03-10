package com.billsplit.backend.model;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class OcrJob {
    @JsonProperty("job_id")
    private String jobId;
    
    @JsonProperty("session_id")
    private String sessionId;
    
    @JsonProperty("uploader_id")
    private String uploaderId;
    
    @JsonProperty("image_path")
    private String imagePath;
    
    @JsonProperty("created_at")
    private String createdAt;
}