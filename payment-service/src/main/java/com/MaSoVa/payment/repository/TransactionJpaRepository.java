package com.MaSoVa.payment.repository;

import com.MaSoVa.payment.entity.TransactionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionJpaRepository extends JpaRepository<TransactionJpaEntity, String> {

    Optional<TransactionJpaEntity> findByMongoId(String mongoId);
}
