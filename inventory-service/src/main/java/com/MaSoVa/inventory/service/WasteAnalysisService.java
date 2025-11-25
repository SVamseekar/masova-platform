package com.MaSoVa.inventory.service;

import com.MaSoVa.inventory.entity.InventoryItem;
import com.MaSoVa.inventory.entity.WasteRecord;
import com.MaSoVa.inventory.repository.WasteRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for tracking and analyzing waste
 */
@Service
public class WasteAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(WasteAnalysisService.class);

    private final WasteRecordRepository wasteRecordRepository;
    private final InventoryService inventoryService;

    public WasteAnalysisService(WasteRecordRepository wasteRecordRepository,
                                InventoryService inventoryService) {
        this.wasteRecordRepository = wasteRecordRepository;
        this.inventoryService = inventoryService;
    }

    /**
     * Record waste
     */
    @Transactional
    public WasteRecord recordWaste(WasteRecord wasteRecord) {
        logger.info("Recording waste for item: {} in store: {}",
            wasteRecord.getItemName(), wasteRecord.getStoreId());

        // Get inventory item to fetch current cost
        InventoryItem item = inventoryService.getInventoryItemById(wasteRecord.getInventoryItemId());

        // Set unit cost and calculate total
        if (wasteRecord.getUnitCost() == null) {
            wasteRecord.setUnitCost(item.getAverageCost());
        }
        wasteRecord.calculateTotalCost();

        // Reduce inventory stock
        inventoryService.adjustStock(
            item.getId(),
            -wasteRecord.getQuantity(),
            wasteRecord.getStoreId(),
            null,
            wasteRecord.getReportedBy(),
            "Waste: " + wasteRecord.getWasteCategory()
        );

        return wasteRecordRepository.save(wasteRecord);
    }

    /**
     * Get waste record by ID
     */
    public WasteRecord getWasteRecordById(String id) {
        return wasteRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Waste record not found: " + id));
    }

    /**
     * Get all waste records for a store
     */
    public List<WasteRecord> getAllWasteRecords(String storeId) {
        return wasteRecordRepository.findByStoreId(storeId);
    }

    /**
     * Get waste records by date range
     */
    public List<WasteRecord> getWasteRecordsByDateRange(String storeId, LocalDate startDate, LocalDate endDate) {
        return wasteRecordRepository.findByStoreIdAndDateRange(storeId, startDate, endDate);
    }

    /**
     * Get waste records by category
     */
    public List<WasteRecord> getWasteRecordsByCategory(String storeId, String category) {
        return wasteRecordRepository.findByStoreIdAndWasteCategory(storeId, category);
    }

    /**
     * Update waste record
     */
    public WasteRecord updateWasteRecord(WasteRecord wasteRecord) {
        logger.info("Updating waste record: {}", wasteRecord.getId());

        // Verify exists
        getWasteRecordById(wasteRecord.getId());

        // Recalculate total cost
        wasteRecord.calculateTotalCost();

        return wasteRecordRepository.save(wasteRecord);
    }

    /**
     * Approve waste record
     */
    public WasteRecord approveWasteRecord(String wasteRecordId, String approverId) {
        logger.info("Approving waste record: {} by user: {}", wasteRecordId, approverId);

        WasteRecord record = getWasteRecordById(wasteRecordId);
        record.setApprovedBy(approverId);
        record.setApprovedAt(java.time.LocalDateTime.now());

        return wasteRecordRepository.save(record);
    }

    /**
     * Delete waste record
     */
    public void deleteWasteRecord(String wasteRecordId) {
        logger.info("Deleting waste record: {}", wasteRecordId);
        wasteRecordRepository.deleteById(wasteRecordId);
    }

    /**
     * Calculate total waste cost for a date range
     */
    public BigDecimal getTotalWasteCost(String storeId, LocalDate startDate, LocalDate endDate) {
        List<WasteRecord> records = wasteRecordRepository.findByStoreIdAndDateRange(storeId, startDate, endDate);

        return records.stream()
                .map(WasteRecord::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get waste cost by category
     */
    public Map<String, BigDecimal> getWasteCostByCategory(String storeId, LocalDate startDate, LocalDate endDate) {
        List<WasteRecord> records = wasteRecordRepository.findByStoreIdAndDateRange(storeId, startDate, endDate);

        return records.stream()
                .collect(Collectors.groupingBy(
                    WasteRecord::getWasteCategory,
                    Collectors.reducing(
                        BigDecimal.ZERO,
                        WasteRecord::getTotalCost,
                        BigDecimal::add
                    )
                ));
    }

    /**
     * Get top wasted items
     */
    public List<Map<String, Object>> getTopWastedItems(String storeId, LocalDate startDate, LocalDate endDate, Integer limit) {
        List<WasteRecord> records = wasteRecordRepository.findTopWastedItems(storeId, startDate, endDate);

        // Group by item and calculate total waste per item
        Map<String, WasteItemSummary> wasteSummary = new HashMap<>();

        for (WasteRecord record : records) {
            String itemId = record.getInventoryItemId();
            WasteItemSummary summary = wasteSummary.getOrDefault(itemId, new WasteItemSummary());

            summary.itemId = itemId;
            summary.itemName = record.getItemName();
            summary.totalQuantity += record.getQuantity();
            summary.totalCost = summary.totalCost.add(record.getTotalCost());
            summary.wasteCount++;

            wasteSummary.put(itemId, summary);
        }

        // Convert to list and sort by total cost
        return wasteSummary.values().stream()
                .sorted((a, b) -> b.totalCost.compareTo(a.totalCost))
                .limit(limit != null ? limit : 10)
                .map(summary -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("itemId", summary.itemId);
                    map.put("itemName", summary.itemName);
                    map.put("totalQuantity", summary.totalQuantity);
                    map.put("totalCost", summary.totalCost);
                    map.put("wasteCount", summary.wasteCount);
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get preventable waste analysis
     */
    public Map<String, Object> getPreventableWasteAnalysis(String storeId, LocalDate startDate, LocalDate endDate) {
        List<WasteRecord> allRecords = wasteRecordRepository.findByStoreIdAndDateRange(storeId, startDate, endDate);
        List<WasteRecord> preventableRecords = wasteRecordRepository.findByStoreIdAndPreventable(storeId, true);

        preventableRecords = preventableRecords.stream()
                .filter(r -> !r.getWasteDate().isBefore(startDate) && !r.getWasteDate().isAfter(endDate))
                .collect(Collectors.toList());

        BigDecimal totalWasteCost = allRecords.stream()
                .map(WasteRecord::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal preventableWasteCost = preventableRecords.stream()
                .map(WasteRecord::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double preventablePercentage = totalWasteCost.compareTo(BigDecimal.ZERO) > 0
                ? preventableWasteCost.divide(totalWasteCost, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        Map<String, Object> analysis = new HashMap<>();
        analysis.put("totalWasteCost", totalWasteCost);
        analysis.put("preventableWasteCost", preventableWasteCost);
        analysis.put("preventablePercentage", preventablePercentage);
        analysis.put("totalWasteCount", allRecords.size());
        analysis.put("preventableWasteCount", preventableRecords.size());

        return analysis;
    }

    /**
     * Get waste trend (monthly aggregation)
     */
    public List<Map<String, Object>> getWasteTrend(String storeId, Integer months) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months);

        List<WasteRecord> records = wasteRecordRepository.findByStoreIdAndDateRange(storeId, startDate, endDate);

        // Group by month
        Map<String, MonthlyWaste> monthlyWaste = new HashMap<>();

        for (WasteRecord record : records) {
            String monthKey = record.getWasteDate().getYear() + "-" +
                    String.format("%02d", record.getWasteDate().getMonthValue());

            MonthlyWaste monthly = monthlyWaste.getOrDefault(monthKey, new MonthlyWaste());
            monthly.month = monthKey;
            monthly.totalCost = monthly.totalCost.add(record.getTotalCost());
            monthly.wasteCount++;

            monthlyWaste.put(monthKey, monthly);
        }

        return monthlyWaste.values().stream()
                .sorted((a, b) -> a.month.compareTo(b.month))
                .map(monthly -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("month", monthly.month);
                    map.put("totalCost", monthly.totalCost);
                    map.put("wasteCount", monthly.wasteCount);
                    return map;
                })
                .collect(Collectors.toList());
    }

    // Helper classes for aggregation
    private static class WasteItemSummary {
        String itemId;
        String itemName;
        Double totalQuantity = 0.0;
        BigDecimal totalCost = BigDecimal.ZERO;
        Integer wasteCount = 0;
    }

    private static class MonthlyWaste {
        String month;
        BigDecimal totalCost = BigDecimal.ZERO;
        Integer wasteCount = 0;
    }
}
