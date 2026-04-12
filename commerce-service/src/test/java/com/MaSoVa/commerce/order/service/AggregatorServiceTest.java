package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionRepository;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionJpaRepository;
import com.MaSoVa.shared.enums.OrderSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AggregatorServiceTest {

    @Mock
    private AggregatorConnectionRepository connectionRepository;
    @Mock
    private AggregatorConnectionJpaRepository connectionJpaRepository;

    @InjectMocks
    private AggregatorService aggregatorService;

    @Test
    void calculateNetPayout_subtractsCommissionPercent() {
        BigDecimal gross = new BigDecimal("100.00");
        BigDecimal commissionPercent = new BigDecimal("30.00");

        BigDecimal net = aggregatorService.calculateNetPayout(gross, commissionPercent);

        assertThat(net).isEqualByComparingTo(new BigDecimal("70.00"));
    }

    @Test
    void calculateCommissionAmount_returnsPercentOfGross() {
        BigDecimal gross = new BigDecimal("80.00");
        BigDecimal commissionPercent = new BigDecimal("25.00");

        BigDecimal commission = aggregatorService.calculateCommissionAmount(gross, commissionPercent);

        assertThat(commission).isEqualByComparingTo(new BigDecimal("20.00"));
    }

    @Test
    void getCommissionPercent_returnsConfiguredPercent_whenConnectionExists() {
        AggregatorConnection conn = new AggregatorConnection();
        conn.setStoreId("store1");
        conn.setPlatform(OrderSource.WOLT);
        conn.setCommissionPercent(new BigDecimal("28.00"));
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.WOLT))
                .thenReturn(Optional.of(conn));

        BigDecimal percent = aggregatorService.getCommissionPercent("store1", OrderSource.WOLT);

        assertThat(percent).isEqualByComparingTo(new BigDecimal("28.00"));
    }

    @Test
    void getCommissionPercent_returnsZero_whenNoConnectionConfigured() {
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.DELIVEROO))
                .thenReturn(Optional.empty());

        BigDecimal percent = aggregatorService.getCommissionPercent("store1", OrderSource.DELIVEROO);

        assertThat(percent).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void upsertConnection_savesToBothMongoAndPostgres() {
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.WOLT))
                .thenReturn(Optional.empty());
        when(connectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(connectionJpaRepository.findByStoreIdAndPlatform("store1", "WOLT"))
                .thenReturn(Optional.empty());
        when(connectionJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        aggregatorService.upsertConnection("store1", OrderSource.WOLT, new BigDecimal("30.00"));

        verify(connectionRepository).save(any(AggregatorConnection.class));
        verify(connectionJpaRepository).save(any(AggregatorConnectionJpaEntity.class));
    }

    @Test
    void upsertConnection_throwsException_whenPlatformIsMasova() {
        assertThatThrownBy(() ->
            aggregatorService.upsertConnection("store1", OrderSource.MASOVA, new BigDecimal("10.00"))
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("MASOVA");
    }
}
