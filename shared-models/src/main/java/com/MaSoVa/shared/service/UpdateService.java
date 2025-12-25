package com.MaSoVa.shared.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Properties;

/**
 * Automatic Update Service for MaSoVa
 *
 * Checks for new versions and notifies admins
 * Supports three development workflows:
 * 1. Microservices Dev → Monolith Deploy (Recommended)
 * 2. Direct Monolith Dev
 * 3. Hybrid (Dev in microservices, test in monolith)
 *
 * Free components:
 * - Uses GitHub releases (free)
 * - Docker Hub (free for public images)
 * - No paid services required
 */
@Service
public class UpdateService {

    private static final Logger log = LoggerFactory.getLogger(UpdateService.class);

    // GitHub raw content URL for version checking (FREE)
    private static final String VERSION_CHECK_URL =
        "https://raw.githubusercontent.com/SVamseekar/MaSoVa-restaurant-management-system/main/version.properties";

    // Current version (loaded from version.properties)
    private String currentVersion = "1.0.0";
    private LocalDateTime buildDate;

    @Value("${update.check.enabled:true}")
    private boolean updateCheckEnabled;

    @Value("${update.auto.install:false}")
    private boolean autoInstallEnabled;

    @Value("${update.notify.admin:true}")
    private boolean notifyAdmin;

    private final RestTemplate restTemplate;

    // Store latest version info
    private String latestVersion;
    private boolean updateAvailable = false;
    private String updateDetails;

    public UpdateService() {
        this.restTemplate = new RestTemplate();
        loadCurrentVersion();
    }

    /**
     * Load current version from version.properties
     * This file is generated during build by build-monolith.sh
     */
    private void loadCurrentVersion() {
        try {
            ClassPathResource resource = new ClassPathResource("version.properties");
            if (resource.exists()) {
                Properties props = new Properties();
                props.load(resource.getInputStream());

                currentVersion = props.getProperty("version", "1.0.0");
                String buildDateStr = props.getProperty("buildDate");

                if (buildDateStr != null) {
                    buildDate = LocalDateTime.parse(buildDateStr,
                        DateTimeFormatter.ISO_DATE_TIME);
                }

                log.info("MaSoVa Version: {} (Built: {})", currentVersion, buildDate);
            } else {
                log.warn("version.properties not found, using default version");
            }
        } catch (IOException e) {
            log.error("Failed to load version.properties", e);
        }
    }

    /**
     * Check for updates on application startup
     */
    @EventListener(ApplicationReadyEvent.class)
    public void checkOnStartup() {
        if (updateCheckEnabled) {
            log.info("Checking for updates on startup...");
            checkForUpdates();
        }
    }

    /**
     * Check for updates daily at 2 AM
     * This runs automatically in the background
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledUpdateCheck() {
        if (updateCheckEnabled) {
            log.info("Running scheduled update check...");
            checkForUpdates();
        }
    }

    /**
     * Main update checking logic
     *
     * Workflow:
     * 1. Developer: Fix bug in microservice → commit → push
     * 2. CI/CD: Builds monolith → creates Docker image → pushes to Docker Hub (FREE)
     * 3. Updates version.properties on GitHub (FREE)
     * 4. This service: Checks GitHub → Detects new version → Notifies admin
     * 5. Admin: Runs update-masova.sh → Pulls new Docker image (FREE)
     */
    public void checkForUpdates() {
        try {
            log.debug("Fetching latest version from: {}", VERSION_CHECK_URL);

            // Fetch version.properties from GitHub (FREE - no API limits for raw content)
            ResponseEntity<String> response = restTemplate.getForEntity(
                VERSION_CHECK_URL, String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Properties latestProps = new Properties();
                latestProps.load(new java.io.StringReader(response.getBody()));

                latestVersion = latestProps.getProperty("version");
                String latestBuildDate = latestProps.getProperty("buildDate");

                log.debug("Current version: {}, Latest version: {}",
                    currentVersion, latestVersion);

                // Compare versions
                if (isNewerVersion(latestVersion, currentVersion)) {
                    updateAvailable = true;
                    updateDetails = String.format(
                        "New version %s available (current: %s)\nBuild date: %s",
                        latestVersion, currentVersion, latestBuildDate
                    );

                    log.warn("🆕 UPDATE AVAILABLE: {}", updateDetails);

                    // Fetch changelog
                    String changelog = fetchChangelog(latestVersion);

                    if (notifyAdmin) {
                        notifyAdminOfUpdate(latestVersion, changelog);
                    }

                    if (autoInstallEnabled) {
                        log.info("Auto-update is enabled, initiating update...");
                        initiateAutoUpdate(latestVersion);
                    } else {
                        log.info("Auto-update is disabled. Manual update required.");
                        log.info("To update, run: ./update-masova.sh");
                    }

                } else {
                    updateAvailable = false;
                    log.info("✅ System is up to date (version {})", currentVersion);
                }

            } else {
                log.warn("Failed to check for updates: HTTP {}",
                    response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error checking for updates: {}", e.getMessage());
            log.debug("Update check error details", e);
        }
    }

    /**
     * Compare two semantic versions (e.g., 1.2.3)
     * Returns true if newVersion > currentVersion
     */
    private boolean isNewerVersion(String newVersion, String currentVersion) {
        if (newVersion == null || currentVersion == null) {
            return false;
        }

        try {
            String[] newParts = newVersion.split("\\.");
            String[] currentParts = currentVersion.split("\\.");

            for (int i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
                int newPart = i < newParts.length ? Integer.parseInt(newParts[i]) : 0;
                int currentPart = i < currentParts.length ? Integer.parseInt(currentParts[i]) : 0;

                if (newPart > currentPart) {
                    return true;
                } else if (newPart < currentPart) {
                    return false;
                }
            }

            return false; // Versions are equal

        } catch (NumberFormatException e) {
            log.warn("Invalid version format: {} or {}", newVersion, currentVersion);
            return false;
        }
    }

    /**
     * Fetch changelog from GitHub (FREE)
     */
    private String fetchChangelog(String version) {
        try {
            String changelogUrl = String.format(
                "https://raw.githubusercontent.com/yourusername/masova/main/CHANGELOG.md"
            );

            ResponseEntity<String> response = restTemplate.getForEntity(
                changelogUrl, String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Extract changelog for this version
                String fullChangelog = response.getBody();
                StringBuilder versionChangelog = new StringBuilder();
                boolean capturing = false;

                for (String line : fullChangelog.split("\n")) {
                    if (line.startsWith("## " + version)) {
                        capturing = true;
                        versionChangelog.append(line).append("\n");
                    } else if (line.startsWith("## ") && capturing) {
                        break; // Next version found, stop capturing
                    } else if (capturing) {
                        versionChangelog.append(line).append("\n");
                    }
                }

                return versionChangelog.toString();
            }

        } catch (Exception e) {
            log.debug("Could not fetch changelog: {}", e.getMessage());
        }

        return "Changelog not available";
    }

    /**
     * Notify admin via email/notification
     * This would integrate with your notification-service
     */
    private void notifyAdminOfUpdate(String version, String changelog) {
        log.info("📧 Notifying admin about update to version {}", version);

        // TODO: Integrate with notification-service to send email
        // For now, just log it
        log.info("""

            ╔════════════════════════════════════════════════════════════╗
            ║          🆕 MaSoVa UPDATE AVAILABLE                         ║
            ╠════════════════════════════════════════════════════════════╣
            ║ New Version: {}
            ║ Current Version: {}
            ║                                                            ║
            ║ What's New:                                                ║
            {}
            ║                                                            ║
            ║ To update:                                                 ║
            ║   cd ~/MaSoVa                                              ║
            ║   ./update-masova.sh                                       ║
            ║                                                            ║
            ║ The update includes:                                       ║
            ║   ✅ Automatic backup before update                        ║
            ║   ✅ Zero-downtime deployment                              ║
            ║   ✅ Automatic rollback on failure                         ║
            ║                                                            ║
            ║ Estimated downtime: 2-3 minutes                            ║
            ╚════════════════════════════════════════════════════════════╝
            """,
            version, currentVersion,
            changelog.replaceAll("(?m)^", "║ ")
        );
    }

    /**
     * Initiate automatic update (if enabled)
     *
     * CAUTION: Auto-update should only be enabled for:
     * - Patch versions (1.0.1 → 1.0.2) - Bug fixes
     * NOT for:
     * - Minor versions (1.0.2 → 1.1.0) - New features
     * - Major versions (1.1.0 → 2.0.0) - Breaking changes
     */
    private void initiateAutoUpdate(String targetVersion) {
        try {
            // Determine update type
            String[] currentParts = currentVersion.split("\\.");
            String[] targetParts = targetVersion.split("\\.");

            int currentMajor = Integer.parseInt(currentParts[0]);
            int currentMinor = Integer.parseInt(currentParts[1]);
            int targetMajor = Integer.parseInt(targetParts[0]);
            int targetMinor = Integer.parseInt(targetParts[1]);

            // Only auto-update for patch versions
            if (currentMajor == targetMajor && currentMinor == targetMinor) {
                log.info("Auto-updating to patch version {}...", targetVersion);

                // Execute update script
                ProcessBuilder pb = new ProcessBuilder(
                    "/bin/bash",
                    System.getProperty("user.home") + "/MaSoVa/update-masova.sh",
                    "--auto",
                    "--version=" + targetVersion
                );

                pb.redirectErrorStream(true);
                Process process = pb.start();

                // Log output
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log.info("Update: {}", line);
                    }
                }

                int exitCode = process.waitFor();
                if (exitCode == 0) {
                    log.info("✅ Auto-update completed successfully");
                } else {
                    log.error("❌ Auto-update failed with exit code {}", exitCode);
                }

            } else {
                log.warn("Auto-update skipped: {} → {} is not a patch update",
                    currentVersion, targetVersion);
                log.info("Manual update required for minor/major version changes");
            }

        } catch (Exception e) {
            log.error("Auto-update failed: {}", e.getMessage(), e);
        }
    }

    // ========== Public API for checking update status ==========

    public String getCurrentVersion() {
        return currentVersion;
    }

    public String getLatestVersion() {
        return latestVersion;
    }

    public boolean isUpdateAvailable() {
        return updateAvailable;
    }

    public String getUpdateDetails() {
        return updateDetails;
    }

    public LocalDateTime getBuildDate() {
        return buildDate;
    }

    /**
     * Manual trigger for update check (for admin panel)
     */
    public void manualCheckForUpdates() {
        log.info("Manual update check triggered");
        checkForUpdates();
    }
}
