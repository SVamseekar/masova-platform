package com.MaSoVa.inventory.repository;

import com.MaSoVa.inventory.entity.WasteRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for WasteRecord entity
 */
@Repository
public interface WasteRecordRepository extends MongoRepository<WasteRecord, String> {

    /**
     * Find all waste records by store
     */
    List<WasteRecord> findByStoreId(String storeId);

    /**
     * Find waste records by store and date range
     */
    @Query("{ 'storeId': ?0, 'wasteDate': { $gte: ?1, $lte: ?2 } }")
    List<WasteRecord> findByStoreIdAndDateRange(String storeId, LocalDate startDate, LocalDate endDate);

    /**
     * Find waste records by inventory item
     */
    List<WasteRecord> findByInventoryItemId(String inventoryItemId);

    /**
     * Find waste records by category
     */
    List<WasteRecord> findByStoreIdAndWasteCategory(String storeId, String wasteCategory);

    /**
     * Find preventable waste records
     */
    List<WasteRecord> findByStoreIdAndPreventable(String storeId, Boolean preventable);

    /**
     * Find waste records reported by user
     * @deprecated Use findByStoreIdAndReportedBy for store data isolation
     */
    @Deprecated
    List<WasteRecord> findByReportedBy(String userId);

    /**
     * Week 4: Store-aware query for waste records by reporter
     */
    List<WasteRecord> findByStoreIdAndReportedBy(String storeId, String userId);

    /**
     * Calculate total waste cost by store and date range
     */
    @Query(value = "{ 'storeId': ?0, 'wasteDate': { $gte: ?1, $lte: ?2 } }",
           fields = "{ 'totalCost': 1 }")
    List<WasteRecord> findWasteCostByDateRange(String storeId, LocalDate startDate, LocalDate endDate);

    /**
     * Find top wasted items
     */
    @Query("{ 'storeId': ?0, 'wasteDate': { $gte: ?1, $lte: ?2 } }")
    List<WasteRecord> findTopWastedItems(String storeId, LocalDate startDate, LocalDate endDate);

    /**
     * Find waste records by batch number
     */
    List<WasteRecord> findByBatchNumber(String batchNumber);
}
