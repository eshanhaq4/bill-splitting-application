package com.billsplit.backend.model;

import lombok.Data;

@Data
public class ClaimResult {
    private boolean success;
    private Item item;
    private String errorCode;
    private String message;
}