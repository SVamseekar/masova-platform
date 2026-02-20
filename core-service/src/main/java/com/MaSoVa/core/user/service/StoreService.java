package com.MaSoVa.core.user.service;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.core.user.repository.StoreRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class StoreService {

    private static final Logger logger = LoggerFactory.getLogger(StoreService.class);

    @Autowired
    private StoreRepository storeRepository;
    
    // @Cacheable(value = "stores", key = "#p0")
    public Store getStore(String storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found: " + storeId));
    }
    
    public Store getStoreByCode(String storeCode) {
        return storeRepository.findByCode(storeCode)
                .orElseThrow(() -> new RuntimeException("Store not found with code: " + storeCode));
    }
    
    public List<Store> getActiveStores() {
        return storeRepository.findByStatus(StoreStatus.ACTIVE);
    }
    
    public List<Store> getStoresByRegion(String regionId) {
        return storeRepository.findByRegionId(regionId);
    }
    
    public List<Store> getStoresInDeliveryRadius(double latitude, double longitude) {
        List<Store> allStores = getActiveStores();
        return allStores.stream()
                .filter(store -> store.isWithinDeliveryRadius(latitude, longitude))
                .toList();
    }
    
    public Map<String, Object> checkDeliveryRadius(String storeId, double latitude, double longitude) {
        Store store = getStore(storeId);
        boolean within = store.isWithinDeliveryRadius(latitude, longitude);
        double radiusKm = store.getConfiguration() != null
            ? store.getConfiguration().getDeliveryRadiusKm()
            : 5.0;
        return Map.of(
            "withinRadius", within,
            "storeId", storeId,
            "deliveryRadiusKm", radiusKm,
            "latitude", latitude,
            "longitude", longitude
        );
    }

    // @CacheEvict(value = "stores", key = "#p0.id")
    public Store saveStore(Store store) {
        store.setLastModified(LocalDateTime.now());
        return storeRepository.save(store);
    }
    
    public boolean validateStoreOperational(String storeId) {
        Store store = getStore(storeId);
        return store.isOperational(LocalDateTime.now());
    }
    
    public Map<String, Object> getStoreMetrics(String storeCode) {
        try {
            logger.debug("Getting metrics for store: {}", storeCode);
            // Use getStoreByCode since storeCode (like DOM001) is passed, not MongoDB _id
            Store store = getStoreByCode(storeCode);
            logger.debug("Store found: {}", store.getName());

            Map<String, Object> metrics = new HashMap<>();

            metrics.put("storeId", storeCode);
            metrics.put("storeName", store.getName());

            try {
                boolean isOperational = store.isOperational(LocalDateTime.now());
                metrics.put("isOperational", isOperational);
                logger.debug("Store operational status: {}", isOperational);
            } catch (Exception e) {
                logger.error("Error checking operational status: {}", e.getMessage(), e);
                metrics.put("isOperational", false);
            }

            metrics.put("status", store.getStatus());

            if (store.getConfiguration() != null) {
                metrics.put("deliveryRadius", store.getConfiguration().getDeliveryRadiusKm());
                metrics.put("maxConcurrentOrders", store.getConfiguration().getMaxConcurrentOrders());
            } else {
                logger.warn("Store {} has no configuration", storeCode);
                metrics.put("deliveryRadius", 0.0);
                metrics.put("maxConcurrentOrders", 0);
            }

            logger.debug("Successfully generated metrics for store: {}", storeCode);
            return metrics;

        } catch (Exception e) {
            logger.error("Error getting metrics for store {}: {}", storeCode, e.getMessage(), e);
            throw e;
        }
    }
}