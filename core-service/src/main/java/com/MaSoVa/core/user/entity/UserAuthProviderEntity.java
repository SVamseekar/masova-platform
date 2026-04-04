package com.MaSoVa.core.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

/**
 * PostgreSQL JPA entity for the user_auth_providers table (Phase 2 dual-write).
 * Stores OAuth provider links (e.g., Google) for each user.
 * Schema: core_schema
 */
@Entity
@Table(
    name = "user_auth_providers",
    schema = "core_schema",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_auth_provider_id", columnNames = {"provider", "provider_id"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuthProviderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_auth_provider_user"))
    private UserEntity user;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now(IST);
        }
    }
}
