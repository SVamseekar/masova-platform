package com.MaSoVa.commerce.order.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to send messages to clients
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Register STOMP endpoint for WebSocket connection
        registry.addEndpoint("/ws/orders")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .withSockJS();

        // Also support native WebSocket without SockJS
        registry.addEndpoint("/ws/orders")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000");
    }
}
