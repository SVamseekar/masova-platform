package com.MaSoVa.order.repository;

import com.MaSoVa.order.entity.RatingToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RatingTokenRepository extends MongoRepository<RatingToken, String> {

    Optional<RatingToken> findByToken(String token);

    Optional<RatingToken> findByOrderId(String orderId);

    boolean existsByOrderId(String orderId);
}
