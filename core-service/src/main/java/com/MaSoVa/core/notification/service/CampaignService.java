package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.entity.Campaign;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.repository.CampaignRepository;
import com.MaSoVa.core.notification.repository.UserPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CampaignService {
    private static final Logger logger = LoggerFactory.getLogger(CampaignService.class);

    private final CampaignRepository campaignRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final NotificationService notificationService;

    public CampaignService(CampaignRepository campaignRepository,
                          UserPreferencesRepository userPreferencesRepository,
                          NotificationService notificationService) {
        this.campaignRepository = campaignRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.notificationService = notificationService;
    }

    public Campaign createCampaign(Campaign campaign, String storeId) {
        campaign.setStoreId(storeId);
        campaign.setStatus(Campaign.CampaignStatus.DRAFT);
        return campaignRepository.save(campaign);
    }

    private Campaign requireCampaignInStore(String id, String storeId) {
        Campaign existing = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        if (!existing.getStoreId().equals(storeId)) {
            throw new RuntimeException("Campaign not found");
        }
        return existing;
    }

    public Campaign updateCampaign(String id, Campaign campaign, String storeId) {
        Campaign existing = requireCampaignInStore(id, storeId);
        existing.setName(campaign.getName());
        existing.setDescription(campaign.getDescription());
        existing.setChannel(campaign.getChannel());
        existing.setSubject(campaign.getSubject());
        existing.setMessage(campaign.getMessage());
        existing.setScheduledFor(campaign.getScheduledFor());
        existing.setSegment(campaign.getSegment());

        return campaignRepository.save(existing);
    }

    public void scheduleCampaign(String campaignId, LocalDateTime scheduledFor, String storeId) {
        Campaign campaign = requireCampaignInStore(campaignId, storeId);
        campaign.setScheduledFor(scheduledFor);
        campaign.setStatus(Campaign.CampaignStatus.SCHEDULED);
        campaignRepository.save(campaign);
    }

    @Async
    public void executeCampaign(String campaignId, String storeId) {
        Optional<Campaign> campaignOpt = campaignRepository.findById(campaignId);
        if (campaignOpt.isEmpty() || !campaignOpt.get().getStoreId().equals(storeId)) {
            logger.error("Campaign not found: {}", campaignId);
            return;
        }

        Campaign campaign = campaignOpt.get();
        campaign.setStatus(Campaign.CampaignStatus.SENDING);
        campaign.setSentAt(LocalDateTime.now());
        campaignRepository.save(campaign);

        try {
            // Get target users based on segment
            List<String> targetUserIds = getTargetUsers(campaign);
            campaign.setTotalRecipients(targetUserIds.size());
            campaignRepository.save(campaign);

            int successCount = 0;
            int failureCount = 0;

            for (String userId : targetUserIds) {
                try {
                    Notification notification = new Notification(
                            userId,
                            campaign.getSubject(),
                            campaign.getMessage(),
                            Notification.NotificationType.PROMOTIONAL,
                            campaign.getChannel()
                    );

                    // Get user contact info
                    Optional<UserPreferences> prefsOpt = userPreferencesRepository.findByUserId(userId);
                    if (prefsOpt.isPresent()) {
                        UserPreferences prefs = prefsOpt.get();
                        notification.setRecipientEmail(prefs.getEmail());
                        notification.setRecipientPhone(prefs.getPhone());
                        notification.setRecipientDeviceToken(prefs.getDeviceToken());

                        notificationService.createNotification(notification);
                        notificationService.sendNotification(notification.getId());
                        successCount++;
                    } else {
                        failureCount++;
                    }

                } catch (Exception e) {
                    logger.error("Failed to send campaign notification to user {}: {}",
                            userId, e.getMessage());
                    failureCount++;
                }
            }

            campaign.setSent(successCount);
            campaign.setFailed(failureCount);
            campaign.setStatus(Campaign.CampaignStatus.SENT);
            campaign.setCompletedAt(LocalDateTime.now());

            logger.info("Campaign {} completed. Sent: {}, Failed: {}",
                    campaignId, successCount, failureCount);

        } catch (Exception e) {
            logger.error("Campaign execution failed: {}", e.getMessage(), e);
            campaign.setStatus(Campaign.CampaignStatus.FAILED);
        }

        campaignRepository.save(campaign);
    }

    private List<String> getTargetUsers(Campaign campaign) {
        // If specific user IDs are provided, use them
        if (campaign.getTargetUserIds() != null && !campaign.getTargetUserIds().isEmpty()) {
            return campaign.getTargetUserIds();
        }

        // Otherwise, get users based on segment
        // Use dedicated query instead of loading all preferences
        List<UserPreferences> promotionalUsers = userPreferencesRepository.findByPromotionalEnabledTrue();

        return promotionalUsers.stream()
                .map(UserPreferences::getUserId)
                .toList();
    }

    public Page<Campaign> getAllCampaigns(Pageable pageable, String storeId) {
        return campaignRepository.findByStoreIdOrderByCreatedAtDesc(storeId, pageable);
    }

    public Optional<Campaign> getCampaignById(String id, String storeId) {
        return campaignRepository.findById(id)
                .filter(campaign -> campaign.getStoreId().equals(storeId));
    }

    public void cancelCampaign(String campaignId, String storeId) {
        Campaign campaign = requireCampaignInStore(campaignId, storeId);
        campaign.setStatus(Campaign.CampaignStatus.CANCELLED);
        campaignRepository.save(campaign);
    }

    public void deleteCampaign(String campaignId, String storeId) {
        requireCampaignInStore(campaignId, storeId);
        campaignRepository.deleteById(campaignId);
    }
}
