package com.MaSoVa.commerce.fiscal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * PostgreSQL JPA entity for commerce_schema.fiscal_signatures (V8 migration).
 * Append-only — never DELETE from this table.
 */
@Entity
@Table(name = "fiscal_signatures", schema = "commerce_schema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiscalSignatureJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    @Column(name = "store_id", nullable = false, length = 100)
    private String storeId;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "signer_system", nullable = false, length = 20)
    private String signerSystem;

    @Column(name = "transaction_id", length = 200)
    private String transactionId;

    @Column(name = "signature_value", columnDefinition = "TEXT")
    private String signatureValue;

    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    private String qrCodeData;

    @Column(name = "signing_device_id", length = 100)
    private String signingDeviceId;

    @Column(name = "signed_at", nullable = false)
    private OffsetDateTime signedAt;

    @Builder.Default
    @Column(name = "is_required", nullable = false)
    private boolean isRequired = false;

    @Builder.Default
    @Column(name = "signing_failed", nullable = false)
    private boolean signingFailed = false;

    @Column(name = "signing_error", columnDefinition = "TEXT")
    private String signingError;

    @Column(name = "extras", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String extras;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}