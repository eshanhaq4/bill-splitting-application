package com.billsplit.backend.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JoinSessionResult {
    private boolean success;
    private String token;
    private Member member;
    private Session session;
}