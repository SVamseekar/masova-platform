package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.Shift;
import com.MaSoVa.shared.enums.ShiftStatus;
import com.MaSoVa.shared.enums.ShiftType;
import com.MaSoVa.core.user.repository.ShiftRepository;
import com.MaSoVa.core.user.service.NotificationService;
import com.MaSoVa.core.user.service.ShiftService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ShiftService Unit Tests")
class ShiftServiceTest {

    @Mock private ShiftRepository shiftRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private ShiftService shiftService;

    private Shift buildShift(String id, String employeeId, LocalDateTime start, LocalDateTime end) {
        Shift shift = new Shift();
        shift.setId(id);
        shift.setEmployeeId(employeeId);
        shift.setStoreId("store-1");
        shift.setScheduledStart(start);
        shift.setScheduledEnd(end);
        shift.setStatus(ShiftStatus.SCHEDULED);
        shift.setType(ShiftType.REGULAR);
        return shift;
    }

    // ===========================
    // createShift
    // ===========================

    @Nested
    @DisplayName("createShift")
    class CreateShift {

        @Test
        @DisplayName("creates shift when valid")
        void createsValidShift() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            LocalDateTime end = start.plusHours(8);
            Shift shift = buildShift(null, "emp-1", start, end);
            when(shiftRepository.findByEmployeeIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of());
            when(shiftRepository.save(any())).thenAnswer(inv -> {
                Shift s = inv.getArgument(0);
                s.setId("s1");
                return s;
            });

            Shift result = shiftService.createShift(shift);

            assertThat(result.getId()).isEqualTo("s1");
        }

        @Test
        @DisplayName("throws when end time is before start time")
        void throwsWhenEndBeforeStart() {
            LocalDateTime start = LocalDateTime.now().plusHours(2);
            LocalDateTime end = start.minusHours(1);
            Shift shift = buildShift(null, "emp-1", start, end);

            assertThatThrownBy(() -> shiftService.createShift(shift))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("end time must be after start time");
        }

        @Test
        @DisplayName("throws when shift duration exceeds 12 hours")
        void throwsWhenShiftTooLong() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            LocalDateTime end = start.plusHours(13);
            Shift shift = buildShift(null, "emp-1", start, end);

            assertThatThrownBy(() -> shiftService.createShift(shift))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("12 hours");
        }

        @Test
        @DisplayName("throws when employee has overlapping shifts")
        void throwsOnOverlappingShift() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            LocalDateTime end = start.plusHours(8);
            Shift newShift = buildShift(null, "emp-1", start, end);
            Shift existing = buildShift("existing", "emp-1", start.plusHours(2), end.plusHours(2));

            when(shiftRepository.findByEmployeeIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of(existing));

            assertThatThrownBy(() -> shiftService.createShift(newShift))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("overlapping");
        }
    }

    // ===========================
    // updateShift
    // ===========================

    @Nested
    @DisplayName("updateShift")
    class UpdateShift {

        @Test
        @DisplayName("throws when shift is IN_PROGRESS")
        void throwsWhenInProgress() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            Shift existing = buildShift("s1", "emp-1", start, start.plusHours(8));
            existing.setStatus(ShiftStatus.IN_PROGRESS);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(existing));

            Shift update = buildShift("s1", "emp-1", start, start.plusHours(8));
            assertThatThrownBy(() -> shiftService.updateShift(update))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("started or completed");
        }

        @Test
        @DisplayName("throws when shift is COMPLETED")
        void throwsWhenCompleted() {
            LocalDateTime start = LocalDateTime.now().minusHours(9);
            Shift existing = buildShift("s1", "emp-1", start, start.plusHours(8));
            existing.setStatus(ShiftStatus.COMPLETED);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(existing));

            Shift update = buildShift("s1", "emp-1", start, start.plusHours(8));
            assertThatThrownBy(() -> shiftService.updateShift(update))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("started or completed");
        }
    }

    // ===========================
    // cancelShift
    // ===========================

    @Nested
    @DisplayName("cancelShift")
    class CancelShift {

        @Test
        @DisplayName("throws when shift is IN_PROGRESS")
        void throwsWhenInProgress() {
            LocalDateTime start = LocalDateTime.now().minusHours(2);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            shift.setStatus(ShiftStatus.IN_PROGRESS);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));

            assertThatThrownBy(() -> shiftService.cancelShift("s1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("in progress");
        }

        @Test
        @DisplayName("cancels SCHEDULED shift and notifies employee")
        void cancelScheduledShift() {
            LocalDateTime start = LocalDateTime.now().plusHours(2);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));
            when(shiftRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            shiftService.cancelShift("s1");

            verify(shiftRepository).save(argThat(s -> s.getStatus() == ShiftStatus.CANCELLED));
            verify(notificationService).notifyEmployee(eq("emp-1"), anyString());
        }
    }

    // ===========================
    // confirmShift / startShift / completeShift
    // ===========================

    @Nested
    @DisplayName("confirmShift")
    class ConfirmShift {

        @Test
        @DisplayName("throws when shift is not in SCHEDULED status")
        void throwsWhenNotScheduled() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            shift.setStatus(ShiftStatus.CONFIRMED);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));

            assertThatThrownBy(() -> shiftService.confirmShift("s1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("scheduled shifts");
        }

        @Test
        @DisplayName("sets status to CONFIRMED")
        void setsConfirmed() {
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));
            when(shiftRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Shift result = shiftService.confirmShift("s1");

            assertThat(result.getStatus()).isEqualTo(ShiftStatus.CONFIRMED);
        }
    }

    @Nested
    @DisplayName("completeShift")
    class CompleteShift {

        @Test
        @DisplayName("throws when shift is not IN_PROGRESS")
        void throwsWhenNotInProgress() {
            LocalDateTime start = LocalDateTime.now().minusHours(2);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            shift.setStatus(ShiftStatus.CONFIRMED);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));

            assertThatThrownBy(() -> shiftService.completeShift("s1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("in progress");
        }

        @Test
        @DisplayName("sets status to COMPLETED with actual end time")
        void setsCompleted() {
            LocalDateTime start = LocalDateTime.now().minusHours(8);
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            shift.setStatus(ShiftStatus.IN_PROGRESS);
            when(shiftRepository.findById("s1")).thenReturn(Optional.of(shift));
            when(shiftRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Shift result = shiftService.completeShift("s1");

            assertThat(result.getStatus()).isEqualTo(ShiftStatus.COMPLETED);
            assertThat(result.getActualEnd()).isNotNull();
        }
    }

    // ===========================
    // getShiftCoverage
    // ===========================

    @Nested
    @DisplayName("getShiftCoverage")
    class GetShiftCoverage {

        @Test
        @DisplayName("returns 0% coverage when no shifts")
        void returnsZeroWhenNoShifts() {
            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of());

            Map<String, Object> result = shiftService.getShiftCoverage("store-1", LocalDate.now());

            assertThat(result.get("totalShifts")).isEqualTo(0);
            assertThat(result.get("coveragePercentage")).isEqualTo(0.0);
        }

        @Test
        @DisplayName("calculates correct coverage percentage")
        void calculatesCoveragePercentage() {
            LocalDateTime start = LocalDateTime.now();
            Shift confirmed = buildShift("s1", "emp-1", start, start.plusHours(8));
            confirmed.setStatus(ShiftStatus.CONFIRMED);
            Shift missed = buildShift("s2", "emp-2", start, start.plusHours(8));
            missed.setStatus(ShiftStatus.MISSED);

            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of(confirmed, missed));

            Map<String, Object> result = shiftService.getShiftCoverage("store-1", LocalDate.now());

            assertThat(result.get("totalShifts")).isEqualTo(2);
            assertThat(result.get("confirmedShifts")).isEqualTo(1L);
            assertThat(result.get("missedShifts")).isEqualTo(1L);
            assertThat((double) result.get("coveragePercentage")).isEqualTo(50.0);
        }
    }

    // ===========================
    // copyPreviousWeekSchedule
    // ===========================

    @Nested
    @DisplayName("copyPreviousWeekSchedule")
    class CopyPreviousWeekSchedule {

        @Test
        @DisplayName("throws when previous week has no shifts")
        void throwsWhenNoPreviousShifts() {
            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of());

            assertThatThrownBy(() -> shiftService.copyPreviousWeekSchedule("store-1", LocalDate.now()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("No shifts found for previous week");
        }

        @Test
        @DisplayName("throws when target week already has shifts")
        void throwsWhenTargetWeekHasShifts() {
            LocalDateTime start = LocalDateTime.now();
            Shift existing = buildShift("s1", "emp-1", start, start.plusHours(8));

            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of(existing));

            assertThatThrownBy(() -> shiftService.copyPreviousWeekSchedule("store-1", LocalDate.now()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("already has scheduled shifts");
        }
    }

    // ===========================
    // weeklyScheduleExists
    // ===========================

    @Nested
    @DisplayName("weeklyScheduleExists")
    class WeeklyScheduleExists {

        @Test
        @DisplayName("returns true when shifts exist for the week")
        void returnsTrueWhenShiftsExist() {
            LocalDateTime start = LocalDateTime.now();
            Shift shift = buildShift("s1", "emp-1", start, start.plusHours(8));
            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of(shift));

            assertThat(shiftService.weeklyScheduleExists("store-1", LocalDate.now())).isTrue();
        }

        @Test
        @DisplayName("returns false when no shifts exist for the week")
        void returnsFalseWhenNoShifts() {
            when(shiftRepository.findByStoreIdAndScheduledStartBetween(any(), any(), any()))
                    .thenReturn(List.of());

            assertThat(shiftService.weeklyScheduleExists("store-1", LocalDate.now())).isFalse();
        }
    }
}
