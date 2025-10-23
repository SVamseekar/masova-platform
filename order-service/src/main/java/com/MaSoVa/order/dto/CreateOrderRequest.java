package com.MaSoVa.order.dto;

import com.MaSoVa.order.entity.Order.OrderType;
import com.MaSoVa.order.entity.Order.PaymentMethod;
import com.MaSoVa.order.entity.DeliveryAddress;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;

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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
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
    }
}
