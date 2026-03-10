package com.billsplit.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MarkReadyResult {
    private boolean success;
    private boolean allReady;
}