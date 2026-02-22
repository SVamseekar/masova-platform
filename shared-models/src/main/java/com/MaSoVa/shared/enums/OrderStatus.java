package com.MaSoVa.shared.enums;

public enum OrderStatus {
    RECEIVED,         // Order received from customer
    PREPARING,        // Kitchen is preparing the order
    OVEN,             // Order is in the oven
    BAKED,            // Order is ready from oven
    READY,            // Ready for pickup / serving / dispatch
    DISPATCHED,       // Order awaiting driver pickup
    OUT_FOR_DELIVERY, // Driver assigned and en route
    DELIVERED,        // Order delivered to customer (DELIVERY terminal)
    SERVED,           // Order served at table (DINE_IN terminal)
    COMPLETED,        // Order handed to customer (TAKEAWAY terminal)
    CANCELLED         // Order cancelled
}