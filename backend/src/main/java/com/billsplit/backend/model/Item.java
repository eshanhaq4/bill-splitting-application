package com.billsplit.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Float price;

    private String category;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false)
    private Boolean locked = false;

    @ManyToOne
    @JoinColumn(name = "claimed_by")
    private Member claimedBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}