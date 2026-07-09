package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.CommerceSeedService;
import com.MaSoVa.commerce.order.service.KitchenEquipmentSeedService;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("CommerceSeedService (Phase E)")
class CommerceSeedServiceTest {

    @Mock MenuItemRepository menuItemRepository;
    @Mock OrderRepository orderRepository;
    @Mock KitchenEquipmentSeedService equipmentSeedService;
    @Mock Environment environment;

    CommerceSeedService service;

    @BeforeEach
    void setUp() {
        service = new CommerceSeedService(
                menuItemRepository, orderRepository, equipmentSeedService, environment);
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(true);
        when(menuItemRepository.findByStoreId(anyString())).thenReturn(Collections.emptyList());
        AtomicInteger menuSeq = new AtomicInteger();
        when(menuItemRepository.save(any())).thenAnswer(inv -> {
            MenuItem m = inv.getArgument(0);
            m.setId("menu-" + menuSeq.incrementAndGet());
            return m;
        });
        when(orderRepository.findByOrderNumber(anyString())).thenReturn(Optional.empty());
        AtomicInteger ordSeq = new AtomicInteger();
        when(orderRepository.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId("ord-" + ordSeq.incrementAndGet());
            return o;
        });
        when(equipmentSeedService.seedDemo(anyString())).thenReturn(Map.of(
                "createdCount", 5, "totalForStore", 5));
    }

    @Test
    @DisplayName("blocked outside dev/demo")
    void blockedOutsideDev() {
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(false);
        assertThatThrownBy(() -> service.seedDemo("DOM001", "user-1"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("orders use customerId = userId (ownership invariant)")
    void ordersUseUserIdAsCustomerId() {
        // After menu saves, findByStoreId should return items for order line items
        when(menuItemRepository.findByStoreId("DOM001")).thenAnswer(inv -> {
            MenuItem m = new MenuItem("SEED Margherita Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 1290L);
            m.setId("menu-1");
            m.setStoreId("DOM001");
            return List.of(m);
        });

        Map<String, Object> result = service.seedDemo("DOM001", "jwt-user-anna");

        assertThat(result.get("customerId")).isEqualTo("jwt-user-anna");
        ArgumentCaptor<Order> cap = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository, times(10)).save(cap.capture());
        assertThat(cap.getAllValues()).allMatch(o -> "jwt-user-anna".equals(o.getCustomerId()));
        assertThat(cap.getAllValues()).extracting(Order::getOrderNumber)
                .allMatch(n -> n.startsWith("SEED-ORD-"));
        assertThat(cap.getAllValues()).extracting(Order::getStatus)
                .contains(Order.OrderStatus.RECEIVED, Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("idempotent: existing order numbers update not explode")
    void idempotentOrders() {
        Order existing = new Order();
        existing.setId("existing-1");
        existing.setOrderNumber("SEED-ORD-RECV-1");
        when(orderRepository.findByOrderNumber("SEED-ORD-RECV-1")).thenReturn(Optional.of(existing));
        when(orderRepository.findByOrderNumber(anyString())).thenAnswer(inv -> {
            String n = inv.getArgument(0);
            if ("SEED-ORD-RECV-1".equals(n)) return Optional.of(existing);
            return Optional.empty();
        });
        when(menuItemRepository.findByStoreId(anyString())).thenReturn(Collections.emptyList());

        Map<String, Object> result = service.seedOrdersOnly("DOM001", "user-x");
        assertThat(result.get("totalSeedOrders")).isEqualTo(10);
        @SuppressWarnings("unchecked")
        Map<String, Object> orders = result;
        assertThat((Integer) orders.get("updatedCount")).isGreaterThanOrEqualTo(1);
    }
}
