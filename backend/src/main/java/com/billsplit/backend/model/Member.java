package com.billsplit.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
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

    @Column(name = "dietary_preference")
    private String dietaryPreference;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "member_role")
    private MemberRole role = MemberRole.MEMBER;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}