package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionJpaRepository;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionRepository;
import com.MaSoVa.shared.enums.OrderSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AggregatorService {

    private static final Logger log = LoggerFactory.getLogger(AggregatorService.class);

    private final AggregatorConnectionRepository connectionRepository;
    private final AggregatorConnectionJpaRepository connectionJpaRepository;

    public AggregatorService(AggregatorConnectionRepository connectionRepository,
                              AggregatorConnectionJpaRepository connectionJpaRepository) {
        this.connectionRepository = connectionRepository;
        this.connectionJpaRepository = connectionJpaRepository;
    }

    /** Returns configured commission % for a platform at a store. Returns ZERO if not configured. */
    public BigDecimal getCommissionPercent(String storeId, OrderSource platform) {
        return connectionRepository.findByStoreIdAndPlatform(storeId, platform)
                .map(AggregatorConnection::getCommissionPercent)
                .orElse(BigDecimal.ZERO);
    }

    /** commission = gross * (percent / 100), rounded half-up to 2dp */
    public BigDecimal calculateCommissionAmount(BigDecimal gross, BigDecimal commissionPercent) {
        return gross.multiply(commissionPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /** net = gross - commission */
    public BigDecimal calculateNetPayout(BigDecimal gross, BigDecimal commissionPercent) {
        return gross.subtract(calculateCommissionAmount(gross, commissionPercent));
    }

    @Transactional
    public AggregatorConnection upsertConnection(String storeId, OrderSource platform, BigDecimal commissionPercent) {
        if (platform == OrderSource.MASOVA) {
            throw new IllegalArgumentException("Cannot configure commission for MASOVA — direct orders have no aggregator commission");
        }

        // MongoDB write (primary)
        AggregatorConnection conn = connectionRepository
                .findByStoreIdAndPlatform(storeId, platform)
                .orElseGet(AggregatorConnection::new);
        conn.setStoreId(storeId);
        conn.setPlatform(platform);
        conn.setCommissionPercent(commissionPercent);
        conn.setActive(true);
        AggregatorConnection saved = connectionRepository.save(conn);

        // PostgreSQL dual-write (wrapped in try/catch per project pattern)
        try {
            AggregatorConnectionJpaEntity jpa = connectionJpaRepository
                    .findByStoreIdAndPlatform(storeId, platform.name())
                    .orElseGet(AggregatorConnectionJpaEntity::new);
            jpa.setStoreId(storeId);
            jpa.setPlatform(platform.name());
            jpa.setCommissionPercent(commissionPercent);
            jpa.setActive(true);
            jpa.setUpdatedAt(LocalDateTime.now());
            connectionJpaRepository.save(jpa);
        } catch (Exception e) {
            log.warn("[AggregatorService] PostgreSQL dual-write failed for storeId={} platform={}: {}",
                    storeId, platform, e.getMessage());
        }

        log.info("[AggregatorService] Upserted connection storeId={} platform={} commission={}%",
                storeId, platform, commissionPercent);
        return saved;
    }

    public List<AggregatorConnection> getConnectionsForStore(String storeId) {
        return connectionRepository.findByStoreId(storeId);
    }
}
