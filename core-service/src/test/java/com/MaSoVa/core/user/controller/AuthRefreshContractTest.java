package com.MaSoVa.core.user.controller;

import com.MaSoVa.core.user.exception.UserServiceExceptionHandler;
import com.MaSoVa.core.user.service.UserService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

class AuthRefreshContractTest {
    private UserService users;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        users = Mockito.mock(UserService.class);
        AuthController controller = new AuthController();
        ReflectionTestUtils.setField(controller, "userService", users);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new UserServiceExceptionHandler()).build();
    }

    @Test
    void expiredRefreshIsUnauthorized() throws Exception {
        when(users.refreshAccessToken("expired")).thenThrow(new ExpiredJwtException(null, null, "expired"));
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"expired\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void malformedRefreshIsUnauthorized() throws Exception {
        when(users.refreshAccessToken("malformed")).thenThrow(new MalformedJwtException("malformed"));
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"malformed\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void missingRefreshIsBadRequest() throws Exception {
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isBadRequest());
    }

    @Test
    void authorizationDenialNeverBecomesServerError() throws Exception {
        when(users.refreshAccessToken("restricted")).thenThrow(new AccessDeniedException("internal permission details"));
        mvc.perform(post("/api/auth/refresh").accept(MediaType.APPLICATION_JSON).contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"restricted\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void databaseFailureRemainsServerError() throws Exception {
        when(users.refreshAccessToken("valid")).thenThrow(new IllegalStateException("database unavailable"));
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"valid\"}")).andExpect(status().isInternalServerError());
    }
}
