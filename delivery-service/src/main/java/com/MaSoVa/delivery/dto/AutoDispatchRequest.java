package com.MaSoVa.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for auto-dispatching a driver to an order
 */
public class AutoDispatchRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotNull(message = "Delivery address is required")
    private AddressDTO deliveryAddress;

    private String preferredDriverId; // Optional: manually assign to specific driver

    public AutoDispatchRequest() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public AddressDTO getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(AddressDTO deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getPreferredDriverId() {
        return preferredDriverId;
    }

    public void setPreferredDriverId(String preferredDriverId) {
        this.preferredDriverId = preferredDriverId;
    }
}
