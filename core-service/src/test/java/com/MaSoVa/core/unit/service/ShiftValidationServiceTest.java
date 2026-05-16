package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.Shift;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.core.user.exception.ShiftViolationException;
import com.MaSoVa.core.user.repository.ShiftRepository;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import com.MaSoVa.core.user.service.ShiftValidationService;
import com.MaSoVa.core.user.service.ShiftValidationService.ShiftValidationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ShiftValidationService Unit Tests")
class ShiftValidationServiceTest {

    @Mock private ShiftRepository shiftRepository;
    @Mock private WorkingSessionRepository sessionRepository;

    @InjectMocks private ShiftValidationService shiftValidationService;

    private Shift buildShift(String employeeId, String storeId, LocalDateTime start, LocalDateTime end) {
        Shift shift = new Shift();
        shift.setEmployeeId(employeeId);
        shift.setStoreId(storeId);
        shift.setScheduledStart(start);
        shift.setScheduledEnd(end);
        return shift;
    }

    @Nested
    @DisplayName("validateSessionStart")
    class ValidateSessionStart {

        @Test
        @DisplayName("returns WARNING when no scheduled shift found")
        void warningWhenNoShift() {
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.empty());

            ShiftValidationResult result = shiftValidationService.validateSessionStart(
                    "emp-1", "store-1", LocalDateTime.now());

            assertThat(result.isValid()).isTrue();
            assertThat(result.getSeverity()).isEqualTo("WARNING");
            assertThat(result.getMessage()).contains("No scheduled shift");
        }

        @Test
        @DisplayName("throws ShiftViolationException when scheduled for different store")
        void throwsWhenDifferentStore() {
            LocalDateTime now = LocalDateTime.now();
            Shift shift = buildShift("emp-1", "store-2", now.minusMinutes(5), now.plusHours(8));
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.of(shift));

            assertThatThrownBy(() -> shiftValidationService.validateSessionStart("emp-1", "store-1", now))
                    .isInstanceOf(ShiftViolationException.class)
                    .hasMessageContaining("different store");
        }

        @Test
        @DisplayName("returns SUCCESS when shift found with matching store and valid timing")
        void successWhenValid() {
            LocalDateTime now = LocalDateTime.now();
            Shift shift = buildShift("emp-1", "store-1", now.minusMinutes(5), now.plusHours(8));
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.of(shift));
            when(sessionRepository.findConflictingSessions(any(), any(), any())).thenReturn(List.of());
            when(sessionRepository.findLastCompletedSession(any(), any())).thenReturn(Optional.empty());

            ShiftValidationResult result = shiftValidationService.validateSessionStart("emp-1", "store-1", now);

            assertThat(result.isValid()).isTrue();
            assertThat(result.getSeverity()).isEqualTo("SUCCESS");
        }

        @Test
        @DisplayName("throws when conflicting session detected")
        void throwsOnConflict() {
            LocalDateTime now = LocalDateTime.now();
            Shift shift = buildShift("emp-1", "store-1", now.minusMinutes(5), now.plusHours(8));
            WorkingSession conflict = new WorkingSession();
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.of(shift));
            when(sessionRepository.findConflictingSessions(any(), any(), any())).thenReturn(List.of(conflict));
            when(sessionRepository.findLastCompletedSession(any(), any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> shiftValidationService.validateSessionStart("emp-1", "store-1", now))
                    .isInstanceOf(ShiftViolationException.class)
                    .hasMessageContaining("Conflicting");
        }

        @Test
        @DisplayName("throws when rest period less than 8 hours")
        void throwsWhenInsufficientRest() {
            LocalDateTime now = LocalDateTime.now();
            Shift shift = buildShift("emp-1", "store-1", now.minusMinutes(5), now.plusHours(8));
            WorkingSession lastSession = new WorkingSession();
            lastSession.setLogoutTime(now.minusHours(6)); // only 6 hours rest
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.of(shift));
            when(sessionRepository.findConflictingSessions(any(), any(), any())).thenReturn(List.of());
            when(sessionRepository.findLastCompletedSession(any(), any())).thenReturn(Optional.of(lastSession));

            assertThatThrownBy(() -> shiftValidationService.validateSessionStart("emp-1", "store-1", now))
                    .isInstanceOf(ShiftViolationException.class)
                    .hasMessageContaining("rest period");
        }
    }

    @Nested
    @DisplayName("validateSessionEnd")
    class ValidateSessionEnd {

        @Test
        @DisplayName("does not throw when no active shift")
        void noopWhenNoShift() {
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.empty());

            assertThatCode(() -> shiftValidationService.validateSessionEnd("emp-1", LocalDateTime.now()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw when ending within shift time")
        void noopWhenOnTime() {
            LocalDateTime now = LocalDateTime.now();
            Shift shift = buildShift("emp-1", "store-1", now.minusHours(7), now.plusMinutes(10));
            when(shiftRepository.findCurrentShiftForEmployee(any(), any())).thenReturn(Optional.of(shift));

            assertThatCode(() -> shiftValidationService.validateSessionEnd("emp-1", now))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("ShiftValidationResult inner class")
    class ShiftValidationResultTests {

        @Test
        @DisplayName("success() creates valid result with SUCCESS severity")
        void successResult() {
            Shift shift = buildShift("emp-1", "store-1", LocalDateTime.now(), LocalDateTime.now().plusHours(8));
            ShiftValidationResult result = ShiftValidationResult.success(shift);
            assertThat(result.isValid()).isTrue();
            assertThat(result.getSeverity()).isEqualTo("SUCCESS");
            assertThat(result.getShift()).isEqualTo(shift);
        }

        @Test
        @DisplayName("warning() creates valid result with WARNING severity")
        void warningResult() {
            ShiftValidationResult result = ShiftValidationResult.warning("No shift");
            assertThat(result.isValid()).isTrue();
            assertThat(result.getSeverity()).isEqualTo("WARNING");
            assertThat(result.getMessage()).isEqualTo("No shift");
        }

        @Test
        @DisplayName("error() creates invalid result with ERROR severity")
        void errorResult() {
            ShiftValidationResult result = ShiftValidationResult.error("Invalid");
            assertThat(result.isValid()).isFalse();
            assertThat(result.getSeverity()).isEqualTo("ERROR");
        }
    }
}
