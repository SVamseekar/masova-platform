package com.MaSoVa.shared.test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class providing pre-configured mock responses that simulate
 * inter-service REST call payloads.
 *
 * Use these methods when testing services that depend on other microservices
 * via REST clients (e.g., OrderServiceClient, UserServiceClient).
 *
 * @example
 * <pre>
 * {@code
 * // Stub a REST client response in a unit test
 * when(orderServiceClient.getOrderDetails("ORDER-123"))
 *         .thenReturn(MockServiceClients.mockOrderResponse());
 *
 * // Stub available drivers list
 * when(userServiceClient.getAvailableDrivers("STORE-001"))
 *         .thenReturn(MockServiceClients.mockAvailableDriversResponse());
 * }
 * </pre>
 */
public class MockServiceClients {

    private MockServiceClients() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Mock response for OrderServiceClient.getOrderDetails().
     * Returns a map representing a RECEIVED delivery order.
     */
    public static Map<String, Object> mockOrderResponse() {
        Map<String, Object> order = new HashMap<>();
        order.put("id", MockFactory.MockIds.MOCK_ORDER_ID);
        order.put("orderNumber", "ORD-TEST001");
        order.put("customerId", MockFactory.MockIds.MOCK_CUSTOMER_ID);
        order.put("customerName", "Test Customer");
        order.put("customerPhone", "+31612345678");
        order.put("customerEmail", "customer@example.com");
        order.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        order.put("status", "RECEIVED");
        order.put("orderType", "DELIVERY");
        order.put("paymentStatus", "PAID");
        order.put("paymentMethod", "CARD");
        order.put("subtotal", 20.00);
        order.put("deliveryFee", 3.50);
        order.put("tax", 2.35);
        order.put("total", 25.85);
        order.put("preparationTime", 25);
        order.put("priority", "NORMAL");
        order.put("createdAt", LocalDateTime.now().toString());
        order.put("updatedAt", LocalDateTime.now().toString());

        Map<String, Object> address = new HashMap<>();
        address.put("street", "123 Test Street");
        address.put("city", "Amsterdam");
        address.put("state", "North Holland");
        address.put("pincode", "1012AB");
        address.put("latitude", 52.3676);
        address.put("longitude", 4.9041);
        order.put("deliveryAddress", address);

        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("menuItemId", MockFactory.MockIds.MOCK_MENU_ITEM_ID);
        item.put("name", "Margherita Pizza");
        item.put("quantity", 2);
        item.put("price", 10.00);
        item.put("variant", "Large");
        item.put("customizations", List.of());
        items.add(item);
        order.put("items", items);

        return order;
    }

    /**
     * Mock response for UserServiceClient.getDriverDetails().
     * Returns a map representing a driver user.
     */
    public static Map<String, Object> mockUserResponse() {
        Map<String, Object> user = new HashMap<>();
        user.put("id", MockFactory.MockIds.MOCK_USER_ID);
        user.put("firstName", "Test");
        user.put("lastName", "User");
        user.put("email", "testuser@example.com");
        user.put("phone", "+31698765432");
        user.put("role", "MANAGER");
        user.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        user.put("active", true);
        user.put("createdAt", LocalDateTime.now().toString());
        return user;
    }

    /**
     * Mock response for UserServiceClient.getDriverDetails().
     * Returns a map representing a delivery driver.
     */
    public static Map<String, Object> mockDriverResponse() {
        Map<String, Object> driver = new HashMap<>();
        driver.put("id", "DRIVER-001");
        driver.put("firstName", "Test");
        driver.put("lastName", "Driver");
        driver.put("email", "driver@example.com");
        driver.put("phone", "+31687654321");
        driver.put("phoneNumber", "+31687654321");
        driver.put("role", "DELIVERY_DRIVER");
        driver.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        driver.put("active", true);
        driver.put("status", "AVAILABLE");
        driver.put("createdAt", LocalDateTime.now().toString());
        return driver;
    }

    /**
     * Mock response representing a menu item from the menu-service.
     */
    public static Map<String, Object> mockMenuItemResponse() {
        Map<String, Object> menuItem = new HashMap<>();
        menuItem.put("id", MockFactory.MockIds.MOCK_MENU_ITEM_ID);
        menuItem.put("name", "Margherita Pizza");
        menuItem.put("description", "Classic pizza with fresh mozzarella and basil");
        menuItem.put("cuisine", "ITALIAN");
        menuItem.put("category", "PIZZA");
        menuItem.put("basePrice", 29900L);
        menuItem.put("isAvailable", true);
        menuItem.put("preparationTime", 20);
        menuItem.put("spiceLevel", "MILD");
        menuItem.put("dietaryInfo", List.of("VEGETARIAN"));
        menuItem.put("ingredients", List.of("Flour", "Mozzarella", "Tomato sauce", "Basil"));
        menuItem.put("allergens", List.of("Gluten", "Dairy"));
        menuItem.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        menuItem.put("tags", List.of("popular"));
        menuItem.put("isRecommended", false);
        return menuItem;
    }

    /**
     * Mock response representing a payment transaction.
     */
    public static Map<String, Object> mockPaymentResponse() {
        Map<String, Object> payment = new HashMap<>();
        payment.put("id", MockFactory.MockIds.MOCK_PAYMENT_ID);
        payment.put("orderId", MockFactory.MockIds.MOCK_ORDER_ID);
        payment.put("razorpayOrderId", MockFactory.mockRazorpayOrderId());
        payment.put("razorpayPaymentId", MockFactory.mockRazorpayPaymentId());
        payment.put("amount", BigDecimal.valueOf(25.85));
        payment.put("status", "SUCCESS");
        payment.put("paymentMethod", "CARD");
        payment.put("customerId", MockFactory.MockIds.MOCK_CUSTOMER_ID);
        payment.put("customerEmail", "customer@example.com");
        payment.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        payment.put("currency", "INR");
        payment.put("reconciled", false);
        payment.put("createdAt", LocalDateTime.now().toString());
        payment.put("paidAt", LocalDateTime.now().toString());
        return payment;
    }

    /**
     * Mock response representing a delivery tracking record.
     */
    public static Map<String, Object> mockDeliveryResponse() {
        Map<String, Object> delivery = new HashMap<>();
        delivery.put("id", MockFactory.MockIds.MOCK_DELIVERY_ID);
        delivery.put("orderId", MockFactory.MockIds.MOCK_ORDER_ID);
        delivery.put("driverId", "DRIVER-001");
        delivery.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        delivery.put("driverName", "Test Driver");
        delivery.put("driverPhone", "+31687654321");
        delivery.put("status", "ASSIGNED");
        delivery.put("dispatchMethod", "AUTO");
        delivery.put("priorityLevel", "MEDIUM");
        delivery.put("distanceKm", BigDecimal.valueOf(3.5));
        delivery.put("estimatedDeliveryMinutes", 25);
        delivery.put("reassignmentCount", 0);
        delivery.put("acceptanceTimeoutMinutes", 5);
        delivery.put("assignedAt", LocalDateTime.now().toString());
        delivery.put("createdAt", LocalDateTime.now().toString());

        Map<String, Object> pickupAddress = new HashMap<>();
        pickupAddress.put("street", "456 Store Avenue");
        pickupAddress.put("city", "Amsterdam");
        pickupAddress.put("state", "North Holland");
        pickupAddress.put("zipCode", "1013AA");
        pickupAddress.put("latitude", 52.3792);
        pickupAddress.put("longitude", 4.8994);
        delivery.put("pickupAddress", pickupAddress);

        Map<String, Object> deliveryAddress = new HashMap<>();
        deliveryAddress.put("street", "789 Customer Lane");
        deliveryAddress.put("city", "Amsterdam");
        deliveryAddress.put("state", "North Holland");
        deliveryAddress.put("zipCode", "1017AB");
        deliveryAddress.put("latitude", 52.3600);
        deliveryAddress.put("longitude", 4.8852);
        delivery.put("deliveryAddress", deliveryAddress);

        return delivery;
    }

    /**
     * Mock response for UserServiceClient.getAvailableDrivers().
     * Returns a list of two available drivers.
     */
    public static List<Map<String, Object>> mockAvailableDriversResponse() {
        List<Map<String, Object>> drivers = new ArrayList<>();

        Map<String, Object> driver1 = new HashMap<>();
        driver1.put("id", "DRIVER-001");
        driver1.put("firstName", "Alice");
        driver1.put("lastName", "Driver");
        driver1.put("email", "alice.driver@example.com");
        driver1.put("phone", "+31687654321");
        driver1.put("role", "DELIVERY_DRIVER");
        driver1.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        driver1.put("active", true);
        driver1.put("status", "AVAILABLE");
        drivers.add(driver1);

        Map<String, Object> driver2 = new HashMap<>();
        driver2.put("id", "DRIVER-002");
        driver2.put("firstName", "Bob");
        driver2.put("lastName", "Courier");
        driver2.put("email", "bob.courier@example.com");
        driver2.put("phone", "+31698765432");
        driver2.put("role", "DELIVERY_DRIVER");
        driver2.put("storeId", MockFactory.MockIds.MOCK_STORE_ID);
        driver2.put("active", true);
        driver2.put("status", "AVAILABLE");
        drivers.add(driver2);

        return drivers;
    }
}
