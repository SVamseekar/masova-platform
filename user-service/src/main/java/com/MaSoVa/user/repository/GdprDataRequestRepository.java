package com.MaSoVa.user.repository;

import com.MaSoVa.shared.entity.GdprDataRequest;
import com.MaSoVa.shared.enums.GdprRequestType;
import com.MaSoVa.shared.enums.GdprRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GdprDataRequestRepository extends MongoRepository<GdprDataRequest, String> {

    List<GdprDataRequest> findByUserId(String userId);

    List<GdprDataRequest> findByUserIdAndRequestType(String userId, GdprRequestType requestType);

    List<GdprDataRequest> findByStatus(GdprRequestStatus status);

    List<GdprDataRequest> findByDueDateBefore(LocalDateTime dateTime);

    Optional<GdprDataRequest> findByVerificationToken(String token);

    long countByUserIdAndStatus(String userId, GdprRequestStatus status);

    List<GdprDataRequest> findByUserIdAndStatusNot(String userId, GdprRequestStatus status);
}
