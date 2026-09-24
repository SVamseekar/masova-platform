package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.OrderPostgresOutbox;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderPostgresOutboxRepository extends MongoRepository<OrderPostgresOutbox, String> {
}
