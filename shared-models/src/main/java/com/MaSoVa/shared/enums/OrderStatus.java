package com.MaSoVa.shared.enums;

public enum OrderStatus {
    RECEIVED,      // Order received from customer
    PREPARING,     // Kitchen is preparing the order
    OVEN,          // Order is in the oven
    BAKED,         // Order is ready from oven
    DISPATCHED,    // Order awaiting driver assignment
    OUT_FOR_DELIVERY, // Driver assigned and en route
    DELIVERED      // Order delivered to customer
}