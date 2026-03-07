package com.billsplit.backend.model;

import lombok.Data;

@Data
public class Member {
    private String id;
    private String displayName;
    private boolean connected;
    private String token;
}