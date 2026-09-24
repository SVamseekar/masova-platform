package com.MaSoVa.payment.repository;

import com.MaSoVa.payment.entity.PaymentStatusOutbox;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentStatusOutboxRepository extends MongoRepository<PaymentStatusOutbox, String> {
}
