package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.user.dto.LoginRequest;
import com.MaSoVa.core.user.dto.LoginResponse;
import com.MaSoVa.core.user.dto.UserCreateRequest;
import com.MaSoVa.core.user.dto.UserResponse;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.core.user.repository.UserJpaRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import com.MaSoVa.core.user.service.JwtService;
import com.MaSoVa.core.user.service.UserService;
import com.MaSoVa.core.user.service.WorkingSessionService;
import com.MaSoVa.shared.enums.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserJpaRepository userJpaRepository;
    @Mock private WorkingSessionRepository sessionRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private WorkingSessionService sessionService;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private UserService userService;

    private User buildUser(String id, String email, UserType type) {
        User user = new User();
        user.setId(id);
        User.PersonalInfo info = new User.PersonalInfo();
        info.setEmail(email);
        info.setName("Test User");
        info.setPhone("9876543210");
        info.setPasswordHash("hashed_password");
        user.setPersonalInfo(info);
        user.setType(type);
        user.setActive(true);
        return user;
    }

    private User buildEmployee(String id, String email, String storeId) {
        User user = buildUser(id, email, UserType.STAFF);
        User.EmployeeDetails details = new User.EmployeeDetails();
        details.setStoreId(storeId);
        details.setRole("CASHIER");
        user.setEmployeeDetails(details);
        return user;
    }

    private UserCreateRequest buildCreateRequest(String email, String phone, UserType type, String storeId) {
        UserCreateRequest req = new UserCreateRequest();
        req.setName("Test User");
        req.setEmail(email);
        req.setPhone(phone);
        req.setPassword("password123");
        req.setType(type);
        req.setStoreId(storeId);
        return req;
    }

    // ===========================
    // getUserById
    // ===========================

    @Nested
    @DisplayName("getUserById")
    class GetUserById {

        @Test
        @DisplayName("returns user when found")
        void returnsUser() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            assertThat(userService.getUserById("u1").getId()).isEqualTo("u1");
        }

        @Test
        @DisplayName("throws RuntimeException when not found")
        void throwsWhenNotFound() {
            when(userRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> userService.getUserById("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }
    }

    // ===========================
    // authenticate
    // ===========================

    @Nested
    @DisplayName("authenticate")
    class Authenticate {

        @Test
        @DisplayName("returns LoginResponse on valid credentials")
        void successfulLogin() {
            User user = buildUser("u1", "test@masova.com", UserType.CUSTOMER);
            when(userRepository.findByPersonalInfoEmail("test@masova.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true);
            when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
            when(userRepository.save(any())).thenReturn(user);
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            LoginRequest req = new LoginRequest();
            req.setEmail("test@masova.com");
            req.setPassword("password123");

            LoginResponse response = userService.authenticate(req);

            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        }

        @Test
        @DisplayName("throws when user not found")
        void throwsWhenUserNotFound() {
            when(userRepository.findByPersonalInfoEmail("missing@masova.com")).thenReturn(Optional.empty());

            LoginRequest req = new LoginRequest();
            req.setEmail("missing@masova.com");
            req.setPassword("password");

            assertThatThrownBy(() -> userService.authenticate(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("throws when password does not match")
        void throwsOnWrongPassword() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            when(userRepository.findByPersonalInfoEmail("test@masova.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "hashed_password")).thenReturn(false);

            LoginRequest req = new LoginRequest();
            req.setEmail("test@masova.com");
            req.setPassword("wrong");

            assertThatThrownBy(() -> userService.authenticate(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("throws when account is deactivated")
        void throwsWhenDeactivated() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            user.setActive(false);
            when(userRepository.findByPersonalInfoEmail("test@masova.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true);

            LoginRequest req = new LoginRequest();
            req.setEmail("test@masova.com");
            req.setPassword("password123");

            assertThatThrownBy(() -> userService.authenticate(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("deactivated");
        }

        @Test
        @DisplayName("includes storeId in access token for employees")
        void includesStoreIdForEmployee() {
            User user = buildEmployee("u1", "staff@masova.com", "store-42");
            when(userRepository.findByPersonalInfoEmail("staff@masova.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password", "hashed_password")).thenReturn(true);
            when(userRepository.save(any())).thenReturn(user);
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            LoginRequest req = new LoginRequest();
            req.setEmail("staff@masova.com");
            req.setPassword("password");

            userService.authenticate(req);

            verify(jwtService).generateAccessToken("u1", "STAFF", "store-42");
        }
    }

    // ===========================
    // createUser
    // ===========================

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("throws when email already exists")
        void throwsOnDuplicateEmail() {
            when(userRepository.existsByPersonalInfoEmail("dup@masova.com")).thenReturn(true);
            UserCreateRequest req = buildCreateRequest("dup@masova.com", "9999999999", UserType.STAFF, "store-1");

            assertThatThrownBy(() -> userService.createUser(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("throws when phone already exists")
        void throwsOnDuplicatePhone() {
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone("9999999999")).thenReturn(true);
            UserCreateRequest req = buildCreateRequest("new@masova.com", "9999999999", UserType.STAFF, "store-1");

            assertThatThrownBy(() -> userService.createUser(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Phone number already exists");
        }

        @Test
        @DisplayName("throws when employee has no storeId")
        void throwsWhenEmployeeHasNoStore() {
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);
            UserCreateRequest req = buildCreateRequest("new@masova.com", "9999999999", UserType.STAFF, null);

            assertThatThrownBy(() -> userService.createUser(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Store ID required");
        }

        @Test
        @DisplayName("creates employee and returns response with details")
        void createsEmployee() {
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            User saved = buildEmployee("u1", "new@masova.com", "store-1");
            when(userRepository.save(any())).thenReturn(saved);
            when(userRepository.findById("u1")).thenReturn(Optional.of(saved));
            when(userJpaRepository.save(any())).thenReturn(null);
            when(userRepository.existsByStoreIdAndEmployeeDetailsPINHash(any(), any())).thenReturn(false);

            UserCreateRequest req = buildCreateRequest("new@masova.com", "9876543210", UserType.STAFF, "store-1");
            UserResponse response = userService.createUser(req);

            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("creates CUSTOMER without requiring storeId")
        void createsCustomerWithoutStore() {
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            User saved = buildUser("u2", "customer@masova.com", UserType.CUSTOMER);
            when(userRepository.save(any())).thenReturn(saved);
            when(userJpaRepository.save(any())).thenReturn(null);

            UserCreateRequest req = buildCreateRequest("customer@masova.com", "9876543210", UserType.CUSTOMER, null);
            UserResponse response = userService.createUser(req);

            assertThat(response).isNotNull();
        }
    }

    // ===========================
    // activateUser / deactivateUser
    // ===========================

    @Nested
    @DisplayName("activateUser")
    class ActivateUser {

        @Test
        @DisplayName("saves user with active=true")
        void setsActiveTrue() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            user.setActive(false);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId("u1")).thenReturn(Optional.empty());

            userService.activateUser("u1");

            verify(userRepository).save(argThat(u -> u.isActive()));
        }
    }

    @Nested
    @DisplayName("deactivateUser")
    class DeactivateUser {

        @Test
        @DisplayName("saves user with active=false")
        void setsActiveFalse() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            user.setActive(true);
            User.EmployeeDetails details = new User.EmployeeDetails();
            user.setEmployeeDetails(details);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId("u1")).thenReturn(Optional.empty());

            userService.deactivateUser("u1");

            verify(userRepository).save(argThat(u -> !u.isActive()));
        }

        @Test
        @DisplayName("ends working session for employees on deactivation")
        void endsSessionForEmployee() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId("u1")).thenReturn(Optional.empty());

            userService.deactivateUser("u1");

            verify(sessionService).endSession("u1");
        }

        @Test
        @DisplayName("does not throw if endSession fails during deactivation")
        void toleratesSessionEndFailure() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId("u1")).thenReturn(Optional.empty());
            doThrow(new RuntimeException("no session")).when(sessionService).endSession("u1");

            assertThatCode(() -> userService.deactivateUser("u1")).doesNotThrowAnyException();
        }
    }

    // ===========================
    // getAllUsers
    // ===========================

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsers {

        @Test
        @DisplayName("returns mapped list from repository")
        void returnsList() {
            when(userRepository.findAllActiveEmployees())
                    .thenReturn(List.of(buildUser("u1", "a@masova.com", UserType.STAFF)));

            List<UserResponse> result = userService.getAllUsers();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list when no users")
        void returnsEmptyList() {
            when(userRepository.findAllActiveEmployees()).thenReturn(List.of());
            assertThat(userService.getAllUsers()).isEmpty();
        }
    }

    // ===========================
    // refreshAccessToken
    // ===========================

    @Nested
    @DisplayName("refreshAccessToken")
    class RefreshAccessToken {

        @Test
        @DisplayName("throws when refresh token is expired")
        void throwsWhenExpired() {
            when(jwtService.extractUserId("expired-token")).thenReturn("u1");
            when(jwtService.isTokenExpired("expired-token")).thenReturn(true);

            assertThatThrownBy(() -> userService.refreshAccessToken("expired-token"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("returns new access token when refresh token is valid")
        void returnsNewAccessToken() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(jwtService.extractUserId("valid-refresh")).thenReturn("u1");
            when(jwtService.isTokenExpired("valid-refresh")).thenReturn(false);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(jwtService.generateAccessToken("u1", "STAFF", "store-1")).thenReturn("new-access-token");

            String result = userService.refreshAccessToken("valid-refresh");

            assertThat(result).isEqualTo("new-access-token");
        }
    }

    // ===========================
    // changePassword
    // ===========================

    @Nested
    @DisplayName("changePassword")
    class ChangePassword {

        @Test
        @DisplayName("throws when current password is incorrect")
        void throwsOnWrongCurrentPassword() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "hashed_password")).thenReturn(false);

            assertThatThrownBy(() -> userService.changePassword("u1", "wrong", "newpass"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("incorrect");
        }

        @Test
        @DisplayName("saves new password hash when current password matches")
        void savesNewPassword() {
            User user = buildUser("u1", "test@masova.com", UserType.STAFF);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("current", "hashed_password")).thenReturn(true);
            when(passwordEncoder.encode("newpass")).thenReturn("new_hashed");
            when(userRepository.save(any())).thenReturn(user);

            userService.changePassword("u1", "current", "newpass");

            verify(userRepository).save(argThat(u ->
                    "new_hashed".equals(u.getPersonalInfo().getPasswordHash())));
        }
    }

    // ===========================
    // verifyEmployeePIN
    // ===========================

    @Nested
    @DisplayName("verifyEmployeePIN")
    class VerifyEmployeePIN {

        @Test
        @DisplayName("returns false when employee has no PIN set")
        void returnsFalseWhenNoPIN() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.getEmployeeDetails().setEmployeePINHash(null);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            assertThat(userService.verifyEmployeePIN("u1", "12345")).isFalse();
        }

        @Test
        @DisplayName("returns true when PIN matches")
        void returnsTrueOnMatch() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.getEmployeeDetails().setEmployeePINHash("hashed_pin");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("12345", "hashed_pin")).thenReturn(true);

            assertThat(userService.verifyEmployeePIN("u1", "12345")).isTrue();
        }

        @Test
        @DisplayName("returns false when PIN does not match")
        void returnsFalseOnMismatch() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.getEmployeeDetails().setEmployeePINHash("hashed_pin");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("99999", "hashed_pin")).thenReturn(false);

            assertThat(userService.verifyEmployeePIN("u1", "99999")).isFalse();
        }
    }

    // ===========================
    // generateEmployeePIN
    // ===========================

    @Nested
    @DisplayName("generateEmployeePIN")
    class GenerateEmployeePIN {

        @Test
        @DisplayName("throws when user is not an employee")
        void throwsForNonEmployee() {
            User user = buildUser("u1", "customer@masova.com", UserType.CUSTOMER);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> userService.generateEmployeePIN("u1", "store-1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only employees");
        }

        @Test
        @DisplayName("generates 5-digit PIN on first unique attempt")
        void generatesPinOnFirstAttempt() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            when(userRepository.existsByStoreIdAndEmployeeDetailsPINHash(any(), any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed_pin");
            when(userRepository.save(any())).thenReturn(user);
            when(userJpaRepository.findByMongoId("u1")).thenReturn(Optional.empty());

            String pin = userService.generateEmployeePIN("u1", "store-1");

            assertThat(pin).hasSize(5).matches("\\d{5}");
        }
    }

    // ===========================
    // canUserTakeOrders
    // ===========================

    @Nested
    @DisplayName("canUserTakeOrders")
    class CanUserTakeOrders {

        @Test
        @DisplayName("returns false for inactive user")
        void falseForInactiveUser() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.setActive(false);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            assertThat(userService.canUserTakeOrders("u1")).isFalse();
        }

        @Test
        @DisplayName("returns true for active MANAGER assigned to store")
        void trueForActiveManager() {
            User user = buildUser("u1", "mgr@masova.com", UserType.MANAGER);
            User.EmployeeDetails details = new User.EmployeeDetails();
            details.setStoreId("store-1");
            user.setEmployeeDetails(details);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            assertThat(userService.canUserTakeOrders("u1")).isTrue();
        }

        @Test
        @DisplayName("returns false for STAFF type — only MANAGER/ASSISTANT_MANAGER can take orders")
        void falseForStaff() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            assertThat(userService.canUserTakeOrders("u1")).isFalse();
        }

        @Test
        @DisplayName("returns false when user not found — fail safe")
        void falseWhenUserNotFound() {
            when(userRepository.findById("missing")).thenReturn(Optional.empty());

            assertThat(userService.canUserTakeOrders("missing")).isFalse();
        }
    }

    // ===========================
    // logout
    // ===========================

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("blacklists access token on logout")
        void blacklistsToken() {
            User user = buildUser("u1", "customer@masova.com", UserType.CUSTOMER);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            userService.logout("u1", "some-access-token");

            verify(jwtService).invalidateToken("some-access-token");
        }

        @Test
        @DisplayName("ends working session for employee on logout")
        void endsSessionForEmployee() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            userService.logout("u1", "token");

            verify(sessionService).endSession("u1");
        }

        @Test
        @DisplayName("does not throw if endSession fails during logout")
        void toleratesSessionEndFailure() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));
            doThrow(new RuntimeException("no session")).when(sessionService).endSession("u1");

            assertThatCode(() -> userService.logout("u1", "token")).doesNotThrowAnyException();
        }
    }

    // ===========================
    // getUserStatistics
    // ===========================

    @Nested
    @DisplayName("getUserStatistics")
    class GetUserStatistics {

        @Test
        @DisplayName("returns map with expected keys")
        void returnsStatisticsMap() {
            when(userRepository.count()).thenReturn(100L);
            when(userRepository.countByIsActive(true)).thenReturn(80L);
            when(userRepository.countByLastLoginAfter(any())).thenReturn(40L);
            when(userRepository.countByType(any())).thenReturn(10L);

            Map<String, Object> stats = userService.getUserStatistics();

            assertThat(stats).containsKeys("totalUsers", "activeUsers", "inactiveUsers", "recentLogins", "usersByType");
            assertThat(stats.get("totalUsers")).isEqualTo(100L);
            assertThat(stats.get("activeUsers")).isEqualTo(80L);
            assertThat(stats.get("inactiveUsers")).isEqualTo(20L);
        }
    }

    // ===========================
    // findUserByPIN
    // ===========================

    @Nested
    @DisplayName("findUserByPIN")
    class FindUserByPIN {

        @Test
        @DisplayName("returns null for null PIN")
        void returnsNullForNullPin() {
            assertThat(userService.findUserByPIN(null)).isNull();
        }

        @Test
        @DisplayName("returns null for PIN that is not 5 digits")
        void returnsNullForWrongLength() {
            assertThat(userService.findUserByPIN("123")).isNull();
            assertThat(userService.findUserByPIN("123456")).isNull();
        }

        @Test
        @DisplayName("returns user when PIN matches a candidate")
        void returnsUserOnMatch() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.getEmployeeDetails().setEmployeePINHash("hashed_pin");
            when(userRepository.findByEmployeeDetailsPinSuffix("45")).thenReturn(List.of(user));
            when(passwordEncoder.matches("12345", "hashed_pin")).thenReturn(true);

            assertThat(userService.findUserByPIN("12345")).isEqualTo(user);
        }

        @Test
        @DisplayName("returns null when no candidate has matching PIN")
        void returnsNullWhenNoMatch() {
            User user = buildEmployee("u1", "staff@masova.com", "store-1");
            user.getEmployeeDetails().setEmployeePINHash("hashed_pin");
            when(userRepository.findByEmployeeDetailsPinSuffix("45")).thenReturn(List.of(user));
            when(passwordEncoder.matches("12345", "hashed_pin")).thenReturn(false);

            assertThat(userService.findUserByPIN("12345")).isNull();
        }
    }

    // ===========================
    // getDriverStatsByStore
    // ===========================

    @Nested
    @DisplayName("getDriverStatsByStore")
    class GetDriverStatsByStore {

        @Test
        @DisplayName("returns driver statistics map with expected keys")
        void returnsDriverStats() {
            User driver = buildUser("d1", "driver@masova.com", UserType.DRIVER);
            User.EmployeeDetails details = new User.EmployeeDetails();
            details.setStatus("ONLINE");
            details.setActiveDeliveryCount(0);
            driver.setEmployeeDetails(details);
            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, "store-1"))
                    .thenReturn(List.of(driver));

            Map<String, Object> stats = userService.getDriverStatsByStore("store-1");

            assertThat(stats).containsKeys("totalDrivers", "activeDrivers", "onlineDrivers",
                    "offlineDrivers", "availableDrivers", "busyDrivers");
            assertThat(stats.get("totalDrivers")).isEqualTo(1L);
            assertThat(stats.get("onlineDrivers")).isEqualTo(1L);
        }
    }

    // ===========================
    // getUsersByType
    // ===========================

    @Nested
    @DisplayName("getUsersByType")
    class GetUsersByType {

        @Test
        @DisplayName("returns mapped list for given type")
        void returnsMappedList() {
            User u = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findByType(UserType.STAFF)).thenReturn(List.of(u));

            List<UserResponse> result = userService.getUsersByType(UserType.STAFF);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list when none found")
        void returnsEmpty() {
            when(userRepository.findByType(UserType.DRIVER)).thenReturn(List.of());

            assertThat(userService.getUsersByType(UserType.DRIVER)).isEmpty();
        }
    }

    // ===========================
    // getUsersByTypeAndStore
    // ===========================

    @Nested
    @DisplayName("getUsersByTypeAndStore")
    class GetUsersByTypeAndStore {

        @Test
        @DisplayName("returns employees of given type in given store")
        void returnsFiltered() {
            User u = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.STAFF, "store-1"))
                    .thenReturn(List.of(u));

            List<UserResponse> result = userService.getUsersByTypeAndStore(UserType.STAFF, "store-1");

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // getStoreEmployees
    // ===========================

    @Nested
    @DisplayName("getStoreEmployees")
    class GetStoreEmployees {

        @Test
        @DisplayName("returns all employees for given store")
        void returnsEmployees() {
            User u = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findByStoreId("store-1")).thenReturn(List.of(u));

            List<UserResponse> result = userService.getStoreEmployees("store-1");

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // getActiveManagers
    // ===========================

    @Nested
    @DisplayName("getActiveManagers")
    class GetActiveManagers {

        @Test
        @DisplayName("returns active managers and assistant managers")
        void returnsManagers() {
            User mgr = buildUser("m1", "mgr@masova.com", UserType.MANAGER);
            when(userRepository.findActiveManagersAndAssistants(UserType.MANAGER, UserType.ASSISTANT_MANAGER))
                    .thenReturn(List.of(mgr));

            List<UserResponse> result = userService.getActiveManagers();

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // updateUser
    // ===========================

    @Nested
    @DisplayName("updateUser")
    class UpdateUser {

        @Test
        @DisplayName("updates personal info and saves")
        void updatesPersonalInfo() {
            User existing = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("e1")).thenReturn(Optional.of(existing));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            UserCreateRequest req = buildCreateRequest("new@masova.com", "9999999999", UserType.STAFF, "store-1");
            req.setName("Updated Name");

            UserResponse result = userService.updateUser("e1", req);

            assertThat(result.getName()).isEqualTo("Updated Name");
            verify(userRepository).save(any());
        }
    }

    // ===========================
    // getDriversByStore
    // ===========================

    @Nested
    @DisplayName("getDriversByStore")
    class GetDriversByStore {

        @Test
        @DisplayName("returns drivers for store")
        void returnsDrivers() {
            User driver = buildUser("d1", "driver@masova.com", UserType.DRIVER);
            User.EmployeeDetails details = new User.EmployeeDetails();
            details.setStoreId("store-1");
            driver.setEmployeeDetails(details);
            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, "store-1"))
                    .thenReturn(List.of(driver));

            List<UserResponse> result = userService.getDriversByStore("store-1");

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // getAvailableDrivers
    // ===========================

    @Nested
    @DisplayName("getAvailableDrivers")
    class GetAvailableDrivers {

        @Test
        @DisplayName("returns only active drivers with AVAILABLE status")
        void returnsAvailableOnly() {
            User available = buildUser("d1", "d1@masova.com", UserType.DRIVER);
            User.EmployeeDetails ad = new User.EmployeeDetails();
            ad.setStatus("AVAILABLE");
            available.setEmployeeDetails(ad);

            User busy = buildUser("d2", "d2@masova.com", UserType.DRIVER);
            User.EmployeeDetails bd = new User.EmployeeDetails();
            bd.setStatus("BUSY");
            busy.setEmployeeDetails(bd);

            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, "store-1"))
                    .thenReturn(List.of(available, busy));

            List<UserResponse> result = userService.getAvailableDrivers("store-1");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("excludes inactive drivers")
        void excludesInactive() {
            User inactive = buildUser("d1", "d1@masova.com", UserType.DRIVER);
            inactive.setActive(false);
            User.EmployeeDetails d = new User.EmployeeDetails();
            d.setStatus("AVAILABLE");
            inactive.setEmployeeDetails(d);
            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, "store-1"))
                    .thenReturn(List.of(inactive));

            assertThat(userService.getAvailableDrivers("store-1")).isEmpty();
        }
    }

    // ===========================
    // updateDriverStatus
    // ===========================

    @Nested
    @DisplayName("updateDriverStatus")
    class UpdateDriverStatus {

        @Test
        @DisplayName("throws when user not found")
        void throwsWhenNotFound() {
            when(userRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateDriverStatus("missing", "ONLINE"))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("throws when user is not a driver")
        void throwsWhenNotDriver() {
            User notDriver = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("e1")).thenReturn(Optional.of(notDriver));

            assertThatThrownBy(() -> userService.updateDriverStatus("e1", "ONLINE"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not a driver");
        }

        @Test
        @DisplayName("updates status and saves driver")
        void updatesStatus() {
            User driver = buildUser("d1", "d@masova.com", UserType.DRIVER);
            User.EmployeeDetails details = new User.EmployeeDetails();
            driver.setEmployeeDetails(details);
            when(userRepository.findById("d1")).thenReturn(Optional.of(driver));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            userService.updateDriverStatus("d1", "OFFLINE");

            verify(userRepository).save(argThat(u -> "OFFLINE".equals(u.getEmployeeDetails().getStatus())));
        }
    }

    // ===========================
    // generateKioskTokens
    // ===========================

    @Nested
    @DisplayName("generateKioskTokens")
    class GenerateKioskTokens {

        @Test
        @DisplayName("throws when user is not a kiosk account")
        void throwsWhenNotKiosk() {
            User notKiosk = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("e1")).thenReturn(Optional.of(notKiosk));

            assertThatThrownBy(() -> userService.generateKioskTokens("e1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not a kiosk");
        }

        @Test
        @DisplayName("throws when kiosk account is deactivated")
        void throwsWhenDeactivated() {
            User kiosk = buildUser("k1", "kiosk@masova.internal", UserType.KIOSK);
            kiosk.setActive(false);
            User.EmployeeDetails kd = new User.EmployeeDetails();
            kd.setStoreId("store-1");
            kd.setTerminalId("POS-01");
            kiosk.setEmployeeDetails(kd);
            when(userRepository.findById("k1")).thenReturn(Optional.of(kiosk));

            assertThatThrownBy(() -> userService.generateKioskTokens("k1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("deactivated");
        }

        @Test
        @DisplayName("generates tokens for active kiosk account")
        void generatesTokens() {
            User kiosk = buildUser("k1", "kiosk@masova.internal", UserType.KIOSK);
            User.EmployeeDetails kd = new User.EmployeeDetails();
            kd.setStoreId("store-1");
            kd.setTerminalId("POS-01");
            kiosk.setEmployeeDetails(kd);
            when(userRepository.findById("k1")).thenReturn(Optional.of(kiosk));
            when(jwtService.generateKioskAccessToken(any(), any(), any())).thenReturn("kiosk-access-token");
            when(jwtService.generateKioskRefreshToken(any())).thenReturn("kiosk-refresh-token");
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            LoginResponse result = userService.generateKioskTokens("k1");

            assertThat(result.getAccessToken()).isEqualTo("kiosk-access-token");
            assertThat(result.getRefreshToken()).isEqualTo("kiosk-refresh-token");
        }
    }

    // ===========================
    // getKioskAccountsByStore
    // ===========================

    @Nested
    @DisplayName("getKioskAccountsByStore")
    class GetKioskAccountsByStore {

        @Test
        @DisplayName("returns kiosk accounts for store")
        void returnsKioskAccounts() {
            User kiosk = buildUser("k1", "kiosk@masova.internal", UserType.KIOSK);
            User.EmployeeDetails kd = new User.EmployeeDetails();
            kd.setStoreId("store-1");
            kiosk.setEmployeeDetails(kd);
            when(userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.KIOSK, "store-1"))
                    .thenReturn(List.of(kiosk));

            List<UserResponse> result = userService.getKioskAccountsByStore("store-1");

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // searchUsers
    // ===========================

    @Nested
    @DisplayName("searchUsers")
    class SearchUsers {

        @Test
        @DisplayName("searches by storeId and type when both provided")
        void searchesByStoreAndType() {
            User u = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findByStoreIdAndType("store-1", UserType.STAFF)).thenReturn(List.of(u));

            List<UserResponse> result = userService.searchUsers(null, null, null, UserType.STAFF, "store-1");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("searches by name when only name provided")
        void searchesByName() {
            User u = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findByNameContainingIgnoreCase("Test")).thenReturn(List.of(u));

            List<UserResponse> result = userService.searchUsers("Test", null, null, null, null);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("falls back to active employees when no filter provided")
        void fallsBackToActiveEmployees() {
            when(userRepository.findAllActiveEmployees()).thenReturn(List.of());

            List<UserResponse> result = userService.searchUsers(null, null, null, null, null);

            assertThat(result).isEmpty();
            verify(userRepository).findAllActiveEmployees();
        }
    }

    // ===========================
    // registerUser
    // ===========================

    @Nested
    @DisplayName("registerUser")
    class RegisterUser {

        @Test
        @DisplayName("throws when email already exists")
        void throwsOnDuplicateEmail() {
            UserCreateRequest req = buildCreateRequest("exists@masova.com", "9876543210", UserType.CUSTOMER, null);
            when(userRepository.existsByPersonalInfoEmail("exists@masova.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.registerUser(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("creates customer and returns login response")
        void createsCustomer() {
            UserCreateRequest req = buildCreateRequest("new@masova.com", "9876543210", UserType.CUSTOMER, null);
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            User saved = buildUser("u1", "new@masova.com", UserType.CUSTOMER);
            when(userRepository.save(any())).thenReturn(saved);
            when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
            when(userJpaRepository.save(any())).thenReturn(null);

            LoginResponse result = userService.registerUser(req);

            assertThat(result.getAccessToken()).isEqualTo("access-token");
            assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
        }
    }

    // ===========================
    // deactivateKioskAccount
    // ===========================

    @Nested
    @DisplayName("deactivateKioskAccount")
    class DeactivateKioskAccount {

        @Test
        @DisplayName("throws when requester is not a manager")
        void throwsWhenNotManager() {
            User notManager = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("e1")).thenReturn(Optional.of(notManager));

            assertThatThrownBy(() -> userService.deactivateKioskAccount("k1", "e1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only managers");
        }

        @Test
        @DisplayName("throws when target is not a kiosk account")
        void throwsWhenNotKiosk() {
            User manager = buildUser("m1", "mgr@masova.com", UserType.MANAGER);
            User notKiosk = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("m1")).thenReturn(Optional.of(manager));
            when(userRepository.findById("e1")).thenReturn(Optional.of(notKiosk));

            assertThatThrownBy(() -> userService.deactivateKioskAccount("e1", "m1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not a kiosk");
        }

        @Test
        @DisplayName("deactivates kiosk account when manager and target are valid")
        void deactivatesKiosk() {
            User manager = buildUser("m1", "mgr@masova.com", UserType.MANAGER);
            User kiosk = buildUser("k1", "kiosk@masova.internal", UserType.KIOSK);
            User.EmployeeDetails kd = new User.EmployeeDetails();
            kd.setStoreId("store-1");
            kiosk.setEmployeeDetails(kd);
            when(userRepository.findById("m1")).thenReturn(Optional.of(manager));
            when(userRepository.findById("k1")).thenReturn(Optional.of(kiosk));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            userService.deactivateKioskAccount("k1", "m1");

            verify(userRepository).save(argThat(u -> !u.isActive()));
        }
    }

    // ===========================
    // createKioskAccount
    // ===========================

    @Nested
    @DisplayName("createKioskAccount")
    class CreateKioskAccount {

        @Test
        @DisplayName("throws when creator is not a manager")
        void throwsWhenNotManager() {
            User notManager = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.findById("e1")).thenReturn(Optional.of(notManager));

            assertThatThrownBy(() -> userService.createKioskAccount("store-1", "POS-01", "e1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only managers");
        }

        @Test
        @DisplayName("throws when kiosk already exists for terminal")
        void throwsWhenAlreadyExists() {
            User manager = buildUser("m1", "mgr@masova.com", UserType.MANAGER);
            User existingKiosk = buildUser("k0", "kiosk@masova.internal", UserType.KIOSK);
            when(userRepository.findById("m1")).thenReturn(Optional.of(manager));
            when(userRepository.findByEmployeeDetailsStoreIdAndEmployeeDetailsTerminalId("store-1", "POS-01"))
                    .thenReturn(Optional.of(existingKiosk));

            assertThatThrownBy(() -> userService.createKioskAccount("store-1", "POS-01", "m1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("creates kiosk account successfully")
        void createsKiosk() {
            User manager = buildUser("m1", "mgr@masova.com", UserType.MANAGER);
            when(userRepository.findById("m1")).thenReturn(Optional.of(manager));
            when(userRepository.findByEmployeeDetailsStoreIdAndEmployeeDetailsTerminalId(any(), any()))
                    .thenReturn(Optional.empty());
            when(passwordEncoder.encode(any())).thenReturn("hashed-random");
            User savedKiosk = buildUser("k1", "kiosk.store-1.POS-01@masova.internal", UserType.KIOSK);
            when(userRepository.save(any())).thenReturn(savedKiosk);
            when(userJpaRepository.save(any())).thenReturn(null);

            User result = userService.createKioskAccount("store-1", "POS-01", "m1");

            assertThat(result).isNotNull();
            verify(userRepository).save(any());
        }
    }

    // ===========================
    // mapToUserResponse
    // ===========================

    @Nested
    @DisplayName("mapToUserResponse")
    class MapToUserResponse {

        @Test
        @DisplayName("maps basic customer fields correctly")
        void mapsCustomer() {
            User customer = buildUser("c1", "cust@masova.com", UserType.CUSTOMER);

            UserResponse result = userService.mapToUserResponse(customer);

            assertThat(result.getId()).isEqualTo("c1");
            assertThat(result.getEmail()).isEqualTo("cust@masova.com");
            assertThat(result.getType()).isEqualTo(UserType.CUSTOMER);
        }

        @Test
        @DisplayName("includes storeId for employee users")
        void mapsEmployee() {
            User emp = buildEmployee("e1", "emp@masova.com", "store-1");

            UserResponse result = userService.mapToUserResponse(emp);

            assertThat(result.getStoreId()).isEqualTo("store-1");
        }
    }

    // ===========================
    // loginWithGoogle
    // ===========================

    @Nested
    @DisplayName("loginWithGoogle")
    class LoginWithGoogle {

        @Test
        @DisplayName("throws when Google token verification fails")
        void throwsWhenTokenVerificationFails() {
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenThrow(new org.springframework.web.client.RestClientException("Connection failed"));

            assertThatThrownBy(() -> userService.loginWithGoogle("bad-token"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Google token verification failed");
        }

        @Test
        @DisplayName("throws when no account found for google email")
        void throwsWhenNoAccountFound() {
            Map<String, Object> tokenInfo = new HashMap<>();
            tokenInfo.put("sub", "google-sub-123");
            tokenInfo.put("email", "notfound@gmail.com");
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(tokenInfo));
            when(userRepository.findByPersonalInfoEmail("notfound@gmail.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.loginWithGoogle("valid-token"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("No account found");
        }

        @Test
        @DisplayName("returns LoginResponse when account found")
        void returnsLoginResponseWhenFound() {
            Map<String, Object> tokenInfo = new HashMap<>();
            tokenInfo.put("sub", "google-sub-123");
            tokenInfo.put("email", "user@gmail.com");
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(tokenInfo));
            User user = buildUser("u1", "user@gmail.com", UserType.CUSTOMER);
            user.setAuthProviders(new java.util.ArrayList<>());
            when(userRepository.findByPersonalInfoEmail("user@gmail.com")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenReturn(user);
            when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
            when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

            LoginResponse result = userService.loginWithGoogle("valid-token");

            assertThat(result.getAccessToken()).isEqualTo("access-token");
        }
    }

    // ===========================
    // createEmployee
    // ===========================

    @Nested
    @DisplayName("createEmployee")
    class CreateEmployee {

        @Test
        @DisplayName("throws when email already exists")
        void throwsOnDuplicateEmail() {
            UserCreateRequest req = buildCreateRequest("exists@masova.com", "9876543210", UserType.STAFF, "store-1");
            when(userRepository.existsByPersonalInfoEmail("exists@masova.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createEmployee(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("throws when storeId missing for employee")
        void throwsWhenNoStoreId() {
            UserCreateRequest req = buildCreateRequest("emp@masova.com", "9876543210", UserType.STAFF, null);
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);

            assertThatThrownBy(() -> userService.createEmployee(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Store ID");
        }

        @Test
        @DisplayName("creates employee and returns UserResponse")
        void createsEmployee() {
            UserCreateRequest req = buildCreateRequest("emp@masova.com", "9876543210", UserType.STAFF, "store-1");
            when(userRepository.existsByPersonalInfoEmail(any())).thenReturn(false);
            when(userRepository.existsByPersonalInfoPhone(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            User saved = buildEmployee("e1", "emp@masova.com", "store-1");
            when(userRepository.save(any())).thenReturn(saved);
            when(userJpaRepository.save(any())).thenReturn(null);

            UserResponse result = userService.createEmployee(req);

            assertThat(result).isNotNull();
            assertThat(result.getStoreId()).isEqualTo("store-1");
        }
    }

    // ===========================
    // getUserResponseById
    // ===========================

    @Nested
    @DisplayName("getUserResponseById")
    class GetUserResponseById {

        @Test
        @DisplayName("returns UserResponse for found user")
        void returnsResponse() {
            User user = buildUser("u1", "test@masova.com", UserType.CUSTOMER);
            when(userRepository.findById("u1")).thenReturn(Optional.of(user));

            UserResponse result = userService.getUserResponseById("u1");

            assertThat(result.getId()).isEqualTo("u1");
        }
    }
}
