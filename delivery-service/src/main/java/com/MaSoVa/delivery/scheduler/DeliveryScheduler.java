package com.MaSoVa.delivery.scheduler;

import com.MaSoVa.delivery.service.DriverAcceptanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for delivery service
 * DELIV-003: Driver Acceptance Flow - handles timeout processing
 */
@Component
public class DeliveryScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeliveryScheduler.class);

    private final DriverAcceptanceService driverAcceptanceService;

    public DeliveryScheduler(DriverAcceptanceService driverAcceptanceService) {
        this.driverAcceptanceService = driverAcceptanceService;
    }

    /**
     * Process expired acceptance timeouts every minute
     * Automatically reassigns deliveries that haven't been accepted within the timeout period
     */
    @Scheduled(fixedRate = 60000)  // Run every 60 seconds
    public void processExpiredAcceptanceTimeouts() {
        log.debug("Running scheduled acceptance timeout check");

        try {
            driverAcceptanceService.processExpiredAcceptanceTimeouts();
        } catch (Exception e) {
            log.error("Error processing acceptance timeouts: {}", e.getMessage(), e);
        }
    }
}
