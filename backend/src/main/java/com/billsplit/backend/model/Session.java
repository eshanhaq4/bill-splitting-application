package com.billsplit.backend.model;

import lombok.Data;
import java.util.List;

@Data
public class Session {
    private String id;
    private SessionStatus status;
    private List<Member> members;
    private List<Item> items;
    private Float tax;
    private Float tip;
    private String joinUrl;
    private String qrCodeUrl;
}