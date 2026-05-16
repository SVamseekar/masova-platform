package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.core.user.service.AccessControlService;
import com.MaSoVa.core.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AccessControlService Unit Tests")
class AccessControlServiceTest {

    @Mock private UserService userService;

    @InjectMocks private AccessControlService accessControlService;

    private User buildEmployee(UserType type, String storeId, boolean active) {
        User u = new User();
        u.setId("user-1");
        u.setType(type);
        u.setActive(active);
        User.EmployeeDetails details = new User.EmployeeDetails();
        details.setStoreId(storeId);
        u.setEmployeeDetails(details);
        return u;
    }

    @Nested
    @DisplayName("validateOrderTakingAccess")
    class ValidateOrderTakingAccess {

        @Test
        @DisplayName("denied when getUserById throws")
        void deniedOnException() {
            when(userService.getUserById("user-1")).thenThrow(new RuntimeException("not found"));

            AccessControlService.OrderTakingPermission result =
                    accessControlService.validateOrderTakingAccess("user-1", "store-1");

            assertThat(result.isAllowed()).isFalse();
        }

        @Test
        @DisplayName("denied when user account is inactive")
        void deniedWhenInactive() {
            User u = buildEmployee(UserType.MANAGER, "store-1", false);
            when(userService.getUserById("user-1")).thenReturn(u);

            AccessControlService.OrderTakingPermission result =
                    accessControlService.validateOrderTakingAccess("user-1", "store-1");

            assertThat(result.isAllowed()).isFalse();
            assertThat(result.getReason()).contains("deactivated");
        }

        @Test
        @DisplayName("denied when employee is assigned to different store")
        void deniedWhenDifferentStore() {
            User u = buildEmployee(UserType.MANAGER, "store-2", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            AccessControlService.OrderTakingPermission result =
                    accessControlService.validateOrderTakingAccess("user-1", "store-1");

            assertThat(result.isAllowed()).isFalse();
            assertThat(result.getReason()).contains("Not assigned");
        }

        @Test
        @DisplayName("allowed when MANAGER assigned to correct store")
        void allowedForManager() {
            User u = buildEmployee(UserType.MANAGER, "store-1", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            AccessControlService.OrderTakingPermission result =
                    accessControlService.validateOrderTakingAccess("user-1", "store-1");

            assertThat(result.isAllowed()).isTrue();
            assertThat(result.getCheckedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("canAccessStore")
    class CanAccessStore {

        @Test
        @DisplayName("returns false when getUserById throws")
        void returnsFalseOnException() {
            when(userService.getUserById("user-1")).thenThrow(new RuntimeException("not found"));

            assertThat(accessControlService.canAccessStore("user-1", "store-1")).isFalse();
        }

        @Test
        @DisplayName("returns false for non-employee users")
        void returnsFalseForCustomer() {
            User u = new User();
            u.setType(UserType.CUSTOMER);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canAccessStore("user-1", "store-1")).isFalse();
        }

        @Test
        @DisplayName("returns true when employee store matches")
        void returnsTrueForMatchingStore() {
            User u = buildEmployee(UserType.MANAGER, "store-1", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canAccessStore("user-1", "store-1")).isTrue();
        }

        @Test
        @DisplayName("returns false when employee store does not match")
        void returnsFalseForWrongStore() {
            User u = buildEmployee(UserType.MANAGER, "store-2", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canAccessStore("user-1", "store-1")).isFalse();
        }
    }

    @Nested
    @DisplayName("canManageEmployees")
    class CanManageEmployees {

        @Test
        @DisplayName("returns false on exception")
        void returnsFalseOnException() {
            when(userService.getUserById("user-1")).thenThrow(new RuntimeException("not found"));

            assertThat(accessControlService.canManageEmployees("user-1")).isFalse();
        }

        @Test
        @DisplayName("returns true for MANAGER")
        void returnsTrueForManager() {
            User u = buildEmployee(UserType.MANAGER, "store-1", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canManageEmployees("user-1")).isTrue();
        }

        @Test
        @DisplayName("returns true for ASSISTANT_MANAGER")
        void returnsTrueForAssistantManager() {
            User u = buildEmployee(UserType.ASSISTANT_MANAGER, "store-1", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canManageEmployees("user-1")).isTrue();
        }

        @Test
        @DisplayName("returns false for STAFF")
        void returnsFalseForStaff() {
            User u = buildEmployee(UserType.STAFF, "store-1", true);
            when(userService.getUserById("user-1")).thenReturn(u);

            assertThat(accessControlService.canManageEmployees("user-1")).isFalse();
        }
    }

    @Nested
    @DisplayName("OrderTakingPermission inner class")
    class OrderTakingPermissionTests {

        @Test
        @DisplayName("allowed() creates permitted permission")
        void allowedFactory() {
            AccessControlService.OrderTakingPermission p = AccessControlService.OrderTakingPermission.allowed("OK");
            assertThat(p.isAllowed()).isTrue();
            assertThat(p.getReason()).isEqualTo("OK");
        }

        @Test
        @DisplayName("denied() creates denied permission")
        void deniedFactory() {
            AccessControlService.OrderTakingPermission p = AccessControlService.OrderTakingPermission.denied("No access");
            assertThat(p.isAllowed()).isFalse();
            assertThat(p.getReason()).isEqualTo("No access");
        }
    }
}
