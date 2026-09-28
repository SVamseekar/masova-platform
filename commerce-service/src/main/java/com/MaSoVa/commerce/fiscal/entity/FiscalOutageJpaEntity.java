package com.MaSoVa.commerce.fiscal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * PostgreSQL JPA entity for commerce_schema.fiscal_outages (V12 migration).
 * One open row (closedAt null) per (storeId, signerSystem) at a time — opened on the
 * first signing failure, closed on the next success. KassenSichV/AEAO §146a Nr. 7
 * requires the start, end and cause of each outage to be documented.
 */
@Entity
@Table(name = "fiscal_outages", schema = "commerce_schema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiscalOutageJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "store_id", nullable = false, length = 100)
    private String storeId;

    @Column(name = "signer_system", nullable = false, length = 20)
    private String signerSystem;

    @Column(name = "opened_at", nullable = false)
    private OffsetDateTime openedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "cause", columnDefinition = "TEXT")
    private String cause;
}
