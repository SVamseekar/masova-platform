package com.MaSoVa.core.review.repository;

import com.MaSoVa.core.review.entity.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewResponseRepository extends MongoRepository<ReviewResponse, String> {

    Optional<ReviewResponse> findByReviewIdAndIsDeletedFalse(String reviewId);

    Page<ReviewResponse> findByManagerIdAndIsDeletedFalse(String managerId, Pageable pageable);

    List<ReviewResponse> findByResponseTypeAndIsDeletedFalse(ReviewResponse.ResponseType responseType);

    Page<ReviewResponse> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    Long countByManagerIdAndIsDeletedFalse(String managerId);
}
