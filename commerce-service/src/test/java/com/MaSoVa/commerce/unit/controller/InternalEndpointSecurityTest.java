package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.config.SecurityConfig;
import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.controller.RatingTokenController;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.OrderSummaryService;
import com.MaSoVa.commerce.order.service.RatingTokenService;
import com.MaSoVa.shared.security.service.ServiceAuthProperties;
import com.MaSoVa.shared.security.service.ServiceTokenIssuer;
import com.MaSoVa.shared.security.service.ServiceTokenVerifier;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Internal commerce endpoints trust a signed service token, never X-Internal-Service (#120).
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = InternalEndpointSecurityTest.TestConfig.class)
@TestPropertySource(properties = "jwt.secret=" + InternalEndpointSecurityTest.JWT_SECRET)
class InternalEndpointSecurityTest {

    static final String JWT_SECRET = "internal-endpoint-test-jwt-secret-at-least-sixty-four-characters-long";
    static final KeyPair CORE_KEYS = keys();

    @Autowired private OrderController orderController;
    @Autowired private RatingTokenController ratingTokenController;
    @Autowired private OrderService orderService;
    @Autowired private RatingTokenService ratingTokenService;
    @Autowired private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;
    private ServiceTokenIssuer coreIssuer;

    private static KeyPair keys() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            return generator.generateKeyPair();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.reset(orderService, ratingTokenService);
        mockMvc = MockMvcBuilders.standaloneSetup(orderController, ratingTokenController)
                .apply(springSecurity(springSecurityFilterChain))
                .build();
        ServiceAuthProperties core = new ServiceAuthProperties();
        core.setName("core-service");
        core.setPrivateKey(Base64.getEncoder().encodeToString(CORE_KEYS.getPrivate().getEncoded()));
        coreIssuer = new ServiceTokenIssuer(core, Clock.systemUTC());
    }

    private String customerJwt() {
        return Jwts.builder().subject("cust-1").claim("roles", List.of("CUSTOMER")).claim("storeId", "store-1")
                .issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    @Test
    @DisplayName("GDPR anonymize with only X-Internal-Service is refused")
    void anonymizeWithSpoofedHeaderIsRefused() throws Exception {
        mockMvc.perform(post("/api/orders/gdpr/anonymize").param("customerId", "victim")
                        .header("Authorization", "Bearer " + customerJwt())
                        .header("X-Internal-Service", "core-service"))
                .andExpect(status().isForbidden());

        verify(orderService, never()).anonymizeCustomerOrders(anyString());
    }

    @Test
    @DisplayName("GDPR anonymize with a core service token and the right scope is allowed")
    void anonymizeWithServiceTokenIsAllowed() throws Exception {
        mockMvc.perform(post("/api/orders/gdpr/anonymize").param("customerId", "cust-9")
                        .header("X-Service-Authorization", coreIssuer.bearer("commerce-service", "orders:gdpr-anonymize")))
                .andExpect(status().isOk());

        verify(orderService).anonymizeCustomerOrders("cust-9");
    }

    @Test
    @DisplayName("GDPR anonymize with a service token lacking the scope is refused")
    void anonymizeWithoutScopeIsRefused() throws Exception {
        mockMvc.perform(post("/api/orders/gdpr/anonymize").param("customerId", "cust-9")
                        .header("X-Service-Authorization", coreIssuer.bearer("commerce-service", "ratings:mark-used")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("rating mark-used with only X-Internal-Service is refused")
    void markUsedWithSpoofedHeaderIsRefused() throws Exception {
        mockMvc.perform(post("/api/orders/rating-token/tok-1/mark-used")
                        .header("X-Internal-Service", "core-service"))
                .andExpect(status().is4xxClientError());

        verify(ratingTokenService, never()).markTokenAsUsed(anyString());
    }

    @Test
    @DisplayName("rating mark-used with a core service token is allowed")
    void markUsedWithServiceTokenIsAllowed() throws Exception {
        mockMvc.perform(post("/api/orders/rating-token/tok-1/mark-used")
                        .header("X-Service-Authorization", coreIssuer.bearer("commerce-service", "ratings:mark-used")))
                .andExpect(status().isOk());

        verify(ratingTokenService).markTokenAsUsed("tok-1");
    }

    @Test
    @DisplayName("payment status PATCH with forged internal headers and a customer JWT is refused")
    void paymentPatchWithForgedHeadersIsRefused() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/orders/o1/payment")
                        .header("Authorization", "Bearer " + customerJwt())
                        .header("X-Internal-Service", "payment-service")
                        .header("X-Internal-Payment-Credential", "anything")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAID\",\"transactionId\":\"t\"}"))
                .andExpect(status().isForbidden());

        verify(orderService, never()).updatePaymentStatus(anyString(),
                org.mockito.ArgumentMatchers.any(), anyString());
    }

    @TestConfiguration
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean OrderService orderService() { return mock(OrderService.class); }
        @Bean OrderSummaryService orderSummaryService() { return mock(OrderSummaryService.class); }
        @Bean RatingTokenService ratingTokenService() { return mock(RatingTokenService.class); }
        @Bean ObjectMapper objectMapper() { return new ObjectMapper().registerModule(new JavaTimeModule()); }
        @Bean JwtTokenProvider jwtTokenProvider() { return new JwtTokenProvider(); }

        @Bean
        ServiceTokenVerifier serviceTokenVerifier() {
            ServiceAuthProperties commerce = new ServiceAuthProperties();
            commerce.setName("commerce-service");
            commerce.setTrusted(Map.of("core-service",
                    List.of(Base64.getEncoder().encodeToString(CORE_KEYS.getPublic().getEncoded()))));
            return new ServiceTokenVerifier(commerce);
        }

        @Bean
        OrderController orderController(OrderService orderService, OrderSummaryService orderSummaryService,
                                        ObjectMapper objectMapper) {
            return new OrderController(orderService, orderSummaryService, objectMapper);
        }

        @Bean
        RatingTokenController ratingTokenController(RatingTokenService ratingTokenService) {
            return new RatingTokenController(ratingTokenService);
        }
    }
}
