package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.OrderPostgresOutbox;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderPostgresOutboxRepository extends MongoRepository<OrderPostgresOutbox, String> {

    List<OrderPostgresOutbox> findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc();

    long countByResolvedAtIsNullAndDeadLetteredFalse();
}
