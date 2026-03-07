package com.billsplit.backend.model;

import lombok.Data;

@Data
public class JoinSessionResult {
    private boolean success;
    private String token;
    private Member member;
    private Session session;
}