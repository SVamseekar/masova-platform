package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.fiscal.dto.FiscalSummaryDto;
import com.MaSoVa.commerce.fiscal.dto.SigningFailureDto;
import com.MaSoVa.commerce.fiscal.repository.FiscalSignatureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class FiscalComplianceService {

    private static final Logger log = LoggerFactory.getLogger(FiscalComplianceService.class);

    private final FiscalSignatureRepository fiscalSignatureRepository;

    public FiscalComplianceService(FiscalSignatureRepository fiscalSignatureRepository) {
        this.fiscalSignatureRepository = fiscalSignatureRepository;
    }

    public List<FiscalSummaryDto> getSummary(String storeId) {
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }

        OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);

        try {
            return fiscalSignatureRepository.summarizeByStore(storeId, sevenDaysAgo).stream()
                    .map(row -> new FiscalSummaryDto(
                            storeId,
                            row.getCountryCode() != null ? row.getCountryCode() : "UNKNOWN",
                            row.getSignerSystem(),
                            row.getTotalSigned() != null ? row.getTotalSigned() : 0L,
                            row.getFailedLast7Days() != null ? row.getFailedLast7Days() : 0L,
                            row.getLastSignedAt()))
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to load fiscal summary for store {}: {}", storeId, e.getMessage());
            throw e;
        }
    }

    public List<SigningFailureDto> getFailures(String storeId) {
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }

        OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);

        try {
            return fiscalSignatureRepository
                    .findByStoreIdAndSigningFailedTrueAndCreatedAtAfterOrderByCreatedAtDesc(storeId, sevenDaysAgo)
                    .stream()
                    .map(entity -> new SigningFailureDto(
                            entity.getOrderId(),
                            entity.getStoreId(),
                            entity.getCountryCode(),
                            entity.getSignerSystem(),
                            entity.getSigningError(),
                            entity.getCreatedAt()))
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to load fiscal failures for store {}: {}", storeId, e.getMessage());
            throw e;
        }
    }
}