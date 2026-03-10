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
    private String category = "NONE";

    public ParsedReceiptItem(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
        this.category = "NONE";
    }
}