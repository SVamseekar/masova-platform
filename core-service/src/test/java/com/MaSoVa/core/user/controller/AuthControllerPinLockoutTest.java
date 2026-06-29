package com.MaSoVa.core.user.controller;

import com.MaSoVa.core.user.service.JwtService;
import com.MaSoVa.core.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController PIN lockout (Task 10)")
class AuthControllerPinLockoutTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    @DisplayName("resolveClientIp uses socket peer, not X-Forwarded-For")
    void resolveClientIpIgnoresSpoofedHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("172.16.0.5");
        request.addHeader("X-Forwarded-For", "1.2.3.4");
        request.addHeader("X-Real-IP", "5.6.7.8");

        assertThat(AuthController.resolveClientIp(request)).isEqualTo("172.16.0.5");
    }

    @Test
    @DisplayName("pinLockoutKey combines PIN and peer IP")
    void pinLockoutKeyCombinesPinAndIp() {
        assertThat(AuthController.pinLockoutKey("12345", "10.0.0.1")).isEqualTo("12345|10.0.0.1");
    }

    @Test
    @DisplayName("spoofing X-Forwarded-For does not reset PIN lockout counter")
    void lockoutPersistsDespiteSpoofedXForwardedFor() throws Exception {
        when(userService.findUserByPIN("77777")).thenReturn(null);

        for (int i = 0; i < 5; i++) {
            int attempt = i;
            mockMvc.perform(post("/api/auth/validate-pin")
                            .with(req -> {
                                ((MockHttpServletRequest) req).setRemoteAddr("10.0.0.1");
                                return req;
                            })
                            .header("X-Forwarded-For", "spoofed-" + attempt)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"pin\":\"77777\"}"))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/validate-pin")
                        .with(req -> {
                            ((MockHttpServletRequest) req).setRemoteAddr("10.0.0.1");
                            return req;
                        })
                        .header("X-Forwarded-For", "totally-different-ip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pin\":\"77777\"}"))
                .andExpect(status().isTooManyRequests());
    }
}