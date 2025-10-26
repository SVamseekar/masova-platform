package com.MaSoVa.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for auto-dispatching a driver to an order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoDispatchRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotNull(message = "Delivery address is required")
    private AddressDTO deliveryAddress;

    private String preferredDriverId; // Optional: manually assign to specific driver
}
