package com.MaSoVa.inventory.controller;

import com.MaSoVa.inventory.dto.request.WasteApprovalRequest;
import com.MaSoVa.inventory.dto.response.MessageResponse;
import com.MaSoVa.inventory.dto.response.WasteSummaryResponse;
import com.MaSoVa.inventory.entity.WasteRecord;
import com.MaSoVa.inventory.service.WasteAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Waste Tracking and Analysis
 */
@RestController
@RequestMapping("/api/inventory/waste")
@CrossOrigin(origins = "*")
public class WasteController {

    private static final Logger logger = LoggerFactory.getLogger(WasteController.class);

    private final WasteAnalysisService wasteAnalysisService;

    public WasteController(WasteAnalysisService wasteAnalysisService) {
        this.wasteAnalysisService = wasteAnalysisService;
    }

    /**
     * Record waste
     * POST /api/inventory/waste
     */
    @PostMapping
    public ResponseEntity<WasteRecord> recordWaste(@RequestBody WasteRecord wasteRecord) {
        logger.info("Recording waste for item: {} in store: {}",
            wasteRecord.getItemName(), wasteRecord.getStoreId());
        WasteRecord created = wasteAnalysisService.recordWaste(wasteRecord);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all waste records for a store
     * GET /api/inventory/waste?storeId=xxx
     */
    @GetMapping
    public ResponseEntity<List<WasteRecord>> getAllWasteRecords(@RequestParam String storeId) {
        logger.info("Getting all waste records for store: {}", storeId);
        List<WasteRecord> records = wasteAnalysisService.getAllWasteRecords(storeId);
        return ResponseEntity.ok(records);
    }

    /**
     * Get waste record by ID
     * GET /api/inventory/waste/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<WasteRecord> getWasteRecordById(@PathVariable String id) {
        logger.info("Getting waste record: {}", id);
        WasteRecord record = wasteAnalysisService.getWasteRecordById(id);
        return ResponseEntity.ok(record);
    }

    /**
     * Get waste records by date range
     * GET /api/inventory/waste/date-range?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<WasteRecord>> getWasteRecordsByDateRange(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("Getting waste records from {} to {} for store: {}", startDate, endDate, storeId);
        List<WasteRecord> records = wasteAnalysisService.getWasteRecordsByDateRange(storeId, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    /**
     * Get waste records by category
     * GET /api/inventory/waste/category/{category}?storeId=xxx
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<WasteRecord>> getWasteRecordsByCategory(
            @PathVariable String category,
            @RequestParam String storeId) {
        logger.info("Getting waste records for category: {} in store: {}", category, storeId);
        List<WasteRecord> records = wasteAnalysisService.getWasteRecordsByCategory(storeId, category);
        return ResponseEntity.ok(records);
    }

    /**
     * Update waste record
     * PUT /api/inventory/waste/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<WasteRecord> updateWasteRecord(
            @PathVariable String id,
            @RequestBody WasteRecord wasteRecord) {
        logger.info("Updating waste record: {}", id);
        wasteRecord.setId(id);
        WasteRecord updated = wasteAnalysisService.updateWasteRecord(wasteRecord);
        return ResponseEntity.ok(updated);
    }

    /**
     * Approve waste record
     * PATCH /api/inventory/waste/{id}/approve
     * Body: { "approverId": "userId" }
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<WasteRecord> approveWasteRecord(
            @PathVariable String id,
            @RequestBody WasteApprovalRequest request) {
        logger.info("Approving waste record: {}", id);
        WasteRecord approved = wasteAnalysisService.approveWasteRecord(id, request.getApproverId());
        return ResponseEntity.ok(approved);
    }

    /**
     * Delete waste record
     * DELETE /api/inventory/waste/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteWasteRecord(@PathVariable String id) {
        logger.info("Deleting waste record: {}", id);
        wasteAnalysisService.deleteWasteRecord(id);

        return ResponseEntity.ok(new MessageResponse("Waste record deleted successfully"));
    }

    /**
     * Get total waste cost
     * GET /api/inventory/waste/total-cost?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/total-cost")
    public ResponseEntity<WasteSummaryResponse> getTotalWasteCost(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("Getting total waste cost from {} to {} for store: {}", startDate, endDate, storeId);
        BigDecimal totalCost = wasteAnalysisService.getTotalWasteCost(storeId, startDate, endDate);

        return ResponseEntity.ok(new WasteSummaryResponse(totalCost));
    }

    /**
     * Get waste cost by category
     * GET /api/inventory/waste/cost-by-category?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/cost-by-category")
    public ResponseEntity<Map<String, BigDecimal>> getWasteCostByCategory(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("Getting waste cost by category from {} to {} for store: {}", startDate, endDate, storeId);
        Map<String, BigDecimal> costByCategory = wasteAnalysisService.getWasteCostByCategory(storeId, startDate, endDate);
        return ResponseEntity.ok(costByCategory);
    }

    /**
     * Get top wasted items
     * GET /api/inventory/waste/top-items?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31&limit=10
     */
    @GetMapping("/top-items")
    public ResponseEntity<List<Map<String, Object>>> getTopWastedItems(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") Integer limit) {
        logger.info("Getting top {} wasted items from {} to {} for store: {}", limit, startDate, endDate, storeId);
        List<Map<String, Object>> topItems = wasteAnalysisService.getTopWastedItems(storeId, startDate, endDate, limit);
        return ResponseEntity.ok(topItems);
    }

    /**
     * Get preventable waste analysis
     * GET /api/inventory/waste/preventable-analysis?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/preventable-analysis")
    public ResponseEntity<Map<String, Object>> getPreventableWasteAnalysis(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("Getting preventable waste analysis from {} to {} for store: {}", startDate, endDate, storeId);
        Map<String, Object> analysis = wasteAnalysisService.getPreventableWasteAnalysis(storeId, startDate, endDate);
        return ResponseEntity.ok(analysis);
    }

    /**
     * Get waste trend (monthly)
     * GET /api/inventory/waste/trend?storeId=xxx&months=6
     */
    @GetMapping("/trend")
    public ResponseEntity<List<Map<String, Object>>> getWasteTrend(
            @RequestParam String storeId,
            @RequestParam(defaultValue = "6") Integer months) {
        logger.info("Getting waste trend for last {} months for store: {}", months, storeId);
        List<Map<String, Object>> trend = wasteAnalysisService.getWasteTrend(storeId, months);
        return ResponseEntity.ok(trend);
    }
}
