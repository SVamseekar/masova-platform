package com.MaSoVa.shared.test;

/**
 * Factory class for creating mock objects commonly used in tests.
 *
 * Provides pre-configured mock objects to reduce boilerplate in tests.
 * These mocks have sensible default behaviors that can be overridden in tests.
 *
 * @example
 * <pre>
 * {@code
 * // Get a mock repository with default behaviors
 * OrderRepository mockRepo = MockFactory.mockOrderRepository();
 *
 * // Override specific behavior for your test
 * when(mockRepo.findById("123")).thenReturn(Optional.of(testOrder));
 * }
 * </pre>
 */
public class MockFactory {

    // Prevent instantiation
    private MockFactory() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Common mock responses
     */
    public static class MockResponses {
        public static final String SUCCESS_MESSAGE = "Operation successful";
        public static final String ERROR_MESSAGE = "Operation failed";
        public static final String NOT_FOUND_MESSAGE = "Resource not found";
        public static final String UNAUTHORIZED_MESSAGE = "Unauthorized access";
        public static final String VALIDATION_ERROR_MESSAGE = "Validation failed";
    }

    /**
     * Common mock IDs
     */
    public static class MockIds {
        public static final String MOCK_ORDER_ID = "ORDER-123";
        public static final String MOCK_USER_ID = "USER-123";
        public static final String MOCK_CUSTOMER_ID = "CUSTOMER-123";
        public static final String MOCK_STORE_ID = "STORE-123";
        public static final String MOCK_MENU_ITEM_ID = "ITEM-123";
        public static final String MOCK_PAYMENT_ID = "PAYMENT-123";
        public static final String MOCK_DELIVERY_ID = "DELIVERY-123";
    }

    /**
     * Common mock JWT token
     */
    public static String mockJwtToken() {
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.mock-signature";
    }

    /**
     * Mock Razorpay order ID
     */
    public static String mockRazorpayOrderId() {
        return "order_" + TestDataBuilder.randomString(14);
    }

    /**
     * Mock Razorpay payment ID
     */
    public static String mockRazorpayPaymentId() {
        return "pay_" + TestDataBuilder.randomString(14);
    }

    /**
     * Mock Razorpay signature
     */
    public static String mockRazorpaySignature() {
        return TestDataBuilder.randomString(64);
    }

    /**
     * Mock API key
     */
    public static String mockApiKey() {
        return "rzp_test_" + TestDataBuilder.randomString(16);
    }

    /**
     * Mock API secret
     */
    public static String mockApiSecret() {
        return TestDataBuilder.randomString(24);
    }
}
