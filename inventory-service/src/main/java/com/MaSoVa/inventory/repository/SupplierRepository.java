package com.MaSoVa.inventory.repository;

import com.MaSoVa.inventory.entity.Supplier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Supplier entity
 */
@Repository
public interface SupplierRepository extends MongoRepository<Supplier, String> {

    /**
     * Find supplier by unique code
     */
    Optional<Supplier> findBySupplierCode(String supplierCode);

    /**
     * Find suppliers by status
     */
    List<Supplier> findByStatus(String status);

    /**
     * Find preferred suppliers
     */
    List<Supplier> findByIsPreferred(Boolean isPreferred);

    /**
     * Find active preferred suppliers
     */
    List<Supplier> findByStatusAndIsPreferred(String status, Boolean isPreferred);

    /**
     * Find suppliers by category supplied
     */
    @Query("{ 'categoriesSupplied': { $in: [?0] } }")
    List<Supplier> findByCategorySupplied(String category);

    /**
     * Find suppliers by business type
     */
    List<Supplier> findByBusinessType(String businessType);

    /**
     * Search suppliers by name
     */
    @Query("{ 'supplierName': { $regex: ?0, $options: 'i' } }")
    List<Supplier> searchByName(String searchTerm);

    /**
     * Find reliable suppliers (high ratings and on-time delivery)
     */
    @Query("{ 'onTimeDeliveryRate': { $gte: 80 }, 'qualityRating': { $gte: 3.5 }, 'status': 'ACTIVE' }")
    List<Supplier> findReliableSuppliers();

    /**
     * Find suppliers by city
     */
    List<Supplier> findByCity(String city);
}
