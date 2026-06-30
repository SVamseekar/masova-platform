package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.fiscal.FiscalComplianceService;
import com.MaSoVa.commerce.fiscal.dto.FiscalSummaryDto;
import com.MaSoVa.commerce.fiscal.dto.SigningFailureDto;
import com.MaSoVa.commerce.fiscal.entity.FiscalSignatureJpaEntity;
import com.MaSoVa.commerce.fiscal.repository.FiscalSignatureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FiscalComplianceService Unit Tests")
class FiscalComplianceServiceTest {

    @Mock private FiscalSignatureRepository fiscalSignatureRepository;

    private FiscalComplianceService fiscalComplianceService;

    @BeforeEach
    void setUp() {
        fiscalComplianceService = new FiscalComplianceService(fiscalSignatureRepository);
    }

    @Test
    @DisplayName("getSummary requires storeId")
    void getSummary_requiresStoreId() {
        assertThatThrownBy(() -> fiscalComplianceService.getSummary(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getSummary aggregates by country and signer")
    void getSummary_returnsAggregatedRows() {
        FiscalSignatureRepository.FiscalSummaryProjection projection = mock(
                FiscalSignatureRepository.FiscalSummaryProjection.class);
        when(projection.getCountryCode()).thenReturn("DE");
        when(projection.getSignerSystem()).thenReturn("TSE");
        when(projection.getTotalSigned()).thenReturn(12L);
        when(projection.getFailedLast7Days()).thenReturn(1L);
        when(projection.getLastSignedAt()).thenReturn(OffsetDateTime.parse("2026-06-29T10:00:00Z"));

        when(fiscalSignatureRepository.summarizeByStore(eq("store-1"), any(OffsetDateTime.class)))
                .thenReturn(List.of(projection));

        List<FiscalSummaryDto> summary = fiscalComplianceService.getSummary("store-1");

        assertThat(summary).hasSize(1);
        assertThat(summary.get(0).getStoreId()).isEqualTo("store-1");
        assertThat(summary.get(0).getCountryCode()).isEqualTo("DE");
        assertThat(summary.get(0).getSignerSystem()).isEqualTo("TSE");
        assertThat(summary.get(0).getTotalSigned()).isEqualTo(12L);
        assertThat(summary.get(0).getFailedLast7Days()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getFailures returns signing failures from last 7 days")
    void getFailures_returnsRecentFailures() {
        FiscalSignatureJpaEntity failure = FiscalSignatureJpaEntity.builder()
                .orderId("order-1")
                .storeId("store-1")
                .countryCode("DE")
                .signerSystem("TSE")
                .signingError("TSE offline")
                .createdAt(OffsetDateTime.now().minusDays(1))
                .build();

        when(fiscalSignatureRepository
                .findByStoreIdAndSigningFailedTrueAndCreatedAtAfterOrderByCreatedAtDesc(
                        eq("store-1"), any(OffsetDateTime.class)))
                .thenReturn(List.of(failure));

        List<SigningFailureDto> failures = fiscalComplianceService.getFailures("store-1");

        assertThat(failures).hasSize(1);
        assertThat(failures.get(0).getOrderId()).isEqualTo("order-1");
        assertThat(failures.get(0).getSigningError()).isEqualTo("TSE offline");
    }
}