package com.billsplit.backend.model;

import java.math.BigDecimal;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParsedReceiptItem {
    private String name;
    private BigDecimal price;
}
