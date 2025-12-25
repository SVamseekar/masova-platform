package com.MaSoVa.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Manager Notification Service - NOTIF-005
 *
 * Handles manager-specific notifications:
 * - Low stock alerts
 * - Daily sales summary emails
 * - Critical system alerts
 */
@Service
public class ManagerNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ManagerNotificationService.class);

    @Autowired
    private EmailService emailService;

    @Autowired
    private RestTemplate restTemplate;

    // ======================== LOW STOCK ALERTS ========================

    /**
     * Send low stock alert to store managers
     * Called by inventory-service when stock falls below threshold
     */
    @Async
    public void sendLowStockAlert(String storeId, String storeName, List<LowStockItem> lowStockItems) {
        log.info("Sending low stock alert for store: {} with {} items", storeName, lowStockItems.size());

        try {
            // Build alert content
            StringBuilder itemList = new StringBuilder();
            for (LowStockItem item : lowStockItems) {
                itemList.append(String.format("- %s: %d remaining (threshold: %d)%n",
                        item.getItemName(),
                        item.getCurrentStock(),
                        item.getThreshold()));
            }

            String subject = String.format("[ALERT] Low Stock Alert - %s", storeName);
            String body = String.format("""
                Low Stock Alert
                ===============

                Store: %s
                Time: %s

                The following items are running low:

                %s

                Please reorder these items to avoid stockouts.

                ---
                MaSoVa Restaurant Management System
                """,
                    storeName,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    itemList.toString()
            );

            // Get manager emails for this store
            List<String> managerEmails = getManagerEmailsForStore(storeId);

            for (String email : managerEmails) {
                emailService.sendEmail(email, subject, body);
            }

            log.info("Low stock alert sent to {} managers for store: {}", managerEmails.size(), storeName);

        } catch (Exception e) {
            log.error("Failed to send low stock alert for store: {}", storeName, e);
        }
    }

    /**
     * Send critical low stock alert (stock at zero)
     */
    @Async
    public void sendCriticalStockAlert(String storeId, String storeName, String itemName) {
        log.warn("CRITICAL: Item '{}' is out of stock at {}", itemName, storeName);

        try {
            String subject = String.format("[CRITICAL] Out of Stock - %s - %s", itemName, storeName);
            String body = String.format("""
                CRITICAL STOCK ALERT
                ====================

                Store: %s
                Item: %s
                Current Stock: 0 (OUT OF STOCK)
                Time: %s

                IMMEDIATE ACTION REQUIRED:
                This item is completely out of stock and cannot be sold.

                Please:
                1. Check if there's any stock in reserve
                2. Place an emergency order with supplier
                3. Consider temporarily removing item from menu

                ---
                MaSoVa Restaurant Management System
                """,
                    storeName,
                    itemName,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            );

            List<String> managerEmails = getManagerEmailsForStore(storeId);

            for (String email : managerEmails) {
                emailService.sendEmail(email, subject, body);
            }

        } catch (Exception e) {
            log.error("Failed to send critical stock alert for item: {} at store: {}", itemName, storeName, e);
        }
    }

    // ======================== DAILY SALES SUMMARY ========================

    /**
     * Scheduled job to send daily sales summary to managers
     * Runs at 11 PM every day
     */
    @Scheduled(cron = "0 0 23 * * ?")
    public void sendDailySalesSummary() {
        log.info("Starting daily sales summary job");

        try {
            // Get all active stores
            List<Map<String, Object>> stores = getAllActiveStores();

            for (Map<String, Object> store : stores) {
                String storeId = (String) store.get("id");
                String storeName = (String) store.get("name");

                sendStoreDailySummary(storeId, storeName);
            }

            log.info("Daily sales summary completed for {} stores", stores.size());

        } catch (Exception e) {
            log.error("Failed to send daily sales summaries", e);
        }
    }

    /**
     * Send daily summary for a specific store
     */
    @Async
    public void sendStoreDailySummary(String storeId, String storeName) {
        try {
            // Fetch sales data from analytics service
            Map<String, Object> salesData = fetchDailySalesData(storeId);

            String subject = String.format("Daily Sales Summary - %s - %s", storeName, LocalDate.now());
            String body = buildDailySummaryEmail(storeName, salesData);

            List<String> managerEmails = getManagerEmailsForStore(storeId);

            for (String email : managerEmails) {
                emailService.sendEmail(email, subject, body);
            }

            log.info("Daily sales summary sent to {} managers for store: {}", managerEmails.size(), storeName);

        } catch (Exception e) {
            log.error("Failed to send daily summary for store: {}", storeName, e);
        }
    }

    private String buildDailySummaryEmail(String storeName, Map<String, Object> salesData) {
        Double totalSales = (Double) salesData.getOrDefault("totalSales", 0.0);
        Integer totalOrders = (Integer) salesData.getOrDefault("totalOrders", 0);
        Double avgOrderValue = (Double) salesData.getOrDefault("avgOrderValue", 0.0);
        String topSellingItem = (String) salesData.getOrDefault("topSellingItem", "N/A");
        String peakHour = (String) salesData.getOrDefault("peakHour", "N/A");

        return String.format("""
            Daily Sales Summary
            ===================

            Store: %s
            Date: %s

            KEY METRICS
            -----------
            Total Sales: Rs. %.2f
            Total Orders: %d
            Average Order Value: Rs. %.2f

            HIGHLIGHTS
            ----------
            Top Selling Item: %s
            Peak Hour: %s

            For detailed analytics, please visit the Manager Dashboard.

            ---
            MaSoVa Restaurant Management System
            """,
                storeName,
                LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")),
                totalSales,
                totalOrders,
                avgOrderValue,
                topSellingItem,
                peakHour
        );
    }

    // ======================== SYSTEM ALERTS ========================

    /**
     * Send system alert to managers (e.g., payment gateway issues, service outages)
     */
    @Async
    public void sendSystemAlert(String storeId, String alertType, String message, AlertSeverity severity) {
        log.info("Sending system alert: {} - severity: {}", alertType, severity);

        try {
            String severityPrefix = switch (severity) {
                case CRITICAL -> "[CRITICAL]";
                case HIGH -> "[HIGH]";
                case MEDIUM -> "[MEDIUM]";
                default -> "[INFO]";
            };

            String subject = String.format("%s System Alert - %s", severityPrefix, alertType);
            String body = String.format("""
                System Alert
                ============

                Type: %s
                Severity: %s
                Time: %s

                Details:
                %s

                Please investigate and take appropriate action.

                ---
                MaSoVa Restaurant Management System
                """,
                    alertType,
                    severity,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    message
            );

            List<String> managerEmails;
            if (storeId != null) {
                managerEmails = getManagerEmailsForStore(storeId);
            } else {
                // System-wide alert - notify all managers
                managerEmails = getAllManagerEmails();
            }

            for (String email : managerEmails) {
                emailService.sendEmail(email, subject, body);
            }

        } catch (Exception e) {
            log.error("Failed to send system alert: {}", alertType, e);
        }
    }

    // ======================== HELPER METHODS ========================

    private List<String> getManagerEmailsForStore(String storeId) {
        // In production, this would call user-service to get manager emails
        // For now, return placeholder
        try {
            // Example REST call to user-service
            // ResponseEntity<List<String>> response = restTemplate.exchange(
            //     userServiceUrl + "/api/users/store/" + storeId + "/managers/emails",
            //     HttpMethod.GET, null, new ParameterizedTypeReference<List<String>>() {}
            // );
            // return response.getBody();

            log.debug("Would fetch manager emails for store: {}", storeId);
            return List.of(); // Placeholder
        } catch (Exception e) {
            log.error("Failed to fetch manager emails for store: {}", storeId, e);
            return List.of();
        }
    }

    private List<String> getAllManagerEmails() {
        // Fetch all manager emails across all stores
        log.debug("Would fetch all manager emails");
        return List.of();
    }

    private List<Map<String, Object>> getAllActiveStores() {
        // Fetch active stores from user-service
        log.debug("Would fetch all active stores");
        return List.of();
    }

    private Map<String, Object> fetchDailySalesData(String storeId) {
        // Fetch from analytics-service
        try {
            // Example REST call
            // String url = analyticsServiceUrl + "/api/analytics/sales/today?storeId=" + storeId;
            // return restTemplate.getForObject(url, Map.class);

            return new HashMap<>(); // Placeholder
        } catch (Exception e) {
            log.error("Failed to fetch sales data for store: {}", storeId, e);
            return new HashMap<>();
        }
    }

    // ======================== ENUMS AND DTOs ========================

    public enum AlertSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public static class LowStockItem {
        private String itemId;
        private String itemName;
        private int currentStock;
        private int threshold;

        public LowStockItem() {}

        public LowStockItem(String itemId, String itemName, int currentStock, int threshold) {
            this.itemId = itemId;
            this.itemName = itemName;
            this.currentStock = currentStock;
            this.threshold = threshold;
        }

        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }

        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }

        public int getCurrentStock() { return currentStock; }
        public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }

        public int getThreshold() { return threshold; }
        public void setThreshold(int threshold) { this.threshold = threshold; }
    }
}
