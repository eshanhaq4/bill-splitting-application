package com.billsplit.backend.model;

import lombok.Data;

@Data
public class Item {
    private String id;
    private String name;
    private Float price;
    private String category;
    private int quantity;
    private Member claimedBy;
    private boolean locked;
}