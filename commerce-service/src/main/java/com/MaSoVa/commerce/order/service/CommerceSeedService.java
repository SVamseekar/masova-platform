package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.commerce.order.entity.DeliveryAddress;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.OrderSource;
import com.MaSoVa.shared.enums.SpiceLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dev/demo seed for commerce: menu bulk, multi-status orders (customerId=userId), equipment.
 * Active only when spring profiles include {@code dev} or {@code demo}.
 */
@Service
public class CommerceSeedService {

    private static final Logger log = LoggerFactory.getLogger(CommerceSeedService.class);

    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final KitchenEquipmentSeedService equipmentSeedService;
    private final Environment environment;

    public CommerceSeedService(MenuItemRepository menuItemRepository,
                               OrderRepository orderRepository,
                               KitchenEquipmentSeedService equipmentSeedService,
                               Environment environment) {
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.equipmentSeedService = equipmentSeedService;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Seed menu + multi-status orders + kitchen equipment.
     *
     * @param storeId    store code (DOM001)
     * @param customerId JWT userId (sub) — ownership invariant for customer order APIs
     * @param driverId   optional driver userId for OFD/DELIVERED seed orders
     */
    public Map<String, Object> seedDemo(String storeId, String customerId, String driverId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Commerce seed is only available under dev/demo profiles");
        }
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }
        String cid = (customerId == null || customerId.isBlank()) ? "seed-customer-user" : customerId;

        Map<String, Object> menu = seedMenu(storeId);
        Map<String, Object> orders = seedOrders(storeId, cid, driverId);
        Map<String, Object> equipment = equipmentSeedService.seedDemo(storeId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("storeId", storeId);
        result.put("customerId", cid);
        result.put("menu", menu);
        result.put("orders", orders);
        result.put("equipment", equipment);
        result.put("message", "Commerce seed complete (idempotent; order.customerId = userId)");
        log.info("Commerce seed-demo storeId={} menu={} orders={}",
                storeId, menu.get("totalForStore"), orders.get("totalSeedOrders"));
        return result;
    }

    /** Back-compat overload. */
    public Map<String, Object> seedDemo(String storeId, String customerId) {
        return seedDemo(storeId, customerId, null);
    }

    public Map<String, Object> seedMenuOnly(String storeId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Commerce seed is only available under dev/demo profiles");
        }
        return seedMenu(storeId);
    }

    public Map<String, Object> seedOrdersOnly(String storeId, String customerId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Commerce seed is only available under dev/demo profiles");
        }
        String cid = (customerId == null || customerId.isBlank()) ? "seed-customer-user" : customerId;
        return seedOrders(storeId, cid, null);
    }

    private Map<String, Object> seedMenu(String storeId) {
        List<MenuSpec> specs = List.of(
                new MenuSpec("SEED Margherita Pizza", "Classic tomato, mozzarella, basil",
                        Cuisine.ITALIAN, MenuCategory.PIZZA, 1290L, true),
                new MenuSpec("SEED Pepperoni Pizza", "Pepperoni and mozzarella",
                        Cuisine.ITALIAN, MenuCategory.PIZZA, 1490L, true),
                new MenuSpec("SEED Quattro Formaggi", "Four cheese pizza",
                        Cuisine.ITALIAN, MenuCategory.PIZZA, 1590L, true),
                new MenuSpec("SEED Garlic Bread", "Toasted garlic bread with herbs",
                        Cuisine.ITALIAN, MenuCategory.SIDES, 490L, false),
                new MenuSpec("SEED Caesar Salad", "Romaine, parmesan, croutons",
                        Cuisine.CONTINENTAL, MenuCategory.SIDES, 790L, false),
                new MenuSpec("SEED Tiramisu", "Coffee mascarpone dessert",
                        Cuisine.ITALIAN, MenuCategory.DESSERT_SPECIALS, 650L, false),
                new MenuSpec("SEED Espresso", "Double espresso",
                        Cuisine.BEVERAGES, MenuCategory.HOT_DRINKS, 290L, false),
                new MenuSpec("SEED Cola", "Soft drink 0.33L",
                        Cuisine.BEVERAGES, MenuCategory.COLD_DRINKS, 250L, false),
                new MenuSpec("SEED BBQ Burger", "Beef burger with BBQ sauce",
                        Cuisine.AMERICAN, MenuCategory.BURGER, 1190L, true),
                new MenuSpec("SEED French Fries", "Crispy fries",
                        Cuisine.AMERICAN, MenuCategory.SIDES, 390L, false)
        );

        List<MenuItem> existing = menuItemRepository.findByStoreId(storeId);
        List<String> createdIds = new ArrayList<>();
        int skipped = 0;
        int order = 1;
        for (MenuSpec spec : specs) {
            boolean already = existing.stream()
                    .anyMatch(m -> spec.name().equalsIgnoreCase(m.getName()));
            if (already) {
                skipped++;
                order++;
                continue;
            }
            MenuItem item = new MenuItem(spec.name(), spec.cuisine(), spec.category(), spec.priceCents());
            item.setStoreId(storeId);
            item.setDescription(spec.description());
            item.setIsAvailable(true);
            item.setIsRecommended(spec.recommended());
            item.setPreparationTime(18);
            item.setServingSize("1 portion");
            item.setSpiceLevel(SpiceLevel.MILD);
            item.setDisplayOrder(order++);
            item.setAllergensDeclared(true);
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            MenuItem saved = menuItemRepository.save(item);
            createdIds.add(saved.getId());
        }

        int total = menuItemRepository.findByStoreId(storeId).size();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("createdIds", createdIds);
        out.put("createdCount", createdIds.size());
        out.put("skipped", skipped);
        out.put("totalForStore", total);
        return out;
    }

    private Map<String, Object> seedOrders(String storeId, String customerUserId, String driverId) {
        // Fixed order numbers for idempotent upsert
        List<OrderSpec> specs = List.of(
                new OrderSpec("SEED-ORD-RECV-1", Order.OrderStatus.RECEIVED, Order.OrderType.DELIVERY, false),
                new OrderSpec("SEED-ORD-PREP-1", Order.OrderStatus.PREPARING, Order.OrderType.DELIVERY, false),
                new OrderSpec("SEED-ORD-OVEN-1", Order.OrderStatus.OVEN, Order.OrderType.TAKEAWAY, false),
                new OrderSpec("SEED-ORD-READY-1", Order.OrderStatus.READY, Order.OrderType.TAKEAWAY, false),
                new OrderSpec("SEED-ORD-DISP-1", Order.OrderStatus.DISPATCHED, Order.OrderType.DELIVERY, false),
                new OrderSpec("SEED-ORD-OFD-1", Order.OrderStatus.OUT_FOR_DELIVERY, Order.OrderType.DELIVERY, false),
                new OrderSpec("SEED-ORD-DLVR-1", Order.OrderStatus.DELIVERED, Order.OrderType.DELIVERY, true),
                new OrderSpec("SEED-ORD-DLVR-2", Order.OrderStatus.DELIVERED, Order.OrderType.DELIVERY, true),
                new OrderSpec("SEED-ORD-COMP-1", Order.OrderStatus.COMPLETED, Order.OrderType.TAKEAWAY, true),
                new OrderSpec("SEED-ORD-CANC-1", Order.OrderStatus.CANCELLED, Order.OrderType.DELIVERY, false)
        );

        List<MenuItem> menu = menuItemRepository.findByStoreId(storeId);
        String menuItemId = menu.isEmpty() ? "seed-menu-placeholder" : menu.get(0).getId();
        String menuName = menu.isEmpty() ? "SEED Margherita Pizza" : menu.get(0).getName();
        double price = menu.isEmpty() ? 12.90 : menu.get(0).getBasePrice() / 100.0;

        List<String> orderIds = new ArrayList<>();
        Map<String, String> orderNumberToId = new LinkedHashMap<>();
        List<String> paidOrderIds = new ArrayList<>();
        List<String> deliveryTrackingOrderIds = new ArrayList<>();
        int created = 0;
        int updated = 0;

        LocalDateTime now = LocalDateTime.now();
        int hoursAgo = 10;
        for (OrderSpec spec : specs) {
            Optional<Order> existing = orderRepository.findByOrderNumber(spec.orderNumber());
            Order order = existing.orElseGet(Order::new);
            boolean isNew = existing.isEmpty();

            order.setOrderNumber(spec.orderNumber());
            order.setStoreId(storeId);
            // CRITICAL: customerId must equal JWT sub (userId), not customer document id
            order.setCustomerId(customerUserId);
            order.setCustomerName("Anna Mueller");
            order.setCustomerEmail("anna.mueller@gmail.com");
            order.setCustomerPhone("+491511000011");
            order.setStatus(spec.status());
            order.setOrderType(spec.type());
            order.setOrderSource(OrderSource.MASOVA);
            order.setPaymentStatus(spec.paid() ? Order.PaymentStatus.PAID : Order.PaymentStatus.PENDING);
            order.setPaymentMethod(spec.type() == Order.OrderType.TAKEAWAY
                    ? Order.PaymentMethod.CASH : Order.PaymentMethod.CARD);
            order.setPriority(Order.Priority.NORMAL);
            order.setCurrency("EUR");
            order.setVatCountryCode("DE");

            if (driverId != null && !driverId.isBlank()
                    && (spec.status() == Order.OrderStatus.OUT_FOR_DELIVERY
                    || spec.status() == Order.OrderStatus.DELIVERED
                    || spec.status() == Order.OrderStatus.DISPATCHED)) {
                order.setAssignedDriverId(driverId);
            }

            OrderItem item = OrderItem.builder()
                    .menuItemId(menuItemId)
                    .name(menuName)
                    .quantity(1)
                    .price(price)
                    .category("FOOD")
                    .build();
            order.setItems(List.of(item));

            BigDecimal sub = BigDecimal.valueOf(price);
            BigDecimal fee = spec.type() == Order.OrderType.DELIVERY
                    ? new BigDecimal("2.50") : BigDecimal.ZERO;
            BigDecimal tax = sub.multiply(new BigDecimal("0.07")).setScale(2, java.math.RoundingMode.HALF_UP);
            order.setSubtotal(sub);
            order.setDeliveryFee(fee);
            order.setTax(tax);
            order.setTotal(sub.add(fee).add(tax));
            order.setTotalNetAmount(sub);
            order.setTotalVatAmount(tax);
            order.setTotalGrossAmount(order.getTotal());

            if (spec.type() == Order.OrderType.DELIVERY) {
                order.setDeliveryAddress(DeliveryAddress.builder()
                        .street("Alexanderplatz 1")
                        .city("Berlin")
                        .state("Berlin")
                        .pincode("10178")
                        .latitude(52.5219)
                        .longitude(13.4132)
                        .build());
            }

            order.setSpecialInstructions("Seed order " + spec.orderNumber());
            order.setPreparationTime(25);
            order.setReceivedAt(now.minusHours(hoursAgo));
            if (order.getCreatedAt() == null) {
                order.setCreatedAt(now.minusHours(hoursAgo));
            }
            order.setUpdatedAt(now);

            applyStatusTimestamps(order, spec.status(), now, hoursAgo);

            if (spec.status() == Order.OrderStatus.CANCELLED) {
                order.setCancellationReason("Seed cancelled order");
                order.setCancelledAt(now.minusHours(hoursAgo - 1));
            }

            Order saved = orderRepository.save(order);
            orderIds.add(saved.getId());
            orderNumberToId.put(spec.orderNumber(), saved.getId());
            if (spec.paid()) {
                paidOrderIds.add(saved.getId());
            }
            // Logistics delivery_trackings.orderId must be commerce Mongo _id
            if (spec.orderNumber().equals("SEED-ORD-OFD-1")
                    || spec.orderNumber().equals("SEED-ORD-DLVR-1")
                    || spec.orderNumber().equals("SEED-ORD-DLVR-2")
                    || spec.orderNumber().equals("SEED-ORD-DISP-1")) {
                deliveryTrackingOrderIds.add(saved.getId());
            }
            if (isNew) {
                created++;
            } else {
                updated++;
            }
            hoursAgo = Math.max(1, hoursAgo - 1);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("orderIds", orderIds);
        out.put("orderNumberToId", orderNumberToId);
        out.put("paidOrderIds", paidOrderIds);
        out.put("deliveryTrackingOrderIds", deliveryTrackingOrderIds);
        out.put("createdCount", created);
        out.put("updatedCount", updated);
        out.put("totalSeedOrders", orderIds.size());
        out.put("customerId", customerUserId);
        out.put("ownershipNote", "order.customerId equals JWT userId (sub), not Customer document id");
        return out;
    }

    private void applyStatusTimestamps(Order order, Order.OrderStatus status, LocalDateTime now, int baseHours) {
        LocalDateTime t = now.minusHours(baseHours);
        order.setReceivedAt(t);
        if (status.ordinal() >= Order.OrderStatus.PREPARING.ordinal()
                && status != Order.OrderStatus.CANCELLED) {
            order.setPreparingStartedAt(t.plusMinutes(5));
        }
        if (status.ordinal() >= Order.OrderStatus.OVEN.ordinal()
                && status != Order.OrderStatus.CANCELLED) {
            order.setOvenStartedAt(t.plusMinutes(12));
        }
        if (status.ordinal() >= Order.OrderStatus.BAKED.ordinal()
                && status != Order.OrderStatus.CANCELLED
                && status != Order.OrderStatus.PREPARING
                && status != Order.OrderStatus.RECEIVED) {
            order.setBakedAt(t.plusMinutes(22));
        }
        if (status.ordinal() >= Order.OrderStatus.READY.ordinal()
                && status != Order.OrderStatus.CANCELLED
                && status.ordinal() > Order.OrderStatus.OVEN.ordinal()) {
            order.setReadyAt(t.plusMinutes(28));
        }
        if (status == Order.OrderStatus.DISPATCHED
                || status == Order.OrderStatus.OUT_FOR_DELIVERY
                || status == Order.OrderStatus.DELIVERED) {
            order.setDispatchedAt(t.plusMinutes(32));
        }
        if (status == Order.OrderStatus.OUT_FOR_DELIVERY || status == Order.OrderStatus.DELIVERED) {
            order.setOutForDeliveryAt(t.plusMinutes(35));
        }
        if (status == Order.OrderStatus.DELIVERED) {
            order.setDeliveredAt(t.plusMinutes(50));
            order.setCompletedAt(t.plusMinutes(50));
        }
        if (status == Order.OrderStatus.COMPLETED) {
            order.setCompletedAt(t.plusMinutes(40));
            order.setReadyAt(t.plusMinutes(28));
        }
    }

    private record MenuSpec(
            String name,
            String description,
            Cuisine cuisine,
            MenuCategory category,
            long priceCents,
            boolean recommended) {}

    private record OrderSpec(
            String orderNumber,
            Order.OrderStatus status,
            Order.OrderType type,
            boolean paid) {}
}
