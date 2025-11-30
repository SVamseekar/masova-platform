package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.user.repository.StoreRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
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
    
    // @CacheEvict(value = "stores", key = "#p0.id")
    public Store saveStore(Store store) {
        store.setLastModified(LocalDateTime.now());
        return storeRepository.save(store);
    }
    
    public boolean validateStoreOperational(String storeId) {
        Store store = getStore(storeId);
        return store.isOperational(LocalDateTime.now());
    }
    
    public Map<String, Object> getStoreMetrics(String storeId) {
        try {
            logger.debug("Getting metrics for store: {}", storeId);
            Store store = getStore(storeId);
            logger.debug("Store found: {}", store.getName());

            Map<String, Object> metrics = new HashMap<>();

            metrics.put("storeId", storeId);
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
                logger.warn("Store {} has no configuration", storeId);
                metrics.put("deliveryRadius", 0.0);
                metrics.put("maxConcurrentOrders", 0);
            }

            logger.debug("Successfully generated metrics for store: {}", storeId);
            return metrics;

        } catch (Exception e) {
            logger.error("Error getting metrics for store {}: {}", storeId, e.getMessage(), e);
            throw e;
        }
    }
}