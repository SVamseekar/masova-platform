package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.enums.WorkingSessionStatus;
import com.MaSoVa.core.user.dto.WorkingHoursReport;
import com.MaSoVa.core.user.dto.WorkingSessionResponse;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import com.MaSoVa.core.user.service.NotificationService;
import com.MaSoVa.core.user.service.ShiftValidationService;
import com.MaSoVa.core.user.service.ShiftValidationService.ShiftValidationResult;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.core.user.service.WorkingSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WorkingSessionService Unit Tests")
class WorkingSessionServiceTest {

    @Mock private WorkingSessionRepository sessionRepository;
    @Mock private UserRepository userRepository;
    @Mock private ShiftValidationService shiftValidationService;
    @Mock private StoreService storeService;
    @Mock private NotificationService notificationService;

    @InjectMocks private WorkingSessionService workingSessionService;

    private User buildEmployee(String id, UserType type) {
        User user = new User();
        user.setId(id);
        user.setType(type);
        User.PersonalInfo info = new User.PersonalInfo();
        info.setName("Employee " + id);
        info.setEmail(id + "@masova.com");
        user.setPersonalInfo(info);
        User.EmployeeDetails details = new User.EmployeeDetails();
        details.setStoreId("store-1");
        details.setRole("STAFF");
        user.setEmployeeDetails(details);
        user.setActive(true);
        return user;
    }

    private WorkingSession buildSession(String id, String employeeId, boolean active) {
        WorkingSession session = new WorkingSession(employeeId, "store-1", LocalDateTime.now().minusHours(2));
        session.setId(id);
        session.setActive(active);
        session.setDate(LocalDate.now());
        return session;
    }

    // ===========================
    // startSession
    // ===========================

    @Nested
    @DisplayName("startSession")
    class StartSession {

        @Test
        @DisplayName("creates new session when no active session exists")
        void createsSessionWhenNoneActive() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());
            when(shiftValidationService.validateSessionStart(any(), any(), any()))
                    .thenReturn(ShiftValidationResult.warning("No shift"));
            when(storeService.validateStoreOperational("store-1")).thenReturn(true);
            WorkingSession saved = buildSession("s1", "emp-1", true);
            when(sessionRepository.save(any())).thenReturn(saved);

            WorkingSession result = workingSessionService.startSession("emp-1", "store-1");

            assertThat(result.getId()).isEqualTo("s1");
            verify(sessionRepository).save(any());
        }

        @Test
        @DisplayName("auto-closes session older than 12 hours and creates new one")
        void autoClosesOldSession() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            WorkingSession oldSession = buildSession("old", "emp-1", true);
            oldSession.setLoginTime(LocalDateTime.now().minusHours(14));

            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(oldSession))
                    .thenReturn(List.of());
            when(shiftValidationService.validateSessionStart(any(), any(), any()))
                    .thenReturn(ShiftValidationResult.warning("No shift"));
            when(storeService.validateStoreOperational("store-1")).thenReturn(true);
            WorkingSession newSession = buildSession("new", "emp-1", true);
            when(sessionRepository.save(any())).thenReturn(newSession);

            workingSessionService.startSession("emp-1", "store-1");

            verify(sessionRepository, atLeastOnce()).save(argThat(s ->
                    s.getId() == null || "old".equals(s.getId())));
        }

        @Test
        @DisplayName("throws when store is not operational")
        void throwsWhenStoreNotOperational() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());
            when(shiftValidationService.validateSessionStart(any(), any(), any()))
                    .thenReturn(ShiftValidationResult.warning("No shift"));
            when(storeService.validateStoreOperational("store-1")).thenReturn(false);

            assertThatThrownBy(() -> workingSessionService.startSession("emp-1", "store-1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not operational");
        }
    }

    // ===========================
    // clockInWithPin
    // ===========================

    @Nested
    @DisplayName("clockInWithPin")
    class ClockInWithPin {

        @Test
        @DisplayName("throws when employee not found")
        void throwsWhenEmployeeNotFound() {
            when(userRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> workingSessionService.clockInWithPin("missing", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when user is not an employee")
        void throwsForNonEmployee() {
            User customer = new User();
            customer.setId("u1");
            customer.setType(UserType.CUSTOMER);
            when(userRepository.findById("u1")).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("u1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not an employee");
        }

        @Test
        @DisplayName("throws when employee has no PIN set")
        void throwsWhenNoPinSet() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            employee.getEmployeeDetails().setEmployeePINHash(null);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("PIN not set");
        }

        @Test
        @DisplayName("throws when PIN is invalid")
        void throwsOnInvalidPin() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            employee.getEmployeeDetails().setEmployeePINHash(encoder.encode("99999"));
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid PIN");
        }

        @Test
        @DisplayName("throws when employee already has active session")
        void throwsWhenAlreadyActive() {
            User employee = buildEmployee("emp-1", UserType.STAFF);
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            employee.getEmployeeDetails().setEmployeePINHash(encoder.encode("12345"));
            WorkingSession active = buildSession("s1", "emp-1", true);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(employee));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(active));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already has an active session");
        }
    }

    // ===========================
    // endSession
    // ===========================

    @Nested
    @DisplayName("endSession")
    class EndSession {

        @Test
        @DisplayName("throws when no active session found")
        void throwsWhenNoActiveSession() {
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());

            assertThatThrownBy(() -> workingSessionService.endSession("emp-1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("No active session");
        }

        @Test
        @DisplayName("marks session as COMPLETED and sets logout time")
        void completesSession() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            session.setLoginTime(LocalDateTime.now().minusHours(4));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));
            doNothing().when(shiftValidationService).validateSessionEnd(any(), any());
            when(userRepository.findById("emp-1")).thenReturn(Optional.empty());
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WorkingSession result = workingSessionService.endSession("emp-1");

            assertThat(result.isActive()).isFalse();
            assertThat(result.getLogoutTime()).isNotNull();
        }

        @Test
        @DisplayName("sets DRIVER status to OFF_DUTY on clock-out")
        void setsDriverOffDuty() {
            WorkingSession session = buildSession("s1", "driver-1", true);
            session.setLoginTime(LocalDateTime.now().minusHours(4));
            User driver = buildEmployee("driver-1", UserType.DRIVER);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("driver-1"))
                    .thenReturn(List.of(session));
            doNothing().when(shiftValidationService).validateSessionEnd(any(), any());
            when(userRepository.findById("driver-1")).thenReturn(Optional.of(driver));
            when(userRepository.save(any())).thenReturn(driver);
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            workingSessionService.endSession("driver-1");

            verify(userRepository).save(argThat(u ->
                    "OFF_DUTY".equals(u.getEmployeeDetails().getStatus())));
        }
    }

    // ===========================
    // addBreakTime
    // ===========================

    @Nested
    @DisplayName("addBreakTime")
    class AddBreakTime {

        @Test
        @DisplayName("throws when no active session")
        void throwsWhenNoActiveSession() {
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());

            assertThatThrownBy(() -> workingSessionService.addBreakTime("emp-1", 30))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("No active session");
        }

        @Test
        @DisplayName("throws when single break exceeds 120 minutes")
        void throwsWhenBreakTooLong() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            session.setLoginTime(LocalDateTime.now().minusHours(6));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));

            assertThatThrownBy(() -> workingSessionService.addBreakTime("emp-1", 150))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("120 minutes");
        }

        @Test
        @DisplayName("throws when total breaks exceed 25% of shift duration")
        void throwsWhenBreaksExceedQuarter() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            session.setLoginTime(LocalDateTime.now().minusHours(4));
            session.setBreakDurationMinutes(50L); // already at 50 of max 60 (25% of 240)
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));

            assertThatThrownBy(() -> workingSessionService.addBreakTime("emp-1", 30))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("25%");
        }

        @Test
        @DisplayName("throws when first break taken before 2 hours of work")
        void throwsBeforeMinimumWorkTime() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            session.setLoginTime(LocalDateTime.now().minusMinutes(60));
            session.setBreakDurationMinutes(0L);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));

            assertThatThrownBy(() -> workingSessionService.addBreakTime("emp-1", 15))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("2 hours");
        }

        @Test
        @DisplayName("adds break time to session when rules are satisfied")
        void addsBreakTimeSuccessfully() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            session.setLoginTime(LocalDateTime.now().minusHours(5));
            session.setBreakDurationMinutes(0L);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WorkingSession result = workingSessionService.addBreakTime("emp-1", 30);

            assertThat(result.getBreakDurationMinutes()).isEqualTo(30);
        }
    }

    // ===========================
    // approveSession / rejectSession
    // ===========================

    @Nested
    @DisplayName("approveSession")
    class ApproveSession {

        @Test
        @DisplayName("throws when session not found")
        void throwsWhenNotFound() {
            when(sessionRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> workingSessionService.approveSession("missing", "mgr-1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("sets status to APPROVED")
        void setsApproved() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            session.setStatus(WorkingSessionStatus.PENDING_APPROVAL);
            when(sessionRepository.findById("s1")).thenReturn(Optional.of(session));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            workingSessionService.approveSession("s1", "mgr-1");

            verify(sessionRepository).save(argThat(s ->
                    s.getStatus() == WorkingSessionStatus.APPROVED &&
                    "mgr-1".equals(s.getApprovedBy())));
        }
    }

    @Nested
    @DisplayName("rejectSession")
    class RejectSession {

        @Test
        @DisplayName("sets status to REJECTED with reason")
        void setsRejected() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            session.setStatus(WorkingSessionStatus.PENDING_APPROVAL);
            when(sessionRepository.findById("s1")).thenReturn(Optional.of(session));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            workingSessionService.rejectSession("s1", "mgr-1", "Unauthorized overtime");

            verify(sessionRepository).save(argThat(s ->
                    s.getStatus() == WorkingSessionStatus.REJECTED));
        }
    }

    // ===========================
    // generateEmployeeReport
    // ===========================

    @Nested
    @DisplayName("generateEmployeeReport")
    class GenerateEmployeeReport {

        @Test
        @DisplayName("returns report with correct total hours and days")
        void generatesReport() {
            WorkingSession s1 = buildSession("s1", "emp-1", false);
            s1.setTotalHours(8.0);
            s1.setStatus(WorkingSessionStatus.COMPLETED);
            WorkingSession s2 = buildSession("s2", "emp-1", false);
            s2.setTotalHours(6.0);
            s2.setStatus(WorkingSessionStatus.COMPLETED);

            LocalDate start = LocalDate.now().minusDays(7);
            LocalDate end = LocalDate.now();
            when(sessionRepository.findByEmployeeIdAndDateBetween("emp-1", start, end))
                    .thenReturn(List.of(s1, s2));

            WorkingHoursReport report = workingSessionService.generateEmployeeReport("emp-1", start, end);

            assertThat(report.getTotalHours()).isEqualTo(14.0);
            assertThat(report.getTotalDays()).isEqualTo(2);
            assertThat(report.getAverageHoursPerDay()).isEqualTo(7.0);
        }

        @Test
        @DisplayName("excludes REJECTED sessions from report totals")
        void excludesRejectedSessions() {
            WorkingSession s1 = buildSession("s1", "emp-1", false);
            s1.setTotalHours(8.0);
            s1.setStatus(WorkingSessionStatus.COMPLETED);
            WorkingSession s2 = buildSession("s2", "emp-1", false);
            s2.setTotalHours(4.0);
            s2.setStatus(WorkingSessionStatus.REJECTED);

            LocalDate start = LocalDate.now().minusDays(7);
            LocalDate end = LocalDate.now();
            when(sessionRepository.findByEmployeeIdAndDateBetween("emp-1", start, end))
                    .thenReturn(List.of(s1, s2));

            WorkingHoursReport report = workingSessionService.generateEmployeeReport("emp-1", start, end);

            assertThat(report.getTotalHours()).isEqualTo(8.0);
            assertThat(report.getTotalDays()).isEqualTo(1);
        }

        @Test
        @DisplayName("returns zero averages when no valid sessions")
        void returnsZeroForEmptyPeriod() {
            when(sessionRepository.findByEmployeeIdAndDateBetween(any(), any(), any()))
                    .thenReturn(List.of());

            WorkingHoursReport report = workingSessionService.generateEmployeeReport(
                    "emp-1", LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(report.getTotalHours()).isEqualTo(0.0);
            assertThat(report.getAverageHoursPerDay()).isEqualTo(0.0);
        }
    }

    // ===========================
    // isEmployeeCurrentlyWorking
    // ===========================

    @Nested
    @DisplayName("isEmployeeCurrentlyWorking")
    class IsEmployeeCurrentlyWorking {

        @Test
        @DisplayName("returns true when active session exists")
        void returnsTrueWhenActive() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));

            assertThat(workingSessionService.isEmployeeCurrentlyWorking("emp-1")).isTrue();
        }

        @Test
        @DisplayName("returns false when no active session")
        void returnsFalseWhenNotActive() {
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of());

            assertThat(workingSessionService.isEmployeeCurrentlyWorking("emp-1")).isFalse();
        }
    }

    // ===========================
    // getCurrentSession
    // ===========================

    @Nested
    @DisplayName("getCurrentSession")
    class GetCurrentSession {

        @Test
        @DisplayName("returns mapped response when active session exists")
        void returnsResponse() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of(session));

            assertThat(workingSessionService.getCurrentSession("emp-1")).isNotNull();
        }

        @Test
        @DisplayName("returns null when no active session")
        void returnsNull() {
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of());

            assertThat(workingSessionService.getCurrentSession("emp-1")).isNull();
        }
    }

    // ===========================
    // getEmployeeSessions
    // ===========================

    @Nested
    @DisplayName("getEmployeeSessions")
    class GetEmployeeSessions {

        @Test
        @DisplayName("fetches by date range when dates provided")
        void fetchesByDateRange() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            session.setLoginTime(LocalDateTime.now().minusDays(2));
            LocalDate start = LocalDate.now().minusDays(7);
            LocalDate end = LocalDate.now();
            when(sessionRepository.findByEmployeeIdAndDateBetween("emp-1", start, end))
                    .thenReturn(new java.util.ArrayList<>(List.of(session)));

            List<WorkingSessionResponse> result = workingSessionService.getEmployeeSessions("emp-1", start, end, 0, 10);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("fetches all sessions when no dates provided")
        void fetchesAll() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            session.setLoginTime(LocalDateTime.now().minusDays(2));
            when(sessionRepository.findByEmployeeId("emp-1")).thenReturn(new java.util.ArrayList<>(List.of(session)));

            List<WorkingSessionResponse> result = workingSessionService.getEmployeeSessions("emp-1", null, null, 0, 10);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list when page is beyond total sessions")
        void returnsEmptyWhenOutOfBounds() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            session.setLoginTime(LocalDateTime.now());
            when(sessionRepository.findByEmployeeId("emp-1")).thenReturn(new java.util.ArrayList<>(List.of(session)));

            List<WorkingSessionResponse> result = workingSessionService.getEmployeeSessions("emp-1", null, null, 5, 10);

            assertThat(result).isEmpty();
        }
    }

    // ===========================
    // getStoreSessions
    // ===========================

    @Nested
    @DisplayName("getStoreSessions")
    class GetStoreSessions {

        @Test
        @DisplayName("returns sessions for store in date range")
        void returnsStoreSessions() {
            WorkingSession session = buildSession("s1", "emp-1", false);
            LocalDate start = LocalDate.now().minusDays(7);
            LocalDate end = LocalDate.now();
            when(sessionRepository.findByStoreIdAndDateBetween("store-1", start, end))
                    .thenReturn(List.of(session));

            List<WorkingSessionResponse> result = workingSessionService.getStoreSessions("store-1", start, end);

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // getActiveSessionsForStore
    // ===========================

    @Nested
    @DisplayName("getActiveSessionsForStore")
    class GetActiveSessionsForStore {

        @Test
        @DisplayName("returns active sessions for store")
        void returnsActive() {
            WorkingSession session = buildSession("s1", "emp-1", true);
            when(sessionRepository.findActiveSessionsByStoreId("store-1")).thenReturn(List.of(session));

            List<WorkingSessionResponse> result = workingSessionService.getActiveSessionsForStore("store-1");

            assertThat(result).hasSize(1);
        }
    }

    // ===========================
    // getCurrentWorkingDuration
    // ===========================

    @Nested
    @DisplayName("getCurrentWorkingDuration")
    class GetCurrentWorkingDuration {

        @Test
        @DisplayName("returns ZERO when no active session")
        void returnsZeroWhenNoSession() {
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1"))
                    .thenReturn(List.of());

            assertThat(workingSessionService.getCurrentWorkingDuration("emp-1"))
                    .isEqualTo(java.time.Duration.ZERO);
        }
    }

    // ===========================
    // clockInWithPin
    // ===========================

    @Nested
    @DisplayName("clockInWithPin")
    class ClockInWithPin {

        @Test
        @DisplayName("throws when employee not found")
        void throwsWhenEmployeeNotFound() {
            when(userRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("missing", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when user is not an employee")
        void throwsWhenNotEmployee() {
            User customer = new User();
            customer.setId("cust-1");
            customer.setType(UserType.CUSTOMER);
            when(userRepository.findById("cust-1")).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("cust-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not an employee");
        }

        @Test
        @DisplayName("throws when employee has no PIN set")
        void throwsWhenNoPinSet() {
            User emp = buildEmployee("emp-1", UserType.STAFF);
            emp.getEmployeeDetails().setEmployeePINHash(null);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(emp));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("PIN not set");
        }

        @Test
        @DisplayName("throws when PIN is invalid")
        void throwsWhenInvalidPin() {
            User emp = buildEmployee("emp-1", UserType.STAFF);
            // Set a real BCrypt hash for "99999" — wrong PIN will be "12345"
            String hash = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("99999");
            emp.getEmployeeDetails().setEmployeePINHash(hash);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(emp));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid PIN");
        }

        @Test
        @DisplayName("throws when employee already has active session")
        void throwsWhenAlreadyActive() {
            User emp = buildEmployee("emp-1", UserType.STAFF);
            String hash = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("12345");
            emp.getEmployeeDetails().setEmployeePINHash(hash);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(emp));

            WorkingSession active = buildSession("s1", "emp-1", true);
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of(active));

            assertThatThrownBy(() -> workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already has an active session");
        }

        @Test
        @DisplayName("successfully clocks in with valid PIN and no existing session")
        void successfulClockIn() {
            User emp = buildEmployee("emp-1", UserType.STAFF);
            String hash = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("12345");
            emp.getEmployeeDetails().setEmployeePINHash(hash);
            when(userRepository.findById("emp-1")).thenReturn(Optional.of(emp));
            when(sessionRepository.findAllActiveSessionsByEmployeeIdSorted("emp-1")).thenReturn(List.of());
            when(sessionRepository.findActiveSessionByEmployeeId("emp-1")).thenReturn(Optional.empty());
            when(shiftValidationService.validateSessionStart(anyString(), anyString(), any()))
                    .thenReturn(ShiftValidationResult.success("OK"));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WorkingSession result = workingSessionService.clockInWithPin("emp-1", "12345", "store-1", "mgr-1");

            assertThat(result).isNotNull();
            assertThat(result.getNotes()).contains("mgr-1");
        }
    }

    // ===========================
    // closeAllActiveSessions
    // ===========================

    @Nested
    @DisplayName("closeAllActiveSessions")
    class CloseAllActiveSessions {

        @Test
        @DisplayName("does nothing when no active sessions")
        void noopWhenNoActiveSessions() {
            WorkingSession inactive = buildSession("s1", "emp-1", false);
            when(sessionRepository.findAll()).thenReturn(List.of(inactive));

            assertThatCode(() -> workingSessionService.closeAllActiveSessions())
                    .doesNotThrowAnyException();
            verify(sessionRepository, never()).save(any());
        }

        @Test
        @DisplayName("auto-closes active sessions on shutdown")
        void closesActiveSessions() {
            WorkingSession active = buildSession("s1", "emp-1", true);
            active.setLoginTime(LocalDateTime.now().minusHours(2));
            when(sessionRepository.findAll()).thenReturn(List.of(active));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            workingSessionService.closeAllActiveSessions();

            verify(sessionRepository).save(argThat(s -> s.getStatus() == WorkingSessionStatus.AUTO_CLOSED));
        }
    }
}
