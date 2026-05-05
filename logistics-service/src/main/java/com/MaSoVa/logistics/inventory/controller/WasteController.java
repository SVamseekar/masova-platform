package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.dto.response.WasteSummaryResponse;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.service.WasteAnalysisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Waste — 6 canonical endpoints at /api/waste.
 * Replaces: /api/inventory/waste/* (path moved to /api/waste for gateway clarity),
 *           /date-range, /category/{cat}, /total-cost, /cost-by-category,
 *           /top-items, /preventable-analysis, /trend, PUT /{id}
 */
@RestController
@RequestMapping("/api/waste")
@Tag(name = "Waste", description = "Waste tracking and analysis")
@SecurityRequirement(name = "bearerAuth")
public class WasteController {

    private static final Logger log = LoggerFactory.getLogger(WasteController.class);

    private final WasteAnalysisService wasteAnalysisService;

    public WasteController(WasteAnalysisService wasteAnalysisService) {
        this.wasteAnalysisService = wasteAnalysisService;
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

    // ── LIST ──────────────────────────────────────────────────────────────────────

    /**
     * GET /api/waste?category=&startDate=&endDate=
     * Replaces: /, /date-range, /category/{cat}
     */
    @GetMapping
    @Operation(summary = "List waste records (query: category, startDate, endDate)")
    public ResponseEntity<List<WasteRecord>> getWaste(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(wasteAnalysisService.getWasteRecordsByDateRange(storeId, startDate, endDate));
        }
        if (category != null) {
            return ResponseEntity.ok(wasteAnalysisService.getWasteRecordsByCategory(storeId, category));
        }
        return ResponseEntity.ok(wasteAnalysisService.getAllWasteRecords(storeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Record waste")
    public ResponseEntity<WasteRecord> record(@RequestBody WasteRecord wasteRecord) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wasteAnalysisService.recordWaste(wasteRecord));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get waste record by ID")
    public ResponseEntity<WasteRecord> getById(@PathVariable String id) {
        return ResponseEntity.ok(wasteAnalysisService.getWasteRecordById(id));
    }

    /**
     * PATCH /api/waste/{id}
     * Body: { approverId: "..." } to approve, or plain fields for update.
     * Replaces: PUT /{id}, PATCH /{id}/approve
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update or approve waste record (body: approverId to approve)")
    public ResponseEntity<WasteRecord> update(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        if (body.containsKey("approverId")) {
            return ResponseEntity.ok(wasteAnalysisService.approveWasteRecord(id, (String) body.get("approverId")));
        }
        WasteRecord record = wasteAnalysisService.getWasteRecordById(id);
        // Apply body fields to the fetched record
        if (body.containsKey("itemName")) record.setItemName((String) body.get("itemName"));
        if (body.containsKey("quantity") && body.get("quantity") instanceof Number n) record.setQuantity(n.doubleValue());
        if (body.containsKey("unit")) record.setUnit((String) body.get("unit"));
        if (body.containsKey("wasteCategory")) record.setWasteCategory((String) body.get("wasteCategory"));
        if (body.containsKey("wasteReason")) record.setWasteReason((String) body.get("wasteReason"));
        if (body.containsKey("notes")) record.setNotes((String) body.get("notes"));
        if (body.containsKey("preventable") && body.get("preventable") instanceof Boolean b) record.setPreventable(b);
        if (body.containsKey("preventionNotes")) record.setPreventionNotes((String) body.get("preventionNotes"));
        record.setId(id);
        return ResponseEntity.ok(wasteAnalysisService.updateWasteRecord(record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Delete waste record")
    public ResponseEntity<MessageResponse> delete(@PathVariable String id) {
        wasteAnalysisService.deleteWasteRecord(id);
        return ResponseEntity.ok(new MessageResponse("Waste record deleted successfully"));
    }

    // ── ANALYTICS ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/waste/analytics?type=total-cost|cost-by-category|top-items|preventable|trend
     *                         &startDate=&endDate=&limit=10&months=6
     * Replaces: /total-cost, /cost-by-category, /top-items, /preventable-analysis, /trend
     */
    @GetMapping("/analytics")
    @Operation(summary = "Waste analytics (query: type=total-cost|cost-by-category|top-items|preventable|trend)")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false, defaultValue = "6") Integer months,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return switch (type != null ? type : "") {
            case "total-cost" -> ResponseEntity.ok(new WasteSummaryResponse(
                    wasteAnalysisService.getTotalWasteCost(storeId, startDate, endDate)));
            case "cost-by-category" -> ResponseEntity.ok(
                    wasteAnalysisService.getWasteCostByCategory(storeId, startDate, endDate));
            case "top-items" -> ResponseEntity.ok(
                    wasteAnalysisService.getTopWastedItems(storeId, startDate, endDate, limit));
            case "preventable" -> ResponseEntity.ok(
                    wasteAnalysisService.getPreventableWasteAnalysis(storeId, startDate, endDate));
            case "trend" -> ResponseEntity.ok(wasteAnalysisService.getWasteTrend(storeId, months));
            default -> ResponseEntity.badRequest().body(Map.of(
                    "error", "type required: total-cost|cost-by-category|top-items|preventable|trend"));
        };
    }
}
