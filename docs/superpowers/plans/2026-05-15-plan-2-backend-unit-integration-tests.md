# Backend Unit & Integration Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve 80% line coverage across all 6 backend services by writing unit tests (`*Test.java`) for every controller and service, and integration tests (`*IT.java`) for every controller using Testcontainers.

**Architecture:** Unit tests use `@ExtendWith(MockitoExtension.class)` + `MockMvcBuilders.standaloneSetup()` for controllers (no Spring context — fast). Integration tests (`*IT.java`) extend `BaseFullIntegrationTest` or `BaseMessagingIntegrationTest` (from Plan 1) and use `@SpringBootTest` + `@AutoConfigureMockMvc` with real Testcontainer databases. Every test file lives under `unit/` or `integration/` subfolder established in Plan 1.

**Prerequisite:** Plan 0 (deployment blockers) and Plan 1 (test infrastructure) must be complete.

**Tech Stack:** JUnit 5, Mockito, AssertJ, MockMvc, Spring Security Test, `@WebMvcTest`, `@DataMongoTest`, `@DataJpaTest`, Testcontainers 1.19.3

---

## File Map — New Files Created

### core-service unit tests (~120 new tests)
| File | Tests |
|------|-------|
| `unit/controller/AuthControllerTest.java` | login, register, logout, refresh, google, change-password, validate-pin — 200/400/401/403 |
| `unit/controller/UserControllerTest.java` | all 14 endpoints — happy path + 400/404 |
| `unit/controller/StoreControllerTest.java` | CRUD — 200/201/404 |
| `unit/controller/ShiftControllerTest.java` | all 10 endpoints |
| `unit/controller/WorkingSessionControllerTest.java` | all 9 endpoints |
| `unit/controller/CustomerControllerTest.java` | all 13 endpoints |
| `unit/controller/NotificationControllerTest.java` | all 5 endpoints |
| `unit/controller/ReviewControllerTest.java` | all 10 endpoints |
| `unit/controller/CampaignControllerTest.java` | all 8 endpoints |
| `unit/controller/EarningsControllerTest.java` | all 4 endpoints |
| `unit/controller/GdprControllerTest.java` | all 8 endpoints |
| `unit/service/AuthServiceTest.java` | login, register, logout, refresh, PIN validation |
| `unit/service/UserServiceTest.java` | CRUD, activate/deactivate, PIN generation |

### commerce-service unit tests (~40 new tests)
| File | Tests |
|------|-------|
| `unit/controller/OrderControllerTest.java` | all 12 endpoints — status transitions, quality checkpoints, analytics |
| `unit/controller/KitchenEquipmentControllerTest.java` | all 6 endpoints |
| `unit/controller/AggregatorControllerTest.java` | GET/PUT connections |
| `unit/controller/TipControllerTest.java` | POST tip |
| `unit/service/OrderServiceStatusTest.java` | all OrderStatus transitions via state machine |

### logistics-service unit tests (~80 new tests)
| File | Tests |
|------|-------|
| `unit/controller/DeliveryControllerTest.java` | all 17 endpoints |
| `unit/controller/InventoryControllerTest.java` | all 7 endpoints including stock operations |
| `unit/controller/PurchaseOrderControllerTest.java` | all 6 endpoints |
| `unit/controller/SupplierControllerTest.java` | all 6 endpoints |
| `unit/controller/WasteControllerTest.java` | all 6 endpoints |
| `unit/service/DeliveryServiceTest.java` | dispatch, accept, reject, OTP, zone validation |
| `unit/service/InventoryServiceTest.java` | CRUD, stock adjust/reserve/release/consume |

### intelligence-service unit tests (~25 new tests)
| File | Tests |
|------|-------|
| `unit/controller/AnalyticsControllerTest.java` | GET analytics (all type params), GET bi, GET bi/reports, POST cache/clear |
| `unit/service/AnalyticsServiceTest.java` | sales, AOV, drivers, trends, peak hours |
| `unit/service/BIEngineServiceTest.java` | forecasts, customer behavior, churn |

### Integration tests (*IT.java) — one per controller per service
All placed in `integration/controller/` subfolder.

---

### Task 1: core-service — AuthController Unit Tests

**Files:**
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/AuthControllerTest.java`

- [ ] **Step 1: Write the test file**

```java
package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.AuthController;
import com.MaSoVa.core.user.service.AuthService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest extends BaseServiceTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with tokens on valid credentials")
        void returns200OnValidCredentials() throws Exception {
            Map<String, Object> response = Map.of(
                "accessToken", "access.token.here",
                "refreshToken", "refresh.token.here",
                "user", Map.of("id", "user-1", "email", "test@masova.com")
            );
            when(authService.login(anyString(), anyString())).thenReturn(response);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"test@masova.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
        }

        @Test
        @DisplayName("returns 400 when body is missing email")
        void returns400WhenEmailMissing() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 401 when credentials are invalid")
        void returns401OnInvalidCredentials() throws Exception {
            when(authService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Invalid credentials"));

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"bad@masova.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test
        @DisplayName("returns 200 on successful logout")
        void returns200OnLogout() throws Exception {
            mockMvc.perform(post("/api/auth/logout")
                    .header("X-User-Id", "user-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("returns 200 with new access token")
        void returns200WithNewToken() throws Exception {
            Map<String, Object> response = Map.of("accessToken", "new.access.token");
            when(authService.refresh(anyString())).thenReturn(response);

            mockMvc.perform(post("/api/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"refreshToken\":\"valid.refresh.token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
        }

        @Test
        @DisplayName("returns 401 when refresh token is expired or blacklisted")
        void returns401OnExpiredToken() throws Exception {
            when(authService.refresh(anyString()))
                .thenThrow(new RuntimeException("Token expired"));

            mockMvc.perform(post("/api/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"refreshToken\":\"expired.token\"}"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("returns 201 on successful registration")
        void returns201OnRegistration() throws Exception {
            Map<String, Object> response = Map.of("id", "new-user-1", "email", "new@masova.com");
            when(authService.register(any())).thenReturn(response);

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"new@masova.com\",\"password\":\"pass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"))
                .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("returns 409 when email already exists")
        void returns409OnDuplicateEmail() throws Exception {
            when(authService.register(any()))
                .thenThrow(new RuntimeException("Email already in use"));

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"existing@masova.com\",\"password\":\"pass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"))
                .andExpect(status().isConflict());
        }
    }
}
```

- [ ] **Step 2: Run the test to verify it compiles and passes**

```bash
mvn test -pl core-service -Dtest="AuthControllerTest" --no-transfer-progress 2>&1 | tail -15
```

Expected: `Tests run: 6, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add core-service/src/test/java/com/MaSoVa/core/unit/controller/AuthControllerTest.java
git commit -m "test(core): AuthController unit tests — login, register, logout, refresh"
```

---

### Task 2: core-service — UserController Unit Tests

**Files:**
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/UserControllerTest.java`

- [ ] **Step 1: Write the test file**

```java
package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.UserController;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest extends BaseServiceTest {

    @Mock private UserService userService;
    @InjectMocks private UserController userController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Nested
    @DisplayName("GET /api/users")
    class GetUsers {

        @Test
        @DisplayName("returns 200 with list of users")
        void returns200WithUsers() throws Exception {
            when(userService.getUsers(any(), any(), any(), any()))
                .thenReturn(List.of(Map.of("id", "u1", "email", "staff@masova.com", "type", "STAFF")));

            mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("u1"));
        }

        @Test
        @DisplayName("returns 200 filtered by type=DRIVER")
        void returns200FilteredByType() throws Exception {
            when(userService.getUsers(any(), any(), any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/users").param("type", "DRIVER"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{userId}")
    class GetUserById {

        @Test
        @DisplayName("returns 200 when user exists")
        void returns200WhenExists() throws Exception {
            when(userService.getUserById("user-1"))
                .thenReturn(Optional.of(Map.of("id", "user-1", "email", "test@masova.com")));

            mockMvc.perform(get("/api/users/user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-1"));
        }

        @Test
        @DisplayName("returns 404 when user does not exist")
        void returns404WhenNotFound() throws Exception {
            when(userService.getUserById("bad-id")).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/users/bad-id"))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/activate")
    class ActivateUser {

        @Test
        @DisplayName("returns 200 on successful activation")
        void returns200OnActivation() throws Exception {
            when(userService.activateUser("user-1"))
                .thenReturn(Map.of("id", "user-1", "active", true));

            mockMvc.perform(post("/api/users/user-1/activate"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/users/{userId}/generate-pin")
    class GeneratePin {

        @Test
        @DisplayName("returns 200 with generated PIN")
        void returns200WithPin() throws Exception {
            when(userService.generatePin("user-1", false))
                .thenReturn(Map.of("pin", "1234"));

            mockMvc.perform(post("/api/users/user-1/generate-pin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pin").exists());
        }
    }
}
```

- [ ] **Step 2: Run the tests**

```bash
mvn test -pl core-service -Dtest="UserControllerTest" --no-transfer-progress 2>&1 | tail -10
```

Expected: `Tests run: 5, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add core-service/src/test/java/com/MaSoVa/core/unit/controller/UserControllerTest.java
git commit -m "test(core): UserController unit tests — list, get by id, activate, generate-pin"
```

---

### Task 3: core-service — Remaining Controller Unit Tests

**Files:**
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/StoreControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/ShiftControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/WorkingSessionControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/CustomerControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/NotificationControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/ReviewControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/CampaignControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/EarningsControllerTest.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/unit/controller/GdprControllerTest.java`

- [ ] **Step 1: Write StoreControllerTest.java**

```java
package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.StoreController;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreController Unit Tests")
class StoreControllerTest extends BaseServiceTest {

    @Mock private StoreService storeService;
    @InjectMocks private StoreController storeController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(storeController).build();
    }

    @Test
    @DisplayName("GET /api/stores returns 200 with store list")
    void getStores_returns200() throws Exception {
        Store store = new Store();
        store.setId("store-1");
        store.setName("MaSoVa Mumbai");
        when(storeService.getAllStores(any())).thenReturn(List.of(store));

        mockMvc.perform(get("/api/stores"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("store-1"));
    }

    @Test
    @DisplayName("GET /api/stores/{storeId} returns 200 for existing store")
    void getStore_returns200() throws Exception {
        Store store = new Store();
        store.setId("store-1");
        store.setName("MaSoVa Mumbai");
        when(storeService.getStoreById("store-1")).thenReturn(Optional.of(store));

        mockMvc.perform(get("/api/stores/store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("MaSoVa Mumbai"));
    }

    @Test
    @DisplayName("GET /api/stores/{storeId} returns 404 for missing store")
    void getStore_returns404() throws Exception {
        when(storeService.getStoreById("bad-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/stores/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/stores returns 201 with created store")
    void createStore_returns201() throws Exception {
        Store store = new Store();
        store.setId("store-new");
        store.setName("New Branch");
        when(storeService.saveStore(any())).thenReturn(store);

        mockMvc.perform(post("/api/stores")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"New Branch\",\"code\":\"NB01\"}"))
            .andExpect(status().isCreated());
    }
}
```

- [ ] **Step 2: Write ShiftControllerTest.java**

```java
package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.ShiftController;
import com.MaSoVa.core.user.service.ShiftService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShiftController Unit Tests")
class ShiftControllerTest extends BaseServiceTest {

    @Mock private ShiftService shiftService;
    @InjectMocks private ShiftController shiftController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(shiftController).build();
    }

    @Test
    @DisplayName("GET /api/shifts returns 200")
    void getShifts_returns200() throws Exception {
        when(shiftService.getShifts(any(), any(), any(), any(), any()))
            .thenReturn(List.of(Map.of("id", "shift-1", "employeeId", "emp-1")));

        mockMvc.perform(get("/api/shifts").param("storeId", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("shift-1"));
    }

    @Test
    @DisplayName("POST /api/shifts returns 201")
    void createShift_returns201() throws Exception {
        when(shiftService.createShift(any()))
            .thenReturn(Map.of("id", "shift-new", "employeeId", "emp-1"));

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"employeeId\":\"emp-1\",\"storeId\":\"store-1\",\"startTime\":\"2026-05-15T09:00:00\",\"endTime\":\"2026-05-15T17:00:00\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/shifts/{shiftId}/confirm returns 200")
    void confirmShift_returns200() throws Exception {
        when(shiftService.confirmShift("shift-1"))
            .thenReturn(Map.of("id", "shift-1", "status", "CONFIRMED"));

        mockMvc.perform(post("/api/shifts/shift-1/confirm"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/shifts/{shiftId} returns 204")
    void deleteShift_returns204() throws Exception {
        mockMvc.perform(delete("/api/shifts/shift-1"))
            .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 3: Write CustomerControllerTest.java (abbreviated — follow same pattern)**

```java
package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.customer.controller.CustomerController;
import com.MaSoVa.core.customer.service.CustomerService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerController Unit Tests")
class CustomerControllerTest extends BaseServiceTest {

    @Mock private CustomerService customerService;
    @InjectMocks private CustomerController customerController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController).build();
    }

    @Test
    @DisplayName("GET /api/customers returns 200 with list")
    void getCustomers_returns200() throws Exception {
        when(customerService.getCustomers(any())).thenReturn(List.of(
            Map.of("id", "cust-1", "email", "customer@test.com")
        ));
        mockMvc.perform(get("/api/customers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("cust-1"));
    }

    @Test
    @DisplayName("GET /api/customers/{id} returns 404 when not found")
    void getCustomer_returns404() throws Exception {
        when(customerService.getCustomerById("bad-id")).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/customers/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/loyalty returns 200")
    void addLoyaltyPoints_returns200() throws Exception {
        when(customerService.updateLoyalty(anyString(), any()))
            .thenReturn(Map.of("id", "cust-1", "loyaltyPoints", 150));
        mockMvc.perform(post("/api/customers/cust-1/loyalty")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"EARNED\",\"points\":50}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/addresses returns 201")
    void addAddress_returns201() throws Exception {
        when(customerService.addAddress(anyString(), any()))
            .thenReturn(Map.of("id", "addr-1", "street", "123 Main St"));
        mockMvc.perform(post("/api/customers/cust-1/addresses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"street\":\"123 Main St\",\"city\":\"Mumbai\",\"pincode\":\"400001\"}"))
            .andExpect(status().isCreated());
    }
}
```

- [ ] **Step 4: Write remaining controller test stubs (NotificationControllerTest, ReviewControllerTest, CampaignControllerTest, EarningsControllerTest, GdprControllerTest, WorkingSessionControllerTest)**

Each follows the exact same pattern as above. For each controller:
1. `@Mock` the primary service
2. `@InjectMocks` the controller
3. `MockMvcBuilders.standaloneSetup(controller)`
4. Test: GET list → 200, GET by id → 200 and 404, POST → 201, DELETE → 204, action endpoints → 200

For **NotificationControllerTest** (`/api/notifications`):
- Test `GET /api/notifications` → 200 list
- Test `POST /api/notifications` → 201
- Test `PATCH /api/notifications/{id}/read` → 200
- Test `PATCH /api/notifications/read-all` → 200
- Test `DELETE /api/notifications/{id}` → 204

For **ReviewControllerTest** (`/api/reviews`):
- Test `GET /api/reviews` → 200 list
- Test `GET /api/reviews/public/token/{token}` → 200
- Test `POST /api/reviews/public/submit` → 201
- Test `GET /api/reviews/{id}` → 200 and 404
- Test `POST /api/reviews/{id}/response` → 200

For **CampaignControllerTest** (`/api/campaigns`):
- Test `POST /api/campaigns` → 201
- Test `GET /api/campaigns` → 200 list
- Test `POST /api/campaigns/{id}/execute` → 200
- Test `POST /api/campaigns/{id}/cancel` → 200

For **EarningsControllerTest** (`/api/staff/earnings`):
- Test `GET /api/staff/earnings/weekly?employeeId=emp-1` → 200
- Test `GET /api/staff/earnings/history?employeeId=emp-1` → 200
- Test `GET /api/staff/pay-rates?employeeId=emp-1` → 200

For **GdprControllerTest** (`/api/gdpr`):
- Test `GET /api/gdpr/consent?userId=u1` → 200
- Test `POST /api/gdpr/consent` → 201
- Test `POST /api/gdpr/request` → 201
- Test `GET /api/gdpr/export/{userId}` → 200

For **WorkingSessionControllerTest** (`/api/sessions`):
- Test `POST /api/sessions` → 201
- Test `POST /api/sessions/end` → 200
- Test `GET /api/sessions` → 200 list
- Test `GET /api/sessions/pending` → 200 list
- Test `POST /api/sessions/{sessionId}/approve` → 200

- [ ] **Step 5: Run all core-service unit tests**

```bash
mvn test -pl core-service --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS` — all tests pass.

- [ ] **Step 6: Commit**

```bash
git add core-service/src/test/
git commit -m "test(core): unit tests for all 11 controllers — auth, users, stores, shifts, sessions, customers, notifications, reviews, campaigns, earnings, gdpr"
```

---

### Task 4: commerce-service — OrderController + KitchenEquipment Unit Tests

**Files:**
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/unit/controller/OrderControllerTest.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/unit/controller/KitchenEquipmentControllerTest.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/unit/controller/AggregatorControllerTest.java`

- [ ] **Step 1: Write OrderControllerTest.java**

```java
package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.entity.Order;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderController Unit Tests")
class OrderControllerTest extends BaseServiceTest {

    @Mock private OrderService orderService;
    @InjectMocks private OrderController orderController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build();
    }

    private Order buildOrder(String id, Order.OrderStatus status) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-001");
        o.setStoreId("store-1");
        o.setStatus(status);
        o.setOrderType(Order.OrderType.TAKEAWAY);
        o.setSubtotal(new BigDecimal("200.00"));
        o.setTax(new BigDecimal("10.00"));
        o.setTotal(new BigDecimal("210.00"));
        return o;
    }

    @Nested
    @DisplayName("POST /api/orders")
    class CreateOrder {

        @Test
        @DisplayName("returns 201 with created order")
        void returns201OnCreate() throws Exception {
            Order created = buildOrder("order-1", Order.OrderStatus.RECEIVED);
            when(orderService.createOrder(any())).thenReturn(created);

            mockMvc.perform(post("/api/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"storeId\":\"store-1\",\"orderType\":\"TAKEAWAY\",\"customerName\":\"Test\",\"items\":[{\"menuItemId\":\"item-1\",\"name\":\"Pizza\",\"quantity\":1,\"price\":200.0}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("order-1"))
                .andExpect(jsonPath("$.status").value("RECEIVED"));
        }
    }

    @Nested
    @DisplayName("GET /api/orders/{orderId}")
    class GetOrder {

        @Test
        @DisplayName("returns 200 for existing order")
        void returns200() throws Exception {
            when(orderService.getOrderById("order-1"))
                .thenReturn(Optional.of(buildOrder("order-1", Order.OrderStatus.RECEIVED)));

            mockMvc.perform(get("/api/orders/order-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("order-1"));
        }

        @Test
        @DisplayName("returns 404 for missing order")
        void returns404() throws Exception {
            when(orderService.getOrderById("bad-id")).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/orders/bad-id"))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/orders/track/{orderId}")
    class TrackOrder {

        @Test
        @DisplayName("returns 200 for public order tracking (no auth)")
        void returns200Public() throws Exception {
            when(orderService.getOrderById("order-1"))
                .thenReturn(Optional.of(buildOrder("order-1", Order.OrderStatus.DISPATCHED)));

            mockMvc.perform(get("/api/orders/track/order-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/orders/{orderId}/status")
    class UpdateStatus {

        @Test
        @DisplayName("returns 200 on valid status transition RECEIVED → PREPARING")
        void returns200OnValidTransition() throws Exception {
            Order updated = buildOrder("order-1", Order.OrderStatus.PREPARING);
            when(orderService.updateOrderStatus(anyString(), any())).thenReturn(updated);

            mockMvc.perform(post("/api/orders/order-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/orders/{orderId}")
    class CancelOrder {

        @Test
        @DisplayName("returns 204 on cancellation")
        void returns204() throws Exception {
            mockMvc.perform(delete("/api/orders/order-1")
                    .param("reason", "Customer request"))
                .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("POST /api/orders/{orderId}/quality-checkpoint")
    class QualityCheckpoint {

        @Test
        @DisplayName("returns 200 on adding checkpoint")
        void returns200() throws Exception {
            Order updated = buildOrder("order-1", Order.OrderStatus.PREPARING);
            when(orderService.addQualityCheckpoint(anyString(), any())).thenReturn(updated);

            mockMvc.perform(post("/api/orders/order-1/quality-checkpoint")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"checkpointName\":\"temperature-check\",\"status\":\"PASSED\"}"))
                .andExpect(status().isOk());
        }
    }
}
```

- [ ] **Step 2: Write KitchenEquipmentControllerTest.java**

```java
package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.KitchenEquipmentController;
import com.MaSoVa.commerce.order.service.KitchenEquipmentService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("KitchenEquipmentController Unit Tests")
class KitchenEquipmentControllerTest extends BaseServiceTest {

    @Mock private KitchenEquipmentService equipmentService;
    @InjectMocks private KitchenEquipmentController controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/equipment returns 200 with list")
    void getEquipment_returns200() throws Exception {
        when(equipmentService.getAllEquipment(any()))
            .thenReturn(List.of(Map.of("id", "eq-1", "name", "Oven 1")));
        mockMvc.perform(get("/api/equipment"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("eq-1"));
    }

    @Test
    @DisplayName("POST /api/equipment returns 201")
    void createEquipment_returns201() throws Exception {
        when(equipmentService.createEquipment(any()))
            .thenReturn(Map.of("id", "eq-new", "name", "Fryer 1"));
        mockMvc.perform(post("/api/equipment")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Fryer 1\",\"type\":\"FRYER\",\"storeId\":\"store-1\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/equipment/{id}/maintenance returns 200")
    void recordMaintenance_returns200() throws Exception {
        when(equipmentService.recordMaintenance(anyString(), any()))
            .thenReturn(Map.of("id", "eq-1", "lastMaintenanceDate", "2026-05-15"));
        mockMvc.perform(post("/api/equipment/eq-1/maintenance")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nextMaintenanceDate\":\"2026-08-15\",\"notes\":\"Routine check\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/equipment/{id} returns 204")
    void deleteEquipment_returns204() throws Exception {
        mockMvc.perform(delete("/api/equipment/eq-1"))
            .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 3: Run all commerce-service unit tests**

```bash
mvn test -pl commerce-service --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add commerce-service/src/test/
git commit -m "test(commerce): unit tests for OrderController, KitchenEquipmentController, AggregatorController"
```

---

### Task 5: logistics-service — All Controller Unit Tests

**Files:**
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/controller/DeliveryControllerTest.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/controller/InventoryControllerTest.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/controller/PurchaseOrderControllerTest.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/controller/SupplierControllerTest.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/controller/WasteControllerTest.java`

- [ ] **Step 1: Write DeliveryControllerTest.java**

```java
package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.delivery.controller.DeliveryController;
import com.MaSoVa.logistics.delivery.service.DeliveryService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeliveryController Unit Tests")
class DeliveryControllerTest extends BaseServiceTest {

    @Mock private DeliveryService deliveryService;
    @InjectMocks private DeliveryController deliveryController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(deliveryController).build();
    }

    @Nested
    @DisplayName("POST /api/delivery/dispatch")
    class Dispatch {
        @Test
        @DisplayName("returns 200 on successful dispatch")
        void returns200() throws Exception {
            when(deliveryService.dispatchDriver(any()))
                .thenReturn(Map.of("trackingId", "track-1", "driverId", "driver-1"));
            mockMvc.perform(post("/api/delivery/dispatch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"storeId\":\"store-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingId").value("track-1"));
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/accept")
    class Accept {
        @Test
        @DisplayName("returns 200 when driver accepts")
        void returns200() throws Exception {
            when(deliveryService.acceptDelivery(any()))
                .thenReturn(Map.of("trackingId", "track-1", "status", "ACCEPTED"));
            mockMvc.perform(post("/api/delivery/accept")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"trackingId\":\"track-1\",\"driverId\":\"driver-1\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/reject")
    class Reject {
        @Test
        @DisplayName("returns 200 when driver rejects and triggers reassignment")
        void returns200() throws Exception {
            when(deliveryService.rejectDelivery(any()))
                .thenReturn(Map.of("trackingId", "track-1", "status", "REASSIGNING"));
            mockMvc.perform(post("/api/delivery/reject")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"trackingId\":\"track-1\",\"driverId\":\"driver-1\",\"reason\":\"Too far\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/track/{orderId}")
    class Track {
        @Test
        @DisplayName("returns 200 for public tracking (no auth)")
        void returns200() throws Exception {
            when(deliveryService.getTrackingInfo("order-1"))
                .thenReturn(Map.of("orderId", "order-1", "status", "IN_TRANSIT"));
            mockMvc.perform(get("/api/delivery/track/order-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/{orderId}/otp")
    class GenerateOtp {
        @Test
        @DisplayName("returns 200 with OTP")
        void returns200() throws Exception {
            when(deliveryService.generateOtp("order-1"))
                .thenReturn(Map.of("otp", "1234", "orderId", "order-1"));
            mockMvc.perform(post("/api/delivery/order-1/otp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otp").value("1234"));
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/zones")
    class Zones {
        @Test
        @DisplayName("returns 200 with zone information")
        void returns200() throws Exception {
            when(deliveryService.getDeliveryZones(any()))
                .thenReturn(List.of(Map.of("zone", "ZONE_A", "feeINR", 29)));
            mockMvc.perform(get("/api/delivery/zones").param("storeId", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].zone").value("ZONE_A"));
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/drivers/available")
    class AvailableDrivers {
        @Test
        @DisplayName("returns 200 with available driver list")
        void returns200() throws Exception {
            when(deliveryService.getAvailableDrivers(anyString()))
                .thenReturn(List.of(Map.of("id", "driver-1", "status", "AVAILABLE")));
            mockMvc.perform(get("/api/delivery/drivers/available").param("storeId", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"));
        }
    }
}
```

- [ ] **Step 2: Write InventoryControllerTest.java**

```java
package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.InventoryController;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryController Unit Tests")
class InventoryControllerTest extends BaseServiceTest {

    @Mock private InventoryService inventoryService;
    @InjectMocks private InventoryController inventoryController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController).build();
    }

    @Test
    @DisplayName("GET /api/inventory returns 200 with list")
    void getInventory_returns200() throws Exception {
        when(inventoryService.getInventoryItems(any()))
            .thenReturn(List.of(Map.of("id", "item-1", "name", "Flour", "quantity", 50)));
        mockMvc.perform(get("/api/inventory").param("storeId", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Flour"));
    }

    @Test
    @DisplayName("GET /api/inventory/{id} returns 404 when not found")
    void getItem_returns404() throws Exception {
        when(inventoryService.getItemById("bad-id")).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/inventory/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/inventory/{id}/stock returns 200 on ADJUST operation")
    void adjustStock_returns200() throws Exception {
        when(inventoryService.performStockOperation(anyString(), any()))
            .thenReturn(Map.of("id", "item-1", "quantity", 60));
        mockMvc.perform(post("/api/inventory/item-1/stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"operation\":\"ADJUST\",\"quantity\":10,\"reason\":\"Restock\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.quantity").value(60));
    }

    @Test
    @DisplayName("GET /api/inventory/value returns 200 with total value")
    void getInventoryValue_returns200() throws Exception {
        when(inventoryService.getTotalValue(any()))
            .thenReturn(Map.of("totalValueINR", 15000));
        mockMvc.perform(get("/api/inventory/value").param("storeId", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalValueINR").value(15000));
    }
}
```

- [ ] **Step 3: Write PurchaseOrderControllerTest, SupplierControllerTest, WasteControllerTest**

Each follows the same pattern — mock the service, standaloneSetup, test CRUD + action endpoints. Key scenarios per controller:

**PurchaseOrderControllerTest:**
- `GET /api/purchase-orders` → 200 list
- `POST /api/purchase-orders` → 201
- `GET /api/purchase-orders/{id}` → 200 and 404
- `PATCH /api/purchase-orders/{id}` with `action=APPROVE` → 200
- `POST /api/purchase-orders/auto-generate` → 200

**SupplierControllerTest:**
- `GET /api/suppliers` → 200 list
- `POST /api/suppliers` → 201
- `GET /api/suppliers/{id}` → 200 and 404
- `GET /api/suppliers/compare?category=PRODUCE` → 200
- `DELETE /api/suppliers/{id}` → 204

**WasteControllerTest:**
- `GET /api/waste` → 200 list
- `POST /api/waste` → 201
- `GET /api/waste/{id}` → 200 and 404
- `GET /api/waste/analytics?type=total-cost` → 200

- [ ] **Step 4: Run all logistics-service unit tests**

```bash
mvn test -pl logistics-service --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add logistics-service/src/test/
git commit -m "test(logistics): unit tests for DeliveryController, InventoryController, PurchaseOrderController, SupplierController, WasteController"
```

---

### Task 6: intelligence-service — AnalyticsController Unit Tests

**Files:**
- Create: `intelligence-service/src/test/java/com/MaSoVa/intelligence/unit/controller/AnalyticsControllerTest.java`

- [ ] **Step 1: Write the test file**

```java
package com.MaSoVa.intelligence.unit.controller;

import com.MaSoVa.intelligence.controller.AnalyticsController;
import com.MaSoVa.intelligence.service.AnalyticsService;
import com.MaSoVa.intelligence.service.BIEngineService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsController Unit Tests")
class AnalyticsControllerTest extends BaseServiceTest {

    @Mock private AnalyticsService analyticsService;
    @Mock private BIEngineService biEngineService;
    @InjectMocks private AnalyticsController analyticsController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController).build();
    }

    @Nested
    @DisplayName("GET /api/analytics")
    class Analytics {

        @Test
        @DisplayName("returns 200 with sales data for type=sales")
        void returns200ForSalesType() throws Exception {
            when(analyticsService.getAnalytics(any(), any()))
                .thenReturn(Map.of("totalSales", 50000, "orderCount", 120));
            mockMvc.perform(get("/api/analytics")
                    .param("type", "sales")
                    .param("storeId", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSales").value(50000));
        }

        @Test
        @DisplayName("returns 200 with AOV data for type=aov")
        void returns200ForAovType() throws Exception {
            when(analyticsService.getAnalytics(any(), any()))
                .thenReturn(Map.of("averageOrderValue", 415.0));
            mockMvc.perform(get("/api/analytics")
                    .param("type", "aov")
                    .param("storeId", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for unknown type parameter")
        void returns400ForUnknownType() throws Exception {
            mockMvc.perform(get("/api/analytics")
                    .param("type", "invalid-type"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/bi")
    class BI {

        @Test
        @DisplayName("returns 200 with sales forecast for type=sales-forecast")
        void returns200ForSalesForecast() throws Exception {
            when(biEngineService.getBI(any(), any()))
                .thenReturn(Map.of("forecast", Map.of("nextWeek", 60000)));
            mockMvc.perform(get("/api/bi")
                    .param("type", "sales-forecast")
                    .param("storeId", "store-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/bi/reports")
    class BIReports {

        @Test
        @DisplayName("returns 200 for type=executive-summary")
        void returns200ForExecutiveSummary() throws Exception {
            when(biEngineService.getReport(any(), any()))
                .thenReturn(Map.of("summary", "All metrics nominal"));
            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "executive-summary")
                    .param("storeId", "store-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/analytics/cache/clear")
    class ClearCache {

        @Test
        @DisplayName("returns 200 on cache clear")
        void returns200() throws Exception {
            mockMvc.perform(post("/api/analytics/cache/clear"))
                .andExpect(status().isOk());
        }
    }
}
```

- [ ] **Step 2: Run intelligence-service unit tests**

```bash
mvn test -pl intelligence-service --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add intelligence-service/src/test/
git commit -m "test(intelligence): unit tests for AnalyticsController — analytics, bi, bi/reports, cache/clear"
```

---

### Task 7: Integration Tests — core-service Controllers

**Context:** Integration tests use `@SpringBootTest` + `@AutoConfigureMockMvc` + Testcontainers (via `BaseFullIntegrationTest`). They test the full request → controller → service → repository → response chain with a real database. These are `*IT.java` files and run with `mvn verify`, not `mvn test`.

**Files:**
- Create: `core-service/src/test/java/com/MaSoVa/core/integration/controller/AuthControllerIT.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/integration/controller/UserControllerIT.java`

- [ ] **Step 1: Write AuthControllerIT.java**

```java
package com.MaSoVa.core.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AuthController Integration Tests")
class AuthControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/auth/register then POST /api/auth/login returns valid token")
    void registerThenLogin_returnsValidToken() throws Exception {
        // Register
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"integration@masova.com\",\"password\":\"Test1234!\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phone\":\"+919876543210\"}"))
            .andExpect(status().isCreated());

        // Login
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"integration@masova.com\",\"password\":\"Test1234!\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/login with wrong password returns 401")
    void loginWithWrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"notexist@masova.com\",\"password\":\"wrongpass\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/register with duplicate email returns 409")
    void registerDuplicateEmail_returns409() throws Exception {
        String body = "{\"email\":\"dup@masova.com\",\"password\":\"Test1234!\",\"firstName\":\"Dup\",\"lastName\":\"User\",\"phone\":\"+919876543211\"}";

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }
}
```

- [ ] **Step 2: Write UserControllerIT.java**

```java
package com.MaSoVa.core.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("UserController Integration Tests")
class UserControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/users returns 200 with empty list when no users")
    void getUsers_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/users/{userId} returns 404 for non-existent user")
    void getUser_returns404() throws Exception {
        mockMvc.perform(get("/api/users/nonexistent-id")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 3: Run integration tests (requires Docker)**

```bash
mvn verify -pl core-service -Dtest=NONE -Dit.test="AuthControllerIT,UserControllerIT" --no-transfer-progress 2>&1 | tail -15
```

Expected: `BUILD SUCCESS` — Testcontainers starts MongoDB + PostgreSQL + Redis, tests run and pass.

- [ ] **Step 4: Commit**

```bash
git add core-service/src/test/java/com/MaSoVa/core/integration/
git commit -m "test(core): integration tests for AuthController and UserController with Testcontainers"
```

---

### Task 8: Integration Tests — commerce, logistics, payment, intelligence

**Context:** One `*ControllerIT.java` per service in the `integration/controller/` folder. Each extends `BaseFullIntegrationTest` (or `BaseMessagingIntegrationTest` for services with RabbitMQ). Pattern is identical to Task 7.

**Files:**
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/integration/controller/MenuControllerIT.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/integration/controller/OrderControllerIT.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/integration/controller/InventoryControllerIT.java`
- Create: `logistics-service/src/test/java/com/MaSoVa/logistics/integration/controller/DeliveryControllerIT.java`
- Create: `payment-service/src/test/java/com/MaSoVa/payment/integration/controller/PaymentControllerIT.java`
- Create: `intelligence-service/src/test/java/com/MaSoVa/intelligence/integration/controller/AnalyticsControllerIT.java`

- [ ] **Step 1: Write MenuControllerIT.java**

```java
package com.MaSoVa.commerce.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("MenuController Integration Tests")
class MenuControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/menu creates item then GET retrieves it")
    void createThenRetrieve() throws Exception {
        String createBody = "{\"name\":\"Margherita\",\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":29900,\"storeId\":\"store-1\"}";

        String response = mockMvc.perform(post("/api/menu")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Type", "MANAGER")
                .content(createBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        // Extract id from response for GET
        String id = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(response).get("id").asText();

        mockMvc.perform(get("/api/menu/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Margherita"));
    }

    @Test
    @DisplayName("GET /api/menu returns 200 with empty list initially")
    void getMenu_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/menu"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/menu/{id} returns 404 for non-existent item")
    void getMenuItem_returns404() throws Exception {
        mockMvc.perform(get("/api/menu/nonexistent"))
            .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: Write PaymentControllerIT.java**

```java
package com.MaSoVa.payment.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("PaymentController Integration Tests")
class PaymentControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/payments returns 200 with empty list")
    void getPayments_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/payments/{transactionId} returns 404 for non-existent transaction")
    void getTransaction_returns404() throws Exception {
        mockMvc.perform(get("/api/payments/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 200 with empty list")
    void getRefunds_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments/refund")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk());
    }
}
```

- [ ] **Step 3: Write remaining IT files (OrderControllerIT, InventoryControllerIT, DeliveryControllerIT, AnalyticsControllerIT)**

Each follows the same pattern:
- Extend `BaseFullIntegrationTest` (or `BaseMessagingIntegrationTest` for commerce/logistics which use RabbitMQ)
- Test: GET empty list → 200, GET nonexistent → 404, POST valid → 201 + GET back → 200

- [ ] **Step 4: Run all integration tests across all services (requires Docker)**

```bash
mvn verify -Dtest=NONE --no-transfer-progress 2>&1 | tail -20
```

Expected: `BUILD SUCCESS` — all `*IT.java` tests pass.

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/test/java/com/MaSoVa/commerce/integration/ \
        logistics-service/src/test/java/com/MaSoVa/logistics/integration/ \
        payment-service/src/test/java/com/MaSoVa/payment/integration/ \
        intelligence-service/src/test/java/com/MaSoVa/intelligence/integration/
git commit -m "test(all): integration tests for Menu, Order, Payment, Inventory, Delivery, Analytics controllers"
```

---

## Verification Checklist

- [ ] `mvn test` passes all `*Test.java` across 6 services — no Docker, < 5 min
- [ ] `mvn verify` passes all `*IT.java` across 6 services — Docker required, < 20 min
- [ ] `grep -r "api/v1/" */src/test/` returns nothing (no stale paths)
- [ ] Coverage report in `target/site/jacoco/index.html` shows ≥ 80% line coverage per service
