package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.earnings.dto.SetPayRateRequest;
import com.MaSoVa.core.earnings.dto.WeeklyEarningsResponse;
import com.MaSoVa.core.earnings.entity.StaffEarningsSummaryEntity;
import com.MaSoVa.core.earnings.entity.StaffPayRateEntity;
import com.MaSoVa.core.earnings.repository.StaffEarningsSummaryRepository;
import com.MaSoVa.core.earnings.repository.StaffPayRateRepository;
import com.MaSoVa.core.earnings.service.EarningsService;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("EarningsService Unit Tests")
class EarningsServiceTest {

    @Mock private StaffEarningsSummaryRepository summaryRepository;
    @Mock private StaffPayRateRepository payRateRepository;
    @Mock private WorkingSessionRepository sessionRepository;

    @InjectMocks private EarningsService earningsService;

    @Nested
    @DisplayName("setPayRate")
    class SetPayRate {

        @Test
        @DisplayName("saves and returns pay rate entity")
        void savesPayRate() {
            SetPayRateRequest request = new SetPayRateRequest();
            request.setEmployeeId("emp-1");
            request.setStoreId("store-1");
            request.setHourlyRateInr(new BigDecimal("150.00"));
            request.setEffectiveFrom(LocalDate.now());

            StaffPayRateEntity saved = StaffPayRateEntity.builder()
                    .employeeId("emp-1")
                    .storeId("store-1")
                    .hourlyRateInr(new BigDecimal("150.00"))
                    .effectiveFrom(LocalDate.now())
                    .build();
            when(payRateRepository.save(any())).thenReturn(saved);

            StaffPayRateEntity result = earningsService.setPayRate(request);

            assertThat(result.getEmployeeId()).isEqualTo("emp-1");
            verify(payRateRepository).save(any());
        }
    }

    @Nested
    @DisplayName("getCurrentPayRate")
    class GetCurrentPayRate {

        @Test
        @DisplayName("returns most recent pay rate when found")
        void returnsPayRate() {
            StaffPayRateEntity rate = StaffPayRateEntity.builder()
                    .employeeId("emp-1")
                    .hourlyRateInr(new BigDecimal("200.00"))
                    .effectiveFrom(LocalDate.now())
                    .build();
            when(payRateRepository.findTopByEmployeeIdOrderByEffectiveFromDesc("emp-1"))
                    .thenReturn(Optional.of(rate));

            assertThat(earningsService.getCurrentPayRate("emp-1")).isPresent();
        }

        @Test
        @DisplayName("returns empty when no pay rate set")
        void returnsEmpty() {
            when(payRateRepository.findTopByEmployeeIdOrderByEffectiveFromDesc("emp-1"))
                    .thenReturn(Optional.empty());

            assertThat(earningsService.getCurrentPayRate("emp-1")).isEmpty();
        }
    }

    @Nested
    @DisplayName("getWeeklyEarnings")
    class GetWeeklyEarnings {

        @Test
        @DisplayName("returns existing summary without computing")
        void returnsExistingSummary() {
            LocalDate weekStart = LocalDate.of(2026, 5, 11);
            StaffEarningsSummaryEntity summary = StaffEarningsSummaryEntity.builder()
                    .employeeId("emp-1")
                    .weekStart(weekStart)
                    .hoursWorked(new BigDecimal("40"))
                    .basePayInr(new BigDecimal("8000"))
                    .tipsInr(BigDecimal.ZERO)
                    .build();
            when(summaryRepository.findByEmployeeIdAndWeekStart("emp-1", weekStart))
                    .thenReturn(Optional.of(summary));
            when(payRateRepository.findEffectiveRate("emp-1", weekStart)).thenReturn(Optional.empty());

            WeeklyEarningsResponse result = earningsService.getWeeklyEarnings("emp-1", weekStart);

            assertThat(result).isNotNull();
            verify(summaryRepository, never()).save(any());
        }

        @Test
        @DisplayName("computes and saves summary when none exists")
        void computesWhenNotFound() {
            LocalDate weekStart = LocalDate.of(2026, 5, 11);
            when(summaryRepository.findByEmployeeIdAndWeekStart("emp-1", weekStart))
                    .thenReturn(Optional.empty());
            when(sessionRepository.findByEmployeeIdAndLoginTimeBetween(eq("emp-1"), any(), any()))
                    .thenReturn(List.of());
            when(payRateRepository.findEffectiveRate("emp-1", weekStart)).thenReturn(Optional.empty());

            StaffEarningsSummaryEntity newSummary = StaffEarningsSummaryEntity.builder()
                    .employeeId("emp-1")
                    .weekStart(weekStart)
                    .hoursWorked(BigDecimal.ZERO)
                    .basePayInr(BigDecimal.ZERO)
                    .tipsInr(BigDecimal.ZERO)
                    .build();
            when(summaryRepository.save(any())).thenReturn(newSummary);

            WeeklyEarningsResponse result = earningsService.getWeeklyEarnings("emp-1", weekStart);

            assertThat(result).isNotNull();
            verify(summaryRepository).save(any());
        }

        @Test
        @DisplayName("uses current week when weekStart is null")
        void usesCurrentWeekWhenNull() {
            when(summaryRepository.findByEmployeeIdAndWeekStart(eq("emp-1"), any()))
                    .thenReturn(Optional.empty());
            when(sessionRepository.findByEmployeeIdAndLoginTimeBetween(eq("emp-1"), any(), any()))
                    .thenReturn(List.of());
            when(payRateRepository.findEffectiveRate(eq("emp-1"), any())).thenReturn(Optional.empty());
            when(summaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> earningsService.getWeeklyEarnings("emp-1", null))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("getEarningsHistory")
    class GetEarningsHistory {

        @Test
        @DisplayName("returns mapped list from repository")
        void returnsMappedList() {
            LocalDate weekStart = LocalDate.of(2026, 5, 11);
            StaffEarningsSummaryEntity entity = StaffEarningsSummaryEntity.builder()
                    .employeeId("emp-1")
                    .weekStart(weekStart)
                    .hoursWorked(new BigDecimal("40"))
                    .basePayInr(new BigDecimal("8000"))
                    .tipsInr(BigDecimal.ZERO)
                    .build();
            when(summaryRepository.findRecentByEmployeeId(eq("emp-1"), any())).thenReturn(List.of(entity));
            when(payRateRepository.findEffectiveRate("emp-1", weekStart)).thenReturn(Optional.empty());

            List<WeeklyEarningsResponse> result = earningsService.getEarningsHistory("emp-1", 4);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list when no records")
        void returnsEmptyList() {
            when(summaryRepository.findRecentByEmployeeId(eq("emp-1"), any())).thenReturn(List.of());

            assertThat(earningsService.getEarningsHistory("emp-1", 4)).isEmpty();
        }
    }

    @Nested
    @DisplayName("runWeeklyEarningsJob")
    class RunWeeklyEarningsJob {

        @Test
        @DisplayName("does not throw when no sessions found")
        void doesNotThrowWhenNoSessions() {
            when(sessionRepository.findSessionsInDateRange(any(), any())).thenReturn(List.of());

            assertThatCode(() -> earningsService.runWeeklyEarningsJob())
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("continues on individual employee failure")
        void continuesOnFailure() {
            WorkingSession session = new WorkingSession();
            session.setEmployeeId("emp-1");
            session.setStoreId("store-1");
            when(sessionRepository.findSessionsInDateRange(any(), any())).thenReturn(List.of(session));
            when(sessionRepository.findByEmployeeIdAndLoginTimeBetween(any(), any(), any()))
                    .thenReturn(List.of(session));
            when(summaryRepository.findByEmployeeIdAndWeekStart(any(), any())).thenReturn(Optional.empty());
            when(payRateRepository.findEffectiveRate(any(), any())).thenReturn(Optional.empty());
            when(summaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> earningsService.runWeeklyEarningsJob())
                    .doesNotThrowAnyException();
        }
    }
}
