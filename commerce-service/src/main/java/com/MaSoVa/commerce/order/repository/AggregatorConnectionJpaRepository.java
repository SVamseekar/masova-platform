package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AggregatorConnectionJpaRepository extends JpaRepository<AggregatorConnectionJpaEntity, Long> {
    List<AggregatorConnectionJpaEntity> findByStoreId(String storeId);
    Optional<AggregatorConnectionJpaEntity> findByStoreIdAndPlatform(String storeId, String platform);
}
