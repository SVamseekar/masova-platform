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
    /**
     * @deprecated Use findByStoreIdAndStatus for store data isolation
     */
    @Deprecated
    List<Campaign> findByStatus(Campaign.CampaignStatus status);

    Page<Campaign> findByCreatedBy(String createdBy, Pageable pageable);

    /**
     * @deprecated Use findByStoreIdAndStatusAndScheduledForBefore for store data isolation
     */
    @Deprecated
    List<Campaign> findByStatusAndScheduledForBefore(Campaign.CampaignStatus status, LocalDateTime dateTime);

    /**
     * @deprecated Use findByStoreIdOrderByCreatedAtDesc for store data isolation
     */
    @Deprecated
    Page<Campaign> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Week 4: Store-aware queries for proper data isolation
    List<Campaign> findByStoreId(String storeId);

    List<Campaign> findByStoreIdAndStatus(String storeId, Campaign.CampaignStatus status);

    Page<Campaign> findByStoreIdOrderByCreatedAtDesc(String storeId, Pageable pageable);

    List<Campaign> findByStoreIdAndStatusAndScheduledForBefore(
            String storeId,
            Campaign.CampaignStatus status,
            LocalDateTime dateTime
    );

    Page<Campaign> findByStoreIdAndCreatedBy(String storeId, String createdBy, Pageable pageable);
}
