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
        // KDS / customer tracking — allow LAN Dell + local Vite (origin patterns, not fixed list).
        // SockJS info: GET http://{commerce}:8084/ws/orders/info  (NOT bare /ws)
        // Frontend: VITE_WS_URL=http://192.168.50.88:8084/ws  → connects to …/ws/orders
        registry.addEndpoint("/ws/orders")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Also support native WebSocket without SockJS
        registry.addEndpoint("/ws/orders")
                .setAllowedOriginPatterns("*");
    }
}
