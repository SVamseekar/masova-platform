package com.MaSoVa.commerce.contract;

import au.com.dius.pact.core.model.Interaction;
import au.com.dius.pact.core.model.Pact;
import au.com.dius.pact.provider.HttpClientFactory;
import au.com.dius.pact.provider.IHttpClientFactory;
import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.IgnoreNoPactsToVerify;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.StateChangeAction;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.spring6.PactVerificationSpring6Provider;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import kotlin.Pair;
import org.apache.hc.client5.http.classic.methods.HttpUriRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import com.MaSoVa.commerce.menu.repository.MenuItemRepository;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("commerce-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class CommercePactVerificationIT extends BaseFullIntegrationTest {

    /**
     * Read from the live Spring environment (not hardcoded) so this always matches whatever
     * jwt.secret is active - application-test.yml locally, or the JWT_SECRET env var override in CI.
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    @LocalServerPort
    int port;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void before(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new AuthInjectingTestTarget("localhost", port));
        }
    }

    @TestTemplate
    @ExtendWith(PactVerificationSpring6Provider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        if (context != null) { context.verifyInteraction(); }
    }

    /**
     * Pact-jvm's junit5 HttpTestTarget has no @TargetRequestFilter support (that hook only
     * exists in the junit4 module) - override prepareRequest to inject a real signed JWT so
     * requests pass commerce-service's auth filter. Pact only checks headers declared in the
     * contract, so this extra/overridden header does not break matching.
     */
    private final class AuthInjectingTestTarget extends HttpTestTarget {
        AuthInjectingTestTarget(String host, int port) {
            super(host, port, "/", () -> (IHttpClientFactory) new HttpClientFactory());
        }

        @Override
        public Pair<Object, Object> prepareRequest(Pact pact, Interaction interaction, Map<String, Object> context) {
            Pair<Object, Object> result = super.prepareRequest(pact, interaction, context);
            if (result != null && result.getFirst() instanceof HttpUriRequest httpRequest) {
                httpRequest.setHeader("Authorization", "Bearer " + generateTestJwt());
                httpRequest.setHeader("X-User-Type", "MANAGER");
                httpRequest.setHeader("X-Selected-Store-Id", "store-1");
                httpRequest.setHeader("X-User-Store-Id", "store-1");
                httpRequest.setHeader("X-User-Id", "pact-test-user");
            }
            return result;
        }
    }

    private String generateTestJwt() {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        return Jwts.builder()
                .subject("pact-test-user")
                .claim("email", "pact-test@masova.com")
                .claim("roles", List.of("CUSTOMER", "MANAGER", "DRIVER"))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + Duration.ofMinutes(5).toMillis()))
                .signWith(key)
                .compact();
    }

    @State("menu items exist")
    void menuItemsExist() {
        MenuItem menuItem = new MenuItem("Margherita Pizza", Cuisine.NORTH_INDIAN, MenuCategory.DOSA, 29900L);
        menuItem.setId("menu-1");
        menuItem.setStoreId("store-1");
        menuItem.setIsAvailable(true);
        menuItemRepository.save(menuItem);
    }

    @State(value = "menu items exist", action = StateChangeAction.TEARDOWN)
    void cleanupMenuItems() {
        menuItemRepository.deleteById("menu-1");
    }

    @State("menu item exists with id menu-pact-1")
    void menuItemExistsWithIdMenuPact1() {
        MenuItem menuItem = new MenuItem("Margherita Pizza", Cuisine.NORTH_INDIAN, MenuCategory.DOSA, 29900L);
        menuItem.setId("menu-pact-1");
        menuItem.setStoreId("store-1");
        menuItem.setIsAvailable(true);
        menuItemRepository.save(menuItem);
    }

    @State(value = "menu item exists with id menu-pact-1", action = StateChangeAction.TEARDOWN)
    void cleanupMenuItemMenuPact1() {
        menuItemRepository.deleteById("menu-pact-1");
    }

    @State("store exists with id store-1")
    void storeExistsWithIdStore1() {
        // Store lookup in OrderService falls back gracefully (WARN-logged Feign failure) -
        // no seeding required, this state only needs to exist to satisfy Pact's state-change hook.
    }

    @State("order exists with id ORDER-PACT-1")
    void orderExists() {
        orderRepository.save(buildOrder("ORDER-PACT-1", "ORD-PACT-UPPER-1"));
    }

    @State(value = "order exists with id ORDER-PACT-1", action = StateChangeAction.TEARDOWN)
    void cleanupOrder() {
        orderRepository.deleteById("ORDER-PACT-1");
    }

    @State("order exists with id order-pact-1")
    void orderExistsLowercase() {
        orderRepository.save(buildOrder("order-pact-1", "ORD-PACT-LOWER-1"));
    }

    @State(value = "order exists with id order-pact-1", action = StateChangeAction.TEARDOWN)
    void cleanupOrderLowercase() {
        orderRepository.deleteById("order-pact-1");
    }

    private Order buildOrder(String id, String orderNumber) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber(orderNumber);
        order.setCustomerName("Test Customer");
        order.setStoreId("store-1");
        order.setStatus(Order.OrderStatus.RECEIVED);
        order.setOrderType(Order.OrderType.DELIVERY);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setTotal(BigDecimal.valueOf(299));
        order.setItems(List.of(
                OrderItem.builder()
                        .menuItemId("item-1")
                        .name("Pizza")
                        .quantity(1)
                        .price(299.0)
                        .build()
        ));
        return order;
    }

    @State("no data")
    void noData() {
    }
}
