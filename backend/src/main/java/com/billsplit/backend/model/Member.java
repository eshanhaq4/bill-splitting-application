package com.billsplit.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "token")
    private UUID token;

    @Column(name = "connected")
    private Boolean connected;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}