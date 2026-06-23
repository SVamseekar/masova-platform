package com.MaSoVa.commerce.config;

import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@DisplayName("Commerce SecurityConfig (Task 12)")
class SecurityConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig(mock(JwtTokenProvider.class));

    @Test
    @DisplayName("public endpoints exclude kitchen display routes")
    void publicEndpointsExcludeKitchen() {
        String[] endpoints = securityConfig.getPublicEndpointsForTest();

        assertThat(Arrays.asList(endpoints)).doesNotContain("/api/orders/kitchen");
        assertThat(Arrays.asList(endpoints)).doesNotContain("/api/orders/kitchen/**");
        assertThat(Arrays.asList(endpoints)).contains("/api/orders/track/**");
    }
}