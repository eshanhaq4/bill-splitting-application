package com.billsplit.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.WAITING;

    private BigDecimal tax;
    private BigDecimal tip;

    @Transient
    private String joinUrl;

    @Transient
    private String qrCodeUrl;

    @OneToMany(mappedBy = "session")
    private List<Member> members;

    @OneToMany(mappedBy = "session")
    private List<Item> items;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}