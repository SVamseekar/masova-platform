package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.entity.Campaign;
import com.MaSoVa.core.notification.service.CampaignService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/campaigns")
@Tag(name = "Campaigns", description = "Marketing campaign management")
@SecurityRequirement(name = "bearerAuth")
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
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Create campaign")
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign created = campaignService.createCampaign(campaign);
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update campaign")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable String id, @RequestBody Campaign campaign) {
        Campaign updated = campaignService.updateCampaign(id, campaign);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Schedule campaign")
    public ResponseEntity<Void> scheduleCampaign(@PathVariable String id, @RequestBody ScheduleRequest request) {
        campaignService.scheduleCampaign(id, request.getScheduledFor());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Execute campaign immediately")
    public ResponseEntity<Void> executeCampaign(@PathVariable String id) {
        campaignService.executeCampaign(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Cancel scheduled campaign")
    public ResponseEntity<Void> cancelCampaign(@PathVariable String id) {
        campaignService.cancelCampaign(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "List campaigns (paged)")
    public ResponseEntity<Page<Campaign>> getAllCampaigns(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Campaign> campaigns = campaignService.getAllCampaigns(pageable);
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get campaign by ID")
    public ResponseEntity<Campaign> getCampaign(@PathVariable String id) {
        return campaignService.getCampaignById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER')")
    @Operation(summary = "Delete campaign")
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
