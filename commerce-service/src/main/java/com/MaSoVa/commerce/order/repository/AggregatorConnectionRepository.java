package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.shared.enums.OrderSource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AggregatorConnectionRepository extends MongoRepository<AggregatorConnection, String> {
    List<AggregatorConnection> findByStoreId(String storeId);
    Optional<AggregatorConnection> findByStoreIdAndPlatform(String storeId, OrderSource platform);
}
