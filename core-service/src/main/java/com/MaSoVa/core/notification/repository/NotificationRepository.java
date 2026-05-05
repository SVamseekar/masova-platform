package com.MaSoVa.core.notification.repository;

import com.MaSoVa.core.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserId(String userId);
    Page<Notification> findByUserId(String userId, Pageable pageable);
    List<Notification> findByUserIdAndReadAtIsNull(String userId);
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    List<Notification> findByStatus(Notification.NotificationStatus status);
    List<Notification> findByStatusAndScheduledForBefore(Notification.NotificationStatus status, LocalDateTime dateTime);
    Long countByUserIdAndReadAtIsNull(String userId);
    List<Notification> findByUserIdAndCreatedAtAfter(String userId, LocalDateTime after);
}
