package com.MaSoVa.shared.test.builders;

import com.MaSoVa.shared.test.TestDataBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builder for creating test Order data as Map representations.
 *
 * Returns Map&lt;String, Object&gt; because the Order entity lives in the order-service module,
 * which shared-models cannot depend on. The map structure mirrors the Order entity fields
 * and is suitable for JSON serialization in integration tests.
 *
 * @example
 * <pre>
 * {@code
 * // Minimal delivery order
 * Map<String, Object> order = OrderTestDataBuilder.anOrder().build();
 *
 * // Customised takeaway order
 * Map<String, Object> order = OrderTestDataBuilder.anOrder()
 *         .withOrderType("TAKEAWAY")
 *         .withStatus("READY")
 *         .withTotal(BigDecimal.valueOf(25.00))
 *         .build();
 * }
 * </pre>
 */
public class OrderTestDataBuilder {

    private String id = TestDataBuilder.randomId();
    private String orderNumber = "ORD-" + TestDataBuilder.randomString(6);
    private String customerId = TestDataBuilder.defaultCustomerId();
    private String customerName = "Test Customer";
    private String customerPhone = "+31612345678";
    private String customerEmail = "customer@example.com";
    private String storeId = TestDataBuilder.defaultStoreId();
    private List<Map<String, Object>> items = defaultItems();
    private BigDecimal subtotal = BigDecimal.valueOf(20.00);
    private BigDecimal deliveryFee = BigDecimal.valueOf(3.50);
    private BigDecimal tax = BigDecimal.valueOf(2.35);
    private BigDecimal total = BigDecimal.valueOf(25.85);
    private String status = "RECEIVED";
    private String orderType = "DELIVERY";
    private String paymentStatus = "PENDING";
    private String paymentMethod = "CARD";
    private String paymentTransactionId = null;
    private String priority = "NORMAL";
    private Integer preparationTime = 25;
    private LocalDateTime estimatedDeliveryTime = LocalDateTime.now().plusMinutes(45);
    private Map<String, Object> deliveryAddress = defaultDeliveryAddress();
    private String assignedDriverId = null;
    private String specialInstructions = null;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private String createdByStaffId = null;
    private String createdByStaffName = null;

    private OrderTestDataBuilder() {}

    public static OrderTestDataBuilder anOrder() {
        return new OrderTestDataBuilder();
    }

    public static OrderTestDataBuilder aDeliveryOrder() {
        return new OrderTestDataBuilder()
                .withOrderType("DELIVERY")
                .withDeliveryAddress(defaultDeliveryAddress());
    }

    public static OrderTestDataBuilder aTakeawayOrder() {
        return new OrderTestDataBuilder()
                .withOrderType("TAKEAWAY")
                .withDeliveryFee(BigDecimal.ZERO)
                .withDeliveryAddress(null);
    }

    public static OrderTestDataBuilder aDineInOrder() {
        return new OrderTestDataBuilder()
                .withOrderType("DINE_IN")
                .withDeliveryFee(BigDecimal.ZERO)
                .withDeliveryAddress(null);
    }

    public static OrderTestDataBuilder aCancelledOrder() {
        return new OrderTestDataBuilder()
                .withStatus("CANCELLED")
                .withPaymentStatus("REFUNDED");
    }

    // Builder methods

    public OrderTestDataBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public OrderTestDataBuilder withOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
        return this;
    }

    public OrderTestDataBuilder withCustomerId(String customerId) {
        this.customerId = customerId;
        return this;
    }

    public OrderTestDataBuilder withCustomerName(String customerName) {
        this.customerName = customerName;
        return this;
    }

    public OrderTestDataBuilder withCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
        return this;
    }

    public OrderTestDataBuilder withCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
        return this;
    }

    public OrderTestDataBuilder withStoreId(String storeId) {
        this.storeId = storeId;
        return this;
    }

    public OrderTestDataBuilder withItems(List<Map<String, Object>> items) {
        this.items = items;
        return this;
    }

    public OrderTestDataBuilder withSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
        return this;
    }

    public OrderTestDataBuilder withDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
        return this;
    }

    public OrderTestDataBuilder withTax(BigDecimal tax) {
        this.tax = tax;
        return this;
    }

    public OrderTestDataBuilder withTotal(BigDecimal total) {
        this.total = total;
        return this;
    }

    public OrderTestDataBuilder withStatus(String status) {
        this.status = status;
        return this;
    }

    public OrderTestDataBuilder withOrderType(String orderType) {
        this.orderType = orderType;
        return this;
    }

    public OrderTestDataBuilder withPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
        return this;
    }

    public OrderTestDataBuilder withPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
        return this;
    }

    public OrderTestDataBuilder withPaymentTransactionId(String paymentTransactionId) {
        this.paymentTransactionId = paymentTransactionId;
        return this;
    }

    public OrderTestDataBuilder withPriority(String priority) {
        this.priority = priority;
        return this;
    }

    public OrderTestDataBuilder withPreparationTime(Integer preparationTime) {
        this.preparationTime = preparationTime;
        return this;
    }

    public OrderTestDataBuilder withEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
        return this;
    }

    public OrderTestDataBuilder withDeliveryAddress(Map<String, Object> deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
        return this;
    }

    public OrderTestDataBuilder withAssignedDriverId(String assignedDriverId) {
        this.assignedDriverId = assignedDriverId;
        return this;
    }

    public OrderTestDataBuilder withSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
        return this;
    }

    public OrderTestDataBuilder withCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public OrderTestDataBuilder withUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public OrderTestDataBuilder withCreatedByStaffId(String createdByStaffId) {
        this.createdByStaffId = createdByStaffId;
        return this;
    }

    public OrderTestDataBuilder withCreatedByStaffName(String createdByStaffName) {
        this.createdByStaffName = createdByStaffName;
        return this;
    }

    public Map<String, Object> build() {
        Map<String, Object> order = new HashMap<>();
        order.put("id", id);
        order.put("orderNumber", orderNumber);
        order.put("customerId", customerId);
        order.put("customerName", customerName);
        order.put("customerPhone", customerPhone);
        order.put("customerEmail", customerEmail);
        order.put("storeId", storeId);
        order.put("items", items);
        order.put("subtotal", subtotal);
        order.put("deliveryFee", deliveryFee);
        order.put("tax", tax);
        order.put("total", total);
        order.put("status", status);
        order.put("orderType", orderType);
        order.put("paymentStatus", paymentStatus);
        order.put("paymentMethod", paymentMethod);
        order.put("priority", priority);
        order.put("preparationTime", preparationTime);
        order.put("estimatedDeliveryTime", estimatedDeliveryTime != null ? estimatedDeliveryTime.toString() : null);
        order.put("deliveryAddress", deliveryAddress);
        order.put("createdAt", createdAt != null ? createdAt.toString() : null);
        order.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);

        if (paymentTransactionId != null) {
            order.put("paymentTransactionId", paymentTransactionId);
        }
        if (assignedDriverId != null) {
            order.put("assignedDriverId", assignedDriverId);
        }
        if (specialInstructions != null) {
            order.put("specialInstructions", specialInstructions);
        }
        if (createdByStaffId != null) {
            order.put("createdByStaffId", createdByStaffId);
        }
        if (createdByStaffName != null) {
            order.put("createdByStaffName", createdByStaffName);
        }

        return order;
    }

    // Default data helpers

    private static List<Map<String, Object>> defaultItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(buildOrderItem("ITEM-001", "Margherita Pizza", 2, 10.00, "Large", List.of()));
        return items;
    }

    /**
     * Build a single order item map.
     */
    public static Map<String, Object> buildOrderItem(
            String menuItemId, String name, int quantity, double price,
            String variant, List<String> customizations) {

        Map<String, Object> item = new HashMap<>();
        item.put("menuItemId", menuItemId);
        item.put("name", name);
        item.put("quantity", quantity);
        item.put("price", price);
        item.put("variant", variant);
        item.put("customizations", customizations);
        return item;
    }

    private static Map<String, Object> defaultDeliveryAddress() {
        Map<String, Object> address = new HashMap<>();
        address.put("street", "123 Test Street");
        address.put("city", "Amsterdam");
        address.put("state", "North Holland");
        address.put("pincode", "1012AB");
        address.put("latitude", 52.3676);
        address.put("longitude", 4.9041);
        address.put("landmark", "Near Central Station");
        return address;
    }
}
