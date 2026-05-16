package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.UserController;
import com.MaSoVa.core.user.dto.LoginResponse;
import com.MaSoVa.core.user.dto.UserResponse;
import com.MaSoVa.core.user.service.JwtService;
import com.MaSoVa.core.user.service.UserService;
import com.MaSoVa.core.user.service.WorkingSessionService;
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

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest extends BaseServiceTest {

    @Mock private UserService userService;
    @Mock private JwtService jwtService;
    @Mock private WorkingSessionService workingSessionService;

    @InjectMocks private UserController userController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private UserResponse buildUser(String id) {
        UserResponse u = new UserResponse();
        u.setId(id);
        u.setEmail("staff@masova.com");
        return u;
    }

    @Nested
    @DisplayName("GET /api/users")
    class GetUsers {

        @Test
        @DisplayName("returns 200 with list of users")
        void returns200WithUsers() throws Exception {
            when(userService.getAllUsers()).thenReturn(List.of(buildUser("u1")));

            mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("u1"));
        }

        @Test
        @DisplayName("returns 200 with empty list when no users")
        void returns200WithEmptyList() throws Exception {
            when(userService.getAllUsers()).thenReturn(List.of());

            mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{userId}")
    class GetUser {

        @Test
        @DisplayName("returns 200 when user exists")
        void returns200WhenExists() throws Exception {
            when(userService.getUserResponseById("user-1")).thenReturn(buildUser("user-1"));

            mockMvc.perform(get("/api/users/user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-1"));
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/activate")
    class ActivateUser {

        @Test
        @DisplayName("returns 200 on successful activation")
        void returns200OnActivation() throws Exception {
            doNothing().when(userService).activateUser("user-1");

            mockMvc.perform(post("/api/users/user-1/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User activated successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/deactivate")
    class DeactivateUser {

        @Test
        @DisplayName("returns 200 on successful deactivation")
        void returns200OnDeactivation() throws Exception {
            doNothing().when(userService).deactivateUser("user-1");

            mockMvc.perform(post("/api/users/user-1/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deactivated successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/generate-pin")
    class GeneratePin {

        @Test
        @DisplayName("returns 200 with generated PIN")
        void returns200WithPin() throws Exception {
            when(userService.generateEmployeePIN("user-1")).thenReturn("12345");

            mockMvc.perform(post("/api/users/user-1/generate-pin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pin").value("12345"))
                .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("POST /api/users/kiosk")
    class CreateKiosk {

        @Test
        @DisplayName("returns 400 when storeId is missing")
        void returns400WhenStoreIdMissing() throws Exception {
            mockMvc.perform(post("/api/users/kiosk")
                    .header("X-User-Id", "manager-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"terminalId\":\"POS-01\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when terminalId is missing")
        void returns400WhenTerminalIdMissing() throws Exception {
            mockMvc.perform(post("/api/users/kiosk")
                    .header("X-User-Id", "manager-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"storeId\":\"store-1\"}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/users/kiosk")
    class ListKiosks {

        @Test
        @DisplayName("returns 200 with kiosk accounts for store")
        void returns200() throws Exception {
            when(userService.getKioskAccountsByStore("store-1")).thenReturn(List.of(buildUser("k1")));

            mockMvc.perform(get("/api/users/kiosk").param("storeId", "store-1"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/users/kiosk/{kioskUserId}/deactivate")
    class DeactivateKiosk {

        @Test
        @DisplayName("returns 200 on deactivation")
        void returns200() throws Exception {
            doNothing().when(userService).deactivateKioskAccount(anyString(), anyString());

            mockMvc.perform(post("/api/users/kiosk/k1/deactivate")
                    .header("X-User-Id", "manager-1"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/users/kiosk/auto-login")
    class KioskAutoLogin {

        @Test
        @DisplayName("returns 400 when kioskToken is missing")
        void returns400WhenTokenMissing() throws Exception {
            mockMvc.perform(post("/api/users/kiosk/auto-login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 401 when token is not a kiosk token")
        void returns401WhenNotKioskToken() throws Exception {
            when(jwtService.isKioskToken("invalid-token")).thenReturn(false);

            mockMvc.perform(post("/api/users/kiosk/auto-login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"kioskToken\":\"invalid-token\"}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{userId}/status")
    class GetDriverStatus {

        @Test
        @DisplayName("returns driver status when user is a driver")
        void returnsStatus() throws Exception {
            com.MaSoVa.shared.entity.User driver = new com.MaSoVa.shared.entity.User();
            driver.setId("d1");
            driver.setType(com.MaSoVa.shared.enums.UserType.DRIVER);
            com.MaSoVa.shared.entity.User.EmployeeDetails details = new com.MaSoVa.shared.entity.User.EmployeeDetails();
            details.setStatus("AVAILABLE");
            driver.setEmployeeDetails(details);
            when(userService.getUserByIdUncached("d1")).thenReturn(driver);
            when(workingSessionService.isEmployeeCurrentlyWorking("d1")).thenReturn(true);

            mockMvc.perform(get("/api/users/d1/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("AVAILABLE"));
        }

        @Test
        @DisplayName("returns 400 when user is not a driver")
        void returns400WhenNotDriver() throws Exception {
            com.MaSoVa.shared.entity.User notDriver = new com.MaSoVa.shared.entity.User();
            notDriver.setId("u1");
            notDriver.setType(com.MaSoVa.shared.enums.UserType.CUSTOMER);
            when(userService.getUserByIdUncached("u1")).thenReturn(notDriver);

            mockMvc.perform(get("/api/users/u1/status"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PATCH /api/users/{userId}/status")
    class UpdateDriverStatus {

        @Test
        @DisplayName("returns 400 when status is invalid")
        void returns400WhenInvalidStatus() throws Exception {
            mockMvc.perform(patch("/api/users/d1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"INVALID_STATUS\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when status is missing")
        void returns400WhenStatusMissing() throws Exception {
            mockMvc.perform(patch("/api/users/d1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 200 when status is valid AVAILABLE")
        void returns200WhenValid() throws Exception {
            doNothing().when(userService).updateDriverStatus("d1", "AVAILABLE");

            mockMvc.perform(patch("/api/users/d1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"AVAILABLE\"}"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/users — filtered queries")
    class GetUsersFiltered {

        @Test
        @DisplayName("returns DRIVER list when type=DRIVER and storeId given")
        void returnsDriversByStore() throws Exception {
            when(userService.getDriversByStore("store-1")).thenReturn(List.of(buildUser("d1")));

            mockMvc.perform(get("/api/users")
                    .param("type", "DRIVER")
                    .param("storeId", "store-1"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns filtered by type and store")
        void returnsByTypeAndStore() throws Exception {
            when(userService.getUsersByTypeAndStore(any(), anyString())).thenReturn(List.of());

            mockMvc.perform(get("/api/users")
                    .param("type", "STAFF")
                    .param("storeId", "store-1"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns store employees when only storeId given")
        void returnsByStoreOnly() throws Exception {
            when(userService.getStoreEmployees("store-1")).thenReturn(List.of());

            mockMvc.perform(get("/api/users")
                    .param("storeId", "store-1"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by type when only type given")
        void returnsByTypeOnly() throws Exception {
            when(userService.getUsersByType(any())).thenReturn(List.of());

            mockMvc.perform(get("/api/users")
                    .param("type", "MANAGER"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/generate-pin (bulk)")
    class GeneratePinBulk {

        @Test
        @DisplayName("returns bulk results when bulk=true")
        void returnsBulkResults() throws Exception {
            when(userService.generatePINsForAllEmployees()).thenReturn(Map.of("emp-1", "12345"));

            mockMvc.perform(post("/api/users/user-1/generate-pin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"bulk\":true}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalProcessed").value(1));
        }
    }

    @Nested
    @DisplayName("PATCH /api/users/{userId}")
    class UpdateUser {

        @Test
        @DisplayName("returns 200 with updated user")
        void returns200OnUpdate() throws Exception {
            when(userService.updateUser(anyString(), any())).thenReturn(buildUser("user-1"));

            mockMvc.perform(patch("/api/users/user-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"type\":\"CUSTOMER\",\"name\":\"Updated\",\"email\":\"upd@masova.com\",\"phone\":\"9876543210\",\"password\":\"pass1234\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("user-1"));
        }
    }

    @Nested
    @DisplayName("POST /api/users/kiosk/{kioskUserId}/regenerate")
    class RegenerateKioskTokens {

        @Test
        @DisplayName("returns 200 with regenerated tokens")
        void returns200WithTokens() throws Exception {
            com.MaSoVa.shared.entity.User kiosk = new com.MaSoVa.shared.entity.User();
            kiosk.setId("k1");
            com.MaSoVa.shared.entity.User.EmployeeDetails details = new com.MaSoVa.shared.entity.User.EmployeeDetails();
            details.setTerminalId("POS-01");
            kiosk.setEmployeeDetails(details);

            com.MaSoVa.core.user.dto.UserResponse ur = buildUser("k1");
            LoginResponse tokens = new LoginResponse("new.access", "new.refresh", ur);

            when(userService.generateKioskTokens("k1")).thenReturn(tokens);
            when(userService.getUserById("k1")).thenReturn(kiosk);

            mockMvc.perform(post("/api/users/kiosk/k1/regenerate")
                    .header("X-User-Id", "manager-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("new.access"))
                    .andExpect(jsonPath("$.terminalId").value("POS-01"));
        }
    }

    @Nested
    @DisplayName("GET /api/users/{userId}/can-take-orders")
    class CanTakeOrders {

        @Test
        @DisplayName("returns 200 with canTakeOrders field")
        void returns200WithPermission() throws Exception {
            com.MaSoVa.shared.entity.User user = new com.MaSoVa.shared.entity.User();
            user.setId("emp-1");
            user.setType(com.MaSoVa.shared.enums.UserType.STAFF);
            user.setActive(true);
            when(userService.canUserTakeOrders("emp-1")).thenReturn(true);
            when(userService.getUserById("emp-1")).thenReturn(user);

            mockMvc.perform(get("/api/users/emp-1/can-take-orders"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.canTakeOrders").value(true));
        }
    }

    @Nested
    @DisplayName("POST /api/users/kiosk/auto-login — valid kiosk token")
    class KioskAutoLoginValid {

        @Test
        @DisplayName("returns 200 with user when token is valid and not near expiry")
        void returns200ForValidToken() throws Exception {
            com.MaSoVa.shared.entity.User kiosk = new com.MaSoVa.shared.entity.User();
            kiosk.setId("k1");
            kiosk.setType(com.MaSoVa.shared.enums.UserType.KIOSK);
            kiosk.setActive(true);

            com.MaSoVa.core.user.dto.UserResponse ur = buildUser("k1");

            when(jwtService.isKioskToken("valid-kiosk-token")).thenReturn(true);
            when(jwtService.extractUserId("valid-kiosk-token")).thenReturn("k1");
            when(userService.getUserById("k1")).thenReturn(kiosk);
            when(jwtService.extractExpiration("valid-kiosk-token"))
                    .thenReturn(new java.util.Date(System.currentTimeMillis() + 48L * 60 * 60 * 1000));
            when(userService.mapToUserResponse(kiosk)).thenReturn(ur);

            mockMvc.perform(post("/api/users/kiosk/auto-login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"kioskToken\":\"valid-kiosk-token\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.tokensRefreshed").value(false));
        }
    }

    @Nested
    @DisplayName("GET /api/users — search query")
    class GetUsersSearch {

        @Test
        @DisplayName("returns results when search param is provided")
        void returnsSearchResults() throws Exception {
            when(userService.searchUsers(anyString(), any(), any(), any(), any())).thenReturn(List.of(buildUser("u1")));

            mockMvc.perform(get("/api/users").param("search", "John"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("u1"));
        }

        @Test
        @DisplayName("returns available drivers when type=DRIVER and available=true")
        void returnsAvailableDrivers() throws Exception {
            when(userService.getAvailableDrivers("store-1")).thenReturn(List.of(buildUser("d1")));

            mockMvc.perform(get("/api/users")
                    .param("type", "DRIVER")
                    .param("available", "true")
                    .param("storeId", "store-1"))
                    .andExpect(status().isOk());
        }
    }
}
