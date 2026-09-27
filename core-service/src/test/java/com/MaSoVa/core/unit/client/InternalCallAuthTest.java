package com.MaSoVa.core.unit.client;

import com.MaSoVa.core.user.client.DeliveryServiceClient;
import com.MaSoVa.core.user.client.OrderServiceClient;
import com.MaSoVa.core.user.client.PaymentServiceClient;
import com.MaSoVa.shared.security.service.ServiceAuthProperties;
import com.MaSoVa.shared.security.service.ServiceTokenIssuer;
import com.MaSoVa.shared.security.service.ServiceTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** core-service proves its identity to internal endpoints with a signed service token (#120). */
@DisplayName("core → internal endpoint authentication")
class InternalCallAuthTest {

    private static final KeyPair CORE_KEYS = keys();

    private RestTemplate restTemplate;
    private ServiceTokenIssuer issuer;

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
    @SuppressWarnings("unchecked")
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), any(Class.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));
        ServiceAuthProperties core = new ServiceAuthProperties();
        core.setName("core-service");
        core.setPrivateKey(Base64.getEncoder().encodeToString(CORE_KEYS.getPrivate().getEncoded()));
        issuer = new ServiceTokenIssuer(core, Clock.systemUTC());
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private HttpEntity<?> sentEntity() {
        ArgumentCaptor<HttpEntity> entity = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), any(HttpMethod.class), entity.capture(), any(Class.class));
        return entity.getValue();
    }

    private void assertServiceToken(HttpEntity<?> entity, String audience, String scope) {
        assertThat(entity.getHeaders().containsKey("X-Internal-Service")).isFalse();
        String header = entity.getHeaders().getFirst("X-Service-Authorization");
        assertThat(header).startsWith("Bearer ");
        ServiceAuthProperties callee = new ServiceAuthProperties();
        callee.setName(audience);
        callee.setTrusted(Map.of("core-service",
                List.of(Base64.getEncoder().encodeToString(CORE_KEYS.getPublic().getEncoded()))));
        var claims = new ServiceTokenVerifier(callee).verify(header.substring(7));
        assertThat(claims).isPresent();
        assertThat(String.valueOf(claims.get().get("scope"))).isEqualTo("[" + scope + "]");
    }

    @Test
    @DisplayName("order anonymize sends a commerce token with the orders scope")
    void orderAnonymizeUsesServiceToken() {
        OrderServiceClient client = new OrderServiceClient(restTemplate, issuer);
        ReflectionTestUtils.setField(client, "orderServiceUrl", "http://commerce");

        client.anonymizeCustomerData("cust-1", "user-jwt");

        assertServiceToken(sentEntity(), "commerce-service", "orders:gdpr-anonymize");
    }

    @Test
    @DisplayName("rating mark-used sends a commerce token with the ratings scope")
    void markRatingUsedUsesServiceToken() {
        OrderServiceClient client = new OrderServiceClient(restTemplate, issuer);
        ReflectionTestUtils.setField(client, "orderServiceUrl", "http://commerce");

        client.markRatingTokenUsed("tok-1");

        assertServiceToken(sentEntity(), "commerce-service", "ratings:mark-used");
    }

    @Test
    @DisplayName("delivery anonymize sends a logistics token")
    void deliveryAnonymizeUsesServiceToken() {
        DeliveryServiceClient client = new DeliveryServiceClient(restTemplate, issuer);
        ReflectionTestUtils.setField(client, "deliveryServiceUrl", "http://logistics");

        client.anonymizeCustomerData("cust-1", java.util.List.of("order-1"), "user-jwt");

        assertServiceToken(sentEntity(), "logistics-service", "delivery:gdpr-anonymize");
    }

    @Test
    @DisplayName("payment anonymize sends a payment token")
    void paymentAnonymizeUsesServiceToken() {
        PaymentServiceClient client = new PaymentServiceClient(restTemplate, issuer);
        ReflectionTestUtils.setField(client, "paymentServiceUrl", "http://payment");

        client.anonymizeCustomerData("cust-1", "user-jwt");

        assertServiceToken(sentEntity(), "payment-service", "payments:gdpr-anonymize");
    }
}
