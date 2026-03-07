package com.billsplit.backend.model;

import lombok.Data;

@Data
public class ReceiptUploadResult {
    private boolean success;
    private String jobId;
    private String message;
}