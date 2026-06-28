package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.AuthController;
import com.MaSoVa.core.user.dto.LoginRequest;
import com.MaSoVa.core.user.dto.LoginResponse;
import com.MaSoVa.core.user.dto.UserCreateRequest;
import com.MaSoVa.core.user.dto.UserResponse;
import com.MaSoVa.core.user.service.UserService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest extends BaseServiceTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private LoginResponse buildLoginResponse() {
        UserResponse user = new UserResponse();
        user.setId("user-1");
        return new LoginResponse("access.token.here", "refresh.token.here", user);
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with tokens on valid credentials")
        void returns200OnValidCredentials() throws Exception {
            when(userService.authenticate(any(LoginRequest.class))).thenReturn(buildLoginResponse());

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"test@masova.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access.token.here"));
        }

        @Test
        @DisplayName("returns 400 when email is missing")
        void returns400WhenEmailMissing() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when password is too short")
        void returns400WhenPasswordTooShort() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"test@masova.com\",\"password\":\"bad\"}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("returns 200 on successful registration")
        void returns200OnRegistration() throws Exception {
            when(userService.registerUser(any(UserCreateRequest.class))).thenReturn(buildLoginResponse());

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"type\":\"CUSTOMER\",\"name\":\"Test User\",\"email\":\"new@masova.com\",\"phone\":\"9876543210\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test
        @DisplayName("returns 200 on successful logout")
        void returns200OnLogout() throws Exception {
            doNothing().when(userService).logout(anyString(), anyString());

            mockMvc.perform(post("/api/auth/logout")
                    .header("X-User-Id", "user-1")
                    .header("Authorization", "Bearer valid.token.here"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
        }

        @Test
        @DisplayName("returns 400 when Authorization header is missing")
        void returns400WhenAuthHeaderMissing() throws Exception {
            mockMvc.perform(post("/api/auth/logout")
                    .header("X-User-Id", "user-1"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("returns 200 with new access token")
        void returns200WithNewToken() throws Exception {
            when(userService.refreshAccessToken(anyString())).thenReturn("new.access.token");

            mockMvc.perform(post("/api/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"refreshToken\":\"valid.refresh.token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new.access.token"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/change-password")
    class ChangePassword {

        @Test
        @DisplayName("returns 200 on successful password change")
        void returns200OnPasswordChange() throws Exception {
            doNothing().when(userService).changePassword(anyString(), anyString(), anyString());

            mockMvc.perform(post("/api/auth/change-password")
                    .header("X-User-Id", "user-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"currentPassword\":\"oldPass123\",\"newPassword\":\"newPass456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/google")
    class GoogleSignIn {

        @Test
        @DisplayName("returns 200 when Google user exists (login path)")
        void returns200ForExistingGoogleUser() throws Exception {
            when(userService.loginWithGoogle(anyString())).thenReturn(buildLoginResponse());

            mockMvc.perform(post("/api/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"idToken\":\"google.id.token\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 when Google user not found (register path)")
        void returns200ForNewGoogleUser() throws Exception {
            when(userService.loginWithGoogle(anyString())).thenThrow(new NoSuchElementException("User not found"));
            when(userService.registerWithGoogle(anyString())).thenReturn(buildLoginResponse());

            mockMvc.perform(post("/api/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"idToken\":\"new.google.id.token\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/validate-pin")
    class ValidatePin {

        @Test
        @DisplayName("returns 400 when PIN format is invalid (not 5 digits)")
        void returns400ForInvalidPinFormat() throws Exception {
            mockMvc.perform(post("/api/auth/validate-pin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"pin\":\"123\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 401 when user is null (PIN not found)")
        void returns401WhenUserNotFound() throws Exception {
            when(userService.findUserByPIN("99999")).thenReturn(null);

            mockMvc.perform(post("/api/auth/validate-pin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"pin\":\"99999\"}"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 200 with user info when PIN is valid and user is active employee")
        void returns200ForValidPin() throws Exception {
            com.MaSoVa.shared.entity.User emp = new com.MaSoVa.shared.entity.User();
            emp.setId("emp-1");
            emp.setType(com.MaSoVa.shared.enums.UserType.STAFF);
            emp.setActive(true);
            com.MaSoVa.shared.entity.User.PersonalInfo info = new com.MaSoVa.shared.entity.User.PersonalInfo();
            info.setName("Test Employee");
            emp.setPersonalInfo(info);
            com.MaSoVa.shared.entity.User.EmployeeDetails details = new com.MaSoVa.shared.entity.User.EmployeeDetails();
            details.setRole("STAFF");
            details.setStoreId("store-1");
            emp.setEmployeeDetails(details);
            when(userService.findUserByPIN("12345")).thenReturn(emp);

            mockMvc.perform(post("/api/auth/validate-pin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"pin\":\"12345\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("emp-1"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/google — failure path")
    class GoogleSignInFailure {

        @Test
        @DisplayName("returns 401 when Google sign-in throws unexpected exception")
        void returns401OnUnexpectedException() throws Exception {
            when(userService.loginWithGoogle(anyString()))
                    .thenThrow(new RuntimeException("Google API unreachable"));

            mockMvc.perform(post("/api/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"idToken\":\"bad.token\"}"))
                .andExpect(status().isUnauthorized());
        }
    }
}
