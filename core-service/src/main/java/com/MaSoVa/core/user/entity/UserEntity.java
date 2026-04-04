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
 * PostgreSQL JPA entity for the users table (Phase 2 dual-write).
 * MongoDB remains the primary read source during dual-write period.
 * Schema: core_schema
 *
 * Temporal fields use OffsetDateTime to correctly map TIMESTAMPTZ columns —
 * preserving timezone information for a multi-region deployment (GCP Phase 7).
 */
@Entity
@Table(
    name = "users",
    schema = "core_schema",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_email",    columnNames = "email"),
        @UniqueConstraint(name = "uq_users_phone",    columnNames = "phone"),
        @UniqueConstraint(name = "uq_users_mongo_id", columnNames = "mongo_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** MongoDB ObjectId — used to correlate records during migration tracking */
    @Column(name = "mongo_id", length = 24, unique = true)
    private String mongoId;

    /**
     * Optimistic locking version. Hibernate manages this automatically —
     * do NOT set it manually in application code.
     */
    @Version
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "user_type", nullable = false, length = 30)
    private String userType;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "store_id", length = 24)
    private String storeId;

    @Column(name = "employee_role", length = 50)
    private String employeeRole;

    @Column(name = "employee_status", length = 20)
    private String employeeStatus;

    @Column(name = "employee_pin_hash", length = 255)
    private String employeePinHash;

    @Column(name = "pin_suffix", length = 2)
    private String pinSuffix;

    @Column(name = "terminal_id", length = 50)
    private String terminalId;

    @Column(name = "is_kiosk_account", nullable = false)
    private boolean isKioskAccount;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now(IST);
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }
}
