package com.MaSoVa.notification.repository;

import com.MaSoVa.notification.entity.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampaignRepository extends MongoRepository<Campaign, String> {
    List<Campaign> findByStatus(Campaign.CampaignStatus status);
    Page<Campaign> findByCreatedBy(String createdBy, Pageable pageable);
    List<Campaign> findByStatusAndScheduledForBefore(Campaign.CampaignStatus status, LocalDateTime dateTime);
    Page<Campaign> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
