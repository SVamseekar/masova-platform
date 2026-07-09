package com.MaSoVa.core.config;

import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@DisplayName("Core SecurityConfig public store endpoints")
class SecurityConfigPublicEndpointsTest {

    private final SecurityConfig securityConfig = new SecurityConfig(mock(JwtTokenProvider.class));

    @Test
    @DisplayName("public endpoints include canonical store GET paths for anonymous customers")
    void publicEndpointsIncludeStores() {
        List<String> endpoints = Arrays.asList(securityConfig.getPublicEndpointsForTest());

        assertThat(endpoints).contains("/api/stores");
        assertThat(endpoints).contains("/api/stores/**");
        assertThat(endpoints).contains("/api/stores/public");
        assertThat(endpoints).contains("/api/stores/public/**");
        // Cold-start reseed (controller only loaded under dev|demo)
        assertThat(endpoints).contains("/api/test-data/**");
        // Staff-only surfaces must not be opened
        assertThat(endpoints).doesNotContain("/api/users/**");
        assertThat(endpoints).doesNotContain("/api/sessions/**");
        assertThat(endpoints).doesNotContain("/api/notifications/**");
    }
}
