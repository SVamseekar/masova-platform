package com.MaSoVa.core.notification.repository;

import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.entity.Template;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TemplateRepository extends MongoRepository<Template, String> {
    List<Template> findByChannel(Notification.NotificationChannel channel);
    List<Template> findByType(Notification.NotificationType type);
    Optional<Template> findByNameAndChannel(String name, Notification.NotificationChannel channel);
    List<Template> findByActive(boolean active);
}
