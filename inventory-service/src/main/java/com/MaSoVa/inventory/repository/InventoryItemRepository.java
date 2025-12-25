package com.MaSoVa.inventory.repository;

import com.MaSoVa.inventory.entity.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for InventoryItem entity
 */
@Repository
public interface InventoryItemRepository extends MongoRepository<InventoryItem, String> {

    /**
     * Find all items by store ID
     */
    List<InventoryItem> findByStoreId(String storeId);

    /**
     * Find items by store and status
     */
    List<InventoryItem> findByStoreIdAndStatus(String storeId, String status);

    /**
     * Find items by store and category
     */
    List<InventoryItem> findByStoreIdAndCategory(String storeId, String category);

    /**
     * Find item by store and item code
     */
    Optional<InventoryItem> findByStoreIdAndItemCode(String storeId, String itemCode);

    /**
     * Find items that need reordering
     * (available stock <= minimum stock)
     */
    @Query("{ 'storeId': ?0, $expr: { $lte: [ { $subtract: ['$currentStock', '$reservedStock'] }, '$minimumStock' ] } }")
    List<InventoryItem> findItemsNeedingReorder(String storeId);

    /**
     * Find out of stock items
     */
    @Query("{ 'storeId': ?0, $expr: { $lte: [ { $subtract: ['$currentStock', '$reservedStock'] }, 0 ] } }")
    List<InventoryItem> findOutOfStockItems(String storeId);

    /**
     * Find items expiring soon (within specified days)
     */
    @Query("{ 'storeId': ?0, 'isPerishable': true, 'expiryDate': { $lte: ?1 } }")
    List<InventoryItem> findItemsExpiringSoon(String storeId, LocalDate date);

    /**
     * Find items by primary supplier
     */
    List<InventoryItem> findByPrimarySupplierId(String supplierId);

    /**
     * Find items with auto-reorder enabled
     */
    List<InventoryItem> findByStoreIdAndAutoReorder(String storeId, Boolean autoReorder);

    /**
     * Search items by name
     */
    @Query("{ 'storeId': ?0, 'itemName': { $regex: ?1, $options: 'i' } }")
    List<InventoryItem> searchByName(String storeId, String searchTerm);

    /**
     * Get all distinct store IDs
     */
    @Query(value = "{}", fields = "{ 'storeId': 1 }")
    List<InventoryItem> findAllStoreIds();
}
