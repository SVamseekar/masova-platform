package com.MaSoVa.commerce.order.websocket;

import com.MaSoVa.commerce.order.entity.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class OrderWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(OrderWebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public OrderWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcast order update to all subscribers
     */
    @MessageMapping("/orders/update")
    @SendTo("/topic/orders")
    public Order broadcastOrderUpdate(Order order) {
        log.info("Broadcasting order update: {}", order.getOrderNumber());
        return order;
    }

    /**
     * Send order update to specific store
     */
    public void sendOrderUpdateToStore(String storeId, Order order) {
        log.info("Sending order update to store {}: {}", storeId, order.getOrderNumber());
        messagingTemplate.convertAndSend("/topic/store/" + storeId + "/orders", order);
    }

    /**
     * Send kitchen queue update to specific store
     */
    public void sendKitchenQueueUpdate(String storeId, Order order) {
        log.info("Sending kitchen queue update to store {}: {}", storeId, order.getOrderNumber());
        messagingTemplate.convertAndSend("/topic/store/" + storeId + "/kitchen", order);
    }

    /**
     * Send order update to specific customer
     */
    public void sendOrderUpdateToCustomer(String customerId, Order order) {
        log.info("Sending order update to customer {}: {}", customerId, order.getOrderNumber());
        messagingTemplate.convertAndSend("/queue/customer/" + customerId + "/orders", order);
    }

    public void sendOrderUpdateToDriver(String driverId, Order order) {
        log.info("Sending order assignment to driver {}: {}", driverId, order.getOrderNumber());
        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/orders", order);
    }
}
