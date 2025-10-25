package com.MaSoVa.inventory.service;

import com.MaSoVa.inventory.entity.Supplier;
import com.MaSoVa.inventory.repository.SupplierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing suppliers
 */
@Service
public class SupplierService {

    private static final Logger logger = LoggerFactory.getLogger(SupplierService.class);

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    /**
     * Create a new supplier
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public Supplier createSupplier(Supplier supplier) {
        logger.info("Creating new supplier: {}", supplier.getSupplierName());

        // Check if supplier code already exists
        if (supplier.getSupplierCode() != null &&
            supplierRepository.findBySupplierCode(supplier.getSupplierCode()).isPresent()) {
            throw new RuntimeException("Supplier code already exists: " + supplier.getSupplierCode());
        }

        // Generate supplier code if not provided
        if (supplier.getSupplierCode() == null) {
            supplier.setSupplierCode(generateSupplierCode(supplier.getSupplierName()));
        }

        return supplierRepository.save(supplier);
    }

    /**
     * Get supplier by ID
     */
    public Supplier getSupplierById(String id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found: " + id));
    }

    /**
     * Get supplier by code
     */
    public Supplier getSupplierByCode(String supplierCode) {
        return supplierRepository.findBySupplierCode(supplierCode)
                .orElseThrow(() -> new RuntimeException("Supplier not found with code: " + supplierCode));
    }

    /**
     * Get all suppliers
     */
    @Cacheable(value = "suppliers", key = "'all'")
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    /**
     * Get active suppliers
     */
    @Cacheable(value = "suppliers", key = "'active'")
    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByStatus("ACTIVE");
    }

    /**
     * Get preferred suppliers
     */
    public List<Supplier> getPreferredSuppliers() {
        return supplierRepository.findByStatusAndIsPreferred("ACTIVE", true);
    }

    /**
     * Get reliable suppliers
     */
    public List<Supplier> getReliableSuppliers() {
        return supplierRepository.findReliableSuppliers();
    }

    /**
     * Get suppliers by category
     */
    public List<Supplier> getSuppliersByCategory(String category) {
        return supplierRepository.findByCategorySupplied(category);
    }

    /**
     * Search suppliers by name
     */
    public List<Supplier> searchSuppliers(String searchTerm) {
        return supplierRepository.searchByName(searchTerm);
    }

    /**
     * Update supplier
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public Supplier updateSupplier(Supplier supplier) {
        logger.info("Updating supplier: {}", supplier.getId());

        // Verify supplier exists
        Supplier existing = getSupplierById(supplier.getId());

        // If changing supplier code, check it's not already taken
        if (!existing.getSupplierCode().equals(supplier.getSupplierCode()) &&
            supplierRepository.findBySupplierCode(supplier.getSupplierCode()).isPresent()) {
            throw new RuntimeException("Supplier code already exists: " + supplier.getSupplierCode());
        }

        return supplierRepository.save(supplier);
    }

    /**
     * Update supplier status
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public Supplier updateSupplierStatus(String supplierId, String status) {
        logger.info("Updating supplier {} status to: {}", supplierId, status);

        Supplier supplier = getSupplierById(supplierId);
        supplier.setStatus(status);

        return supplierRepository.save(supplier);
    }

    /**
     * Mark supplier as preferred
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public Supplier markAsPreferred(String supplierId, Boolean isPreferred) {
        logger.info("Setting supplier {} preferred status to: {}", supplierId, isPreferred);

        Supplier supplier = getSupplierById(supplierId);
        supplier.setIsPreferred(isPreferred);

        return supplierRepository.save(supplier);
    }

    /**
     * Update supplier performance metrics
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public Supplier updatePerformanceMetrics(String supplierId,
                                              Integer completedOrders,
                                              Integer cancelledOrders,
                                              Double onTimeDeliveryRate,
                                              Double qualityRating) {
        logger.info("Updating performance metrics for supplier: {}", supplierId);

        Supplier supplier = getSupplierById(supplierId);

        if (completedOrders != null) {
            supplier.setCompletedOrders(supplier.getCompletedOrders() + completedOrders);
        }

        if (cancelledOrders != null) {
            supplier.setCancelledOrders(supplier.getCancelledOrders() + cancelledOrders);
        }

        if (onTimeDeliveryRate != null) {
            supplier.setOnTimeDeliveryRate(onTimeDeliveryRate);
        }

        if (qualityRating != null) {
            supplier.setQualityRating(qualityRating);
        }

        return supplierRepository.save(supplier);
    }

    /**
     * Delete supplier
     */
    @CacheEvict(value = "suppliers", allEntries = true)
    public void deleteSupplier(String supplierId) {
        logger.info("Deleting supplier: {}", supplierId);

        // Check if supplier has active purchase orders (would need PurchaseOrderRepository)
        // For now, just delete

        supplierRepository.deleteById(supplierId);
    }

    /**
     * Get supplier comparison by category
     * Returns suppliers that supply the given category, sorted by performance
     */
    public List<Supplier> compareSuppliersByCategory(String category) {
        List<Supplier> suppliers = supplierRepository.findByCategorySupplied(category);

        // Sort by a combination of quality rating and on-time delivery
        return suppliers.stream()
                .filter(s -> s.getStatus().equals("ACTIVE"))
                .sorted((s1, s2) -> {
                    Double score1 = (s1.getQualityRating() * 0.5) + (s1.getOnTimeDeliveryRate() * 0.005);
                    Double score2 = (s2.getQualityRating() * 0.5) + (s2.getOnTimeDeliveryRate() * 0.005);
                    return score2.compareTo(score1); // Descending order
                })
                .collect(Collectors.toList());
    }

    /**
     * Generate unique supplier code
     */
    private String generateSupplierCode(String supplierName) {
        String prefix = supplierName.substring(0, Math.min(3, supplierName.length())).toUpperCase();
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
        return prefix + "-" + timestamp;
    }

    /**
     * Get suppliers by city (useful for local sourcing)
     */
    public List<Supplier> getSuppliersByCity(String city) {
        return supplierRepository.findByCity(city);
    }
}
