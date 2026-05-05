package com.MaSoVa.gateway.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * WebFlux-compatible System Information Handler
 *
 * Provides reactive endpoints for:
 * - Version information
 * - Health checks
 * - System status
 */
@Component
public class SystemInfoHandler {

    private static final Logger log = LoggerFactory.getLogger(SystemInfoHandler.class);

    private String currentVersion = "1.0.0";
    private LocalDateTime buildDate = LocalDateTime.now();

    @Value("${spring.application.name:MaSoVa API Gateway}")
    private String applicationName;

    public SystemInfoHandler() {
        loadVersionInfo();
    }

    /**
     * Load version from version.properties
     */
    private void loadVersionInfo() {
        try {
            ClassPathResource resource = new ClassPathResource("version.properties");
            if (resource.exists()) {
                Properties props = new Properties();
                props.load(resource.getInputStream());

                currentVersion = props.getProperty("version", "1.0.0");
                String buildDateStr = props.getProperty("buildDate");

                if (buildDateStr != null) {
                    buildDate = LocalDateTime.parse(buildDateStr);
                }

                log.info("MaSoVa Version: {} (Built: {})", currentVersion, buildDate);
            }
        } catch (IOException e) {
            log.warn("Could not load version.properties, using defaults");
        }
    }

    /**
     * GET /api/system/version
     */
    public Mono<ServerResponse> getVersion(ServerRequest request) {
        VersionInfo info = new VersionInfo(
            currentVersion,
            buildDate,
            "MaSoVa Restaurant Management System",
            "Production"
        );

        return ServerResponse.ok()
            .bodyValue(info);
    }

    /**
     * GET /api/system/health
     */
    public Mono<ServerResponse> getHealth(ServerRequest request) {
        HealthStatus health = new HealthStatus();
        health.setStatus("UP");
        health.setTimestamp(LocalDateTime.now());
        health.setVersion(currentVersion);

        Map<String, String> components = new HashMap<>();
        components.put("api-gateway", "UP");
        health.setComponents(components);

        return ServerResponse.ok()
            .bodyValue(health);
    }

    /**
     * GET /api/system/info
     */
    public Mono<ServerResponse> getInfo(ServerRequest request) {
        SystemInfo info = new SystemInfo();
        info.setVersion(currentVersion);
        info.setBuildDate(buildDate);
        info.setApplicationName(applicationName);

        // System properties
        Runtime runtime = Runtime.getRuntime();
        info.setTotalMemory(runtime.totalMemory() / 1024 / 1024 + " MB");
        info.setFreeMemory(runtime.freeMemory() / 1024 / 1024 + " MB");
        info.setMaxMemory(runtime.maxMemory() / 1024 / 1024 + " MB");
        info.setProcessors(runtime.availableProcessors());

        // JVM info
        info.setJavaVersion(System.getProperty("java.version"));
        info.setJavaVendor(System.getProperty("java.vendor"));

        return ServerResponse.ok()
            .bodyValue(info);
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
        private String applicationName;
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
        public String getApplicationName() { return applicationName; }
        public void setApplicationName(String applicationName) { this.applicationName = applicationName; }
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
