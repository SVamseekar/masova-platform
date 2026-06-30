package com.MaSoVa.commerce.fiscal.repository;

import com.MaSoVa.commerce.fiscal.entity.FiscalSignatureJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface FiscalSignatureRepository extends JpaRepository<FiscalSignatureJpaEntity, Long> {

    interface FiscalSummaryProjection {
        String getCountryCode();
        String getSignerSystem();
        Long getTotalSigned();
        Long getFailedLast7Days();
        OffsetDateTime getLastSignedAt();
    }

    @Query("""
        SELECT f.countryCode AS countryCode,
               f.signerSystem AS signerSystem,
               SUM(CASE WHEN f.signingFailed = false THEN 1 ELSE 0 END) AS totalSigned,
               SUM(CASE WHEN f.signingFailed = true AND f.createdAt >= :since THEN 1 ELSE 0 END) AS failedLast7Days,
               MAX(f.signedAt) AS lastSignedAt
        FROM FiscalSignatureJpaEntity f
        WHERE f.storeId = :storeId
        GROUP BY f.countryCode, f.signerSystem
        ORDER BY f.countryCode, f.signerSystem
        """)
    List<FiscalSummaryProjection> summarizeByStore(@Param("storeId") String storeId,
                                                   @Param("since") OffsetDateTime since);

    List<FiscalSignatureJpaEntity> findByStoreIdAndSigningFailedTrueAndCreatedAtAfterOrderByCreatedAtDesc(
            String storeId, OffsetDateTime since);
}