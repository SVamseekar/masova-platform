package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.entity.Campaign;
import com.MaSoVa.notification.service.CampaignService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    @PostMapping
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign created = campaignService.createCampaign(campaign);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable String id, @RequestBody Campaign campaign) {
        Campaign updated = campaignService.updateCampaign(id, campaign);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<Void> scheduleCampaign(@PathVariable String id, @RequestBody ScheduleRequest request) {
        campaignService.scheduleCampaign(id, request.getScheduledFor());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<Void> executeCampaign(@PathVariable String id) {
        campaignService.executeCampaign(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelCampaign(@PathVariable String id) {
        campaignService.cancelCampaign(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<Campaign>> getAllCampaigns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Campaign> campaigns = campaignService.getAllCampaigns(pageable);
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Campaign> getCampaign(@PathVariable String id) {
        return campaignService.getCampaignById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable String id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.ok().build();
    }

    // Inner class for schedule request
    public static class ScheduleRequest {
        private LocalDateTime scheduledFor;

        public LocalDateTime getScheduledFor() {
            return scheduledFor;
        }

        public void setScheduledFor(LocalDateTime scheduledFor) {
            this.scheduledFor = scheduledFor;
        }
    }
}
