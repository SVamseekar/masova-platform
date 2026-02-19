package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.service.UpdateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * System Information and Health Check Controller
 *
 * Provides endpoints for:
 * - Version information
 * - Health checks (used by update-masova.sh)
 * - Update status
 * - System status
 */
@RestController
@RequestMapping("/api/system")
@ConditionalOnBean(UpdateService.class)
public class SystemInfoController {

    private static final Logger log = LoggerFactory.getLogger(SystemInfoController.class);
    private final UpdateService updateService;

    public SystemInfoController(UpdateService updateService) {
        this.updateService = updateService;
    }

    /**
     * Get current version information
     * Used by update scripts to verify version after update
     */
    @GetMapping("/version")
    public ResponseEntity<VersionInfo> getVersion() {
        VersionInfo info = new VersionInfo(
            updateService.getCurrentVersion(),
            updateService.getBuildDate(),
            "MaSoVa Restaurant Management System",
            "Production"
        );

        return ResponseEntity.ok(info);
    }

    /**
     * Check for available updates
     * Can be called from admin panel
     */
    @GetMapping("/updates/check")
    public ResponseEntity<UpdateStatus> checkForUpdates() {
        log.info("Manual update check requested");
        updateService.manualCheckForUpdates();

        UpdateStatus status = new UpdateStatus(
            updateService.getCurrentVersion(),
            updateService.getLatestVersion(),
            updateService.isUpdateAvailable(),
            updateService.getUpdateDetails()
        );

        return ResponseEntity.ok(status);
    }

    /**
     * Get update status without triggering a check
     */
    @GetMapping("/updates/status")
    public ResponseEntity<UpdateStatus> getUpdateStatus() {
        UpdateStatus status = new UpdateStatus(
            updateService.getCurrentVersion(),
            updateService.getLatestVersion(),
            updateService.isUpdateAvailable(),
            updateService.getUpdateDetails()
        );

        return ResponseEntity.ok(status);
    }

    /**
     * Enhanced health check endpoint
     * Used by update and rollback scripts to verify system health
     */
    @GetMapping("/health")
    public ResponseEntity<HealthStatus> health() {
        HealthStatus health = new HealthStatus();
        health.setStatus("UP");
        health.setTimestamp(LocalDateTime.now());
        health.setVersion(updateService.getCurrentVersion());

        // Add component health checks
        Map<String, String> components = new HashMap<>();
        components.put("user-service", "UP");
        components.put("update-service", "UP");

        health.setComponents(components);

        return ResponseEntity.ok(health);
    }

    /**
     * Detailed system information
     * Useful for debugging and support
     */
    @GetMapping("/info")
    public ResponseEntity<SystemInfo> getSystemInfo() {
        SystemInfo info = new SystemInfo();
        info.setVersion(updateService.getCurrentVersion());
        info.setBuildDate(updateService.getBuildDate());
        info.setUpdateAvailable(updateService.isUpdateAvailable());
        info.setLatestVersion(updateService.getLatestVersion());

        // System properties
        Runtime runtime = Runtime.getRuntime();
        info.setTotalMemory(runtime.totalMemory() / 1024 / 1024 + " MB");
        info.setFreeMemory(runtime.freeMemory() / 1024 / 1024 + " MB");
        info.setMaxMemory(runtime.maxMemory() / 1024 / 1024 + " MB");
        info.setProcessors(runtime.availableProcessors());

        // JVM info
        info.setJavaVersion(System.getProperty("java.version"));
        info.setJavaVendor(System.getProperty("java.vendor"));

        return ResponseEntity.ok(info);
    }

    // ========== DTOs ==========

    public static class VersionInfo {
        private String version;
        private LocalDateTime buildDate;
        private String applicationName;
        private String environment;

        public VersionInfo() {}

        public VersionInfo(String version, LocalDateTime buildDate, String applicationName, String environment) {
            this.version = version;
            this.buildDate = buildDate;
            this.applicationName = applicationName;
            this.environment = environment;
        }

        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public LocalDateTime getBuildDate() { return buildDate; }
        public void setBuildDate(LocalDateTime buildDate) { this.buildDate = buildDate; }
        public String getApplicationName() { return applicationName; }
        public void setApplicationName(String applicationName) { this.applicationName = applicationName; }
        public String getEnvironment() { return environment; }
        public void setEnvironment(String environment) { this.environment = environment; }
    }

    public static class UpdateStatus {
        private String currentVersion;
        private String latestVersion;
        private boolean updateAvailable;
        private String details;

        public UpdateStatus() {}

        public UpdateStatus(String currentVersion, String latestVersion, boolean updateAvailable, String details) {
            this.currentVersion = currentVersion;
            this.latestVersion = latestVersion;
            this.updateAvailable = updateAvailable;
            this.details = details;
        }

        public String getCurrentVersion() { return currentVersion; }
        public void setCurrentVersion(String currentVersion) { this.currentVersion = currentVersion; }
        public String getLatestVersion() { return latestVersion; }
        public void setLatestVersion(String latestVersion) { this.latestVersion = latestVersion; }
        public boolean isUpdateAvailable() { return updateAvailable; }
        public void setUpdateAvailable(boolean updateAvailable) { this.updateAvailable = updateAvailable; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    public static class HealthStatus {
        private String status;
        private LocalDateTime timestamp;
        private String version;
        private Map<String, String> components;

        public HealthStatus() {}

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public Map<String, String> getComponents() { return components; }
        public void setComponents(Map<String, String> components) { this.components = components; }
    }

    public static class SystemInfo {
        private String version;
        private LocalDateTime buildDate;
        private boolean updateAvailable;
        private String latestVersion;
        private String totalMemory;
        private String freeMemory;
        private String maxMemory;
        private int processors;
        private String javaVersion;
        private String javaVendor;

        public SystemInfo() {}

        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public LocalDateTime getBuildDate() { return buildDate; }
        public void setBuildDate(LocalDateTime buildDate) { this.buildDate = buildDate; }
        public boolean isUpdateAvailable() { return updateAvailable; }
        public void setUpdateAvailable(boolean updateAvailable) { this.updateAvailable = updateAvailable; }
        public String getLatestVersion() { return latestVersion; }
        public void setLatestVersion(String latestVersion) { this.latestVersion = latestVersion; }
        public String getTotalMemory() { return totalMemory; }
        public void setTotalMemory(String totalMemory) { this.totalMemory = totalMemory; }
        public String getFreeMemory() { return freeMemory; }
        public void setFreeMemory(String freeMemory) { this.freeMemory = freeMemory; }
        public String getMaxMemory() { return maxMemory; }
        public void setMaxMemory(String maxMemory) { this.maxMemory = maxMemory; }
        public int getProcessors() { return processors; }
        public void setProcessors(int processors) { this.processors = processors; }
        public String getJavaVersion() { return javaVersion; }
        public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }
        public String getJavaVendor() { return javaVendor; }
        public void setJavaVendor(String javaVendor) { this.javaVendor = javaVendor; }
    }
}
