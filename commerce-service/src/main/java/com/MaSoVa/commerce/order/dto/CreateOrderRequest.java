package com.MaSoVa.commerce.order.dto;

import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.entity.Order.PaymentMethod;
import com.MaSoVa.commerce.order.entity.DeliveryAddress;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;

    private String customerEmail;

    private String customerId;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequest> items;

    @NotNull(message = "Order type is required")
    private OrderType orderType;

    private PaymentMethod paymentMethod;

    private DeliveryAddress deliveryAddress;

    private String specialInstructions;

    // Staff who created the order (for POS orders)
    private String createdByStaffId;

    private String createdByStaffName;

    private java.math.BigDecimal tipAmountINR;
    private String tipRecipientStaffId;

    public CreateOrderRequest() {}

    // Getters and Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public DeliveryAddress getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(DeliveryAddress deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getCreatedByStaffId() { return createdByStaffId; }
    public void setCreatedByStaffId(String createdByStaffId) { this.createdByStaffId = createdByStaffId; }

    public String getCreatedByStaffName() { return createdByStaffName; }
    public void setCreatedByStaffName(String createdByStaffName) { this.createdByStaffName = createdByStaffName; }

    public java.math.BigDecimal getTipAmountINR() { return tipAmountINR; }
    public void setTipAmountINR(java.math.BigDecimal tipAmountINR) { this.tipAmountINR = tipAmountINR; }

    public String getTipRecipientStaffId() { return tipRecipientStaffId; }
    public void setTipRecipientStaffId(String tipRecipientStaffId) { this.tipRecipientStaffId = tipRecipientStaffId; }

    public static class OrderItemRequest {

        @NotBlank(message = "Menu item ID is required")
        private String menuItemId;

        @NotBlank(message = "Item name is required")
        private String name;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        @NotNull(message = "Price is required")
        private Double price;

        private String variant;

        private List<String> customizations;

        private String category;  // MenuCategory name for VAT routing e.g. "FOOD", "BEVERAGE", "ALCOHOL"

        public OrderItemRequest() {}

        // Getters and Setters
        public String getMenuItemId() { return menuItemId; }
        public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }

        public String getVariant() { return variant; }
        public void setVariant(String variant) { this.variant = variant; }

        public List<String> getCustomizations() { return customizations; }
        public void setCustomizations(List<String> customizations) { this.customizations = customizations; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }
}
