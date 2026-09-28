package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.config.SecurityConfig;
import com.MaSoVa.shared.security.service.ServiceAuthProperties;
import com.MaSoVa.shared.security.service.ServiceTokenIssuer;
import com.MaSoVa.shared.security.service.ServiceTokenVerifier;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.controller.DeliveryController;
import com.MaSoVa.logistics.delivery.service.*;
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

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GDPR erasure trusts a signed core-service token, never X-Internal-Service (#120). */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = DeliveryGdprSecurityTest.TestConfig.class)
@TestPropertySource(properties = "jwt.secret=gdpr-endpoint-test-jwt-secret-at-least-sixty-four-characters-long-ok")
class DeliveryGdprSecurityTest {

    static final KeyPair CORE_KEYS = keys();

    @Autowired private DeliveryController controller;
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
        mockMvc = MockMvcBuilders.standaloneSetup(controller).apply(springSecurity(springSecurityFilterChain)).build();
        ServiceAuthProperties core = new ServiceAuthProperties();
        core.setName("core-service");
        core.setPrivateKey(Base64.getEncoder().encodeToString(CORE_KEYS.getPrivate().getEncoded()));
        coreIssuer = new ServiceTokenIssuer(core, Clock.systemUTC());
    }

    @Test
    @DisplayName("GDPR anonymize with only X-Internal-Service is refused")
    void spoofedHeaderIsRefused() throws Exception {
        mockMvc.perform(post("/api/delivery/gdpr/anonymize").param("customerId", "victim").header("X-Internal-Service", "core-service"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GDPR anonymize with a core token and the right scope is allowed")
    void serviceTokenIsAllowed() throws Exception {
        mockMvc.perform(post("/api/delivery/gdpr/anonymize").param("customerId", "cust-9")
                        .header("X-Service-Authorization", coreIssuer.bearer("logistics-service", "delivery:gdpr-anonymize")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("a token for another service is refused")
    void otherAudienceIsRefused() throws Exception {
        mockMvc.perform(post("/api/delivery/gdpr/anonymize").param("customerId", "cust-9")
                        .header("X-Service-Authorization", coreIssuer.bearer("commerce-service", "delivery:gdpr-anonymize")))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean JwtTokenProvider jwtTokenProvider() { return new JwtTokenProvider(); }

        @Bean
        ServiceTokenVerifier serviceTokenVerifier() {
            ServiceAuthProperties self = new ServiceAuthProperties();
            self.setName("logistics-service");
            self.setTrusted(Map.of("core-service",
                    List.of(Base64.getEncoder().encodeToString(CORE_KEYS.getPublic().getEncoded()))));
            return new ServiceTokenVerifier(self);
        }

        @Bean
        com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository deliveryTrackingRepository() {
            return mock(com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository.class);
        }

        @Bean
        DeliveryController deliveryController(com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository repo) {
            DeliveryController controller = new DeliveryController(mock(AutoDispatchService.class),
                    mock(RouteOptimizationService.class), mock(DeliveryZoneService.class), mock(UserServiceClient.class),
                    mock(LiveTrackingService.class), mock(ProofOfDeliveryService.class),
                    mock(DriverAcceptanceService.class), mock(PerformanceService.class));
            org.springframework.test.util.ReflectionTestUtils.setField(controller, "deliveryTrackingRepository", repo);
            return controller;
        }
    }
}
