package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.entity.RatingToken;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.repository.RatingTokenRepository;
import com.MaSoVa.commerce.order.service.RatingTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingTokenServiceTest {

    @Mock private RatingTokenRepository ratingTokenRepository;
    @Mock private OrderRepository orderRepository;
    @InjectMocks private RatingTokenService ratingTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(ratingTokenService, "tokenValidityDays", 30);
        ReflectionTestUtils.setField(ratingTokenService, "frontendBaseUrl", "http://localhost:3000");
    }

    private Order buildOrder(String id) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setCustomerId("cust-1");
        order.setCustomerPhone("9876543210");
        order.setStoreId("store-1");
        order.setStatus(OrderStatus.DELIVERED);
        order.setOrderType(OrderType.DELIVERY);
        order.setTotal(BigDecimal.valueOf(300));
        return order;
    }

    private RatingToken buildToken(String orderId) {
        RatingToken token = new RatingToken();
        token.setToken("uuid-abc-123");
        token.setOrderId(orderId);
        token.setCustomerId("cust-1");
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusDays(30));
        token.setUsed(false);
        return token;
    }

    @Test
    void generateRatingToken_returns_existing_if_already_exists() {
        RatingToken existing = buildToken("o1");
        when(ratingTokenRepository.existsByOrderId("o1")).thenReturn(true);
        when(ratingTokenRepository.findByOrderId("o1")).thenReturn(Optional.of(existing));

        RatingToken result = ratingTokenService.generateRatingToken("o1");

        assertThat(result.getOrderId()).isEqualTo("o1");
        verify(ratingTokenRepository, never()).save(any());
    }

    @Test
    void generateRatingToken_creates_new_token_with_expiry() {
        Order order = buildOrder("o1");
        when(ratingTokenRepository.existsByOrderId("o1")).thenReturn(false);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(ratingTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RatingToken result = ratingTokenService.generateRatingToken("o1");

        assertThat(result.getToken()).isNotNull();
        assertThat(result.getOrderId()).isEqualTo("o1");
        assertThat(result.getCustomerId()).isEqualTo("cust-1");
        assertThat(result.getCustomerPhone()).isEqualTo("9876543210");
        assertThat(result.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(result.isUsed()).isFalse();
    }

    @Test
    void generateRatingToken_includes_driver_id_when_driver_assigned() {
        Order order = buildOrder("o1");
        order.setAssignedDriverId("driver-1");
        when(ratingTokenRepository.existsByOrderId("o1")).thenReturn(false);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(ratingTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RatingToken result = ratingTokenService.generateRatingToken("o1");

        assertThat(result.getDriverId()).isEqualTo("driver-1");
    }

    @Test
    void generateRatingToken_order_not_found_throws() {
        when(ratingTokenRepository.existsByOrderId("missing")).thenReturn(false);
        when(orderRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ratingTokenService.generateRatingToken("missing"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order not found");
    }

    @Test
    void validateToken_returns_valid_token() {
        RatingToken token = buildToken("o1");
        when(ratingTokenRepository.findByToken("uuid-abc-123")).thenReturn(Optional.of(token));

        RatingToken result = ratingTokenService.validateToken("uuid-abc-123");

        assertThat(result.getToken()).isEqualTo("uuid-abc-123");
    }

    @Test
    void validateToken_not_found_throws() {
        when(ratingTokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ratingTokenService.validateToken("bad-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid rating token");
    }

    @Test
    void validateToken_expired_token_throws() {
        RatingToken token = buildToken("o1");
        token.setExpiresAt(LocalDateTime.now().minusDays(1)); // expired
        when(ratingTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> ratingTokenService.validateToken("expired-token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expired or already used");
    }

    @Test
    void validateToken_used_token_throws() {
        RatingToken token = buildToken("o1");
        token.setUsed(true);
        when(ratingTokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> ratingTokenService.validateToken("used-token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expired or already used");
    }

    @Test
    void markTokenAsUsed_sets_used_flag_and_timestamp() {
        RatingToken token = buildToken("o1");
        when(ratingTokenRepository.findByToken("uuid-abc-123")).thenReturn(Optional.of(token));

        ratingTokenService.markTokenAsUsed("uuid-abc-123");

        verify(ratingTokenRepository).save(argThat(t -> t.isUsed() && t.getUsedAt() != null));
    }

    @Test
    void markTokenAsUsed_not_found_throws() {
        when(ratingTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ratingTokenService.markTokenAsUsed("bad"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token not found");
    }

    @Test
    void generateRatingUrl_returns_frontend_url_with_token() {
        Order order = buildOrder("o1");
        when(ratingTokenRepository.existsByOrderId("o1")).thenReturn(false);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(ratingTokenRepository.save(any())).thenAnswer(inv -> {
            RatingToken t = inv.getArgument(0);
            t.setToken("generated-uuid");
            return t;
        });

        String url = ratingTokenService.generateRatingUrl("o1");

        assertThat(url).startsWith("http://localhost:3000/rate/o1/");
        assertThat(url).contains("generated-uuid");
    }

    @Test
    void getOrderIdFromToken_returns_order_id_from_valid_token() {
        RatingToken token = buildToken("o1");
        when(ratingTokenRepository.findByToken("uuid-abc-123")).thenReturn(Optional.of(token));

        String orderId = ratingTokenService.getOrderIdFromToken("uuid-abc-123");

        assertThat(orderId).isEqualTo("o1");
    }
}
