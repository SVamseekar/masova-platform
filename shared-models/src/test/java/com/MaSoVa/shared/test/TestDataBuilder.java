package com.MaSoVa.shared.test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Utility class for building test data objects.
 *
 * Provides factory methods for creating common test data with sensible defaults.
 * Use these builders to create consistent test data across all tests.
 *
 * @example
 * <pre>
 * {@code
 * // Create a test user
 * User user = TestDataBuilder.buildUser("test@example.com", "Test User");
 *
 * // Create a test order
 * Order order = TestDataBuilder.buildOrder(userId, storeId);
 * }
 * </pre>
 */
public class TestDataBuilder {

    private static final String DEFAULT_STORE_ID = "STORE-001";
    private static final String DEFAULT_USER_ID = "USER-001";
    private static final String DEFAULT_CUSTOMER_ID = "CUSTOMER-001";

    // Prevent instantiation
    private TestDataBuilder() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Generate a random UUID string
     */
    public static String randomId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Generate a random email
     */
    public static String randomEmail() {
        return "test-" + randomId().substring(0, 8) + "@example.com";
    }

    /**
     * Generate a random phone number
     */
    public static String randomPhone() {
        return "555-" + (int)(Math.random() * 10000);
    }

    /**
     * Get current timestamp as Instant
     */
    public static Instant now() {
        return Instant.now();
    }

    /**
     * Get current timestamp as LocalDateTime
     */
    public static LocalDateTime nowAsLocalDateTime() {
        return LocalDateTime.now();
    }

    /**
     * Convert Instant to LocalDateTime
     */
    public static LocalDateTime toLocalDateTime(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    /**
     * Create a BigDecimal from a double value
     */
    public static BigDecimal money(double amount) {
        return BigDecimal.valueOf(amount);
    }

    /**
     * Create a list with a single element
     */
    public static <T> List<T> listOf(T item) {
        List<T> list = new ArrayList<>();
        list.add(item);
        return list;
    }

    /**
     * Create a list with multiple elements
     */
    @SafeVarargs
    public static <T> List<T> listOf(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) {
            list.add(item);
        }
        return list;
    }

    /**
     * Get default store ID for tests
     */
    public static String defaultStoreId() {
        return DEFAULT_STORE_ID;
    }

    /**
     * Get default user ID for tests
     */
    public static String defaultUserId() {
        return DEFAULT_USER_ID;
    }

    /**
     * Get default customer ID for tests
     */
    public static String defaultCustomerId() {
        return DEFAULT_CUSTOMER_ID;
    }

    /**
     * Generate a 4-digit PIN
     */
    public static String generatePIN() {
        return String.format("%04d", (int)(Math.random() * 10000));
    }

    /**
     * Generate a random string of specified length
     */
    public static String randomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int)(Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    public static int randomInt(int min, int max) {
        return min + (int)(Math.random() * (max - min + 1));
    }

    /**
     * Generate a random double between min and max
     */
    public static double randomDouble(double min, double max) {
        return min + (Math.random() * (max - min));
    }

    /**
     * Generate a random boolean
     */
    public static boolean randomBoolean() {
        return Math.random() < 0.5;
    }

    /**
     * Wait for a short duration (100ms)
     * Useful for testing async operations
     */
    public static void shortWait() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Wait for specified duration in milliseconds
     */
    public static void waitFor(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
