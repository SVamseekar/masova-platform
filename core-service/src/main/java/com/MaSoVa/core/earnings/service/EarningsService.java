package com.MaSoVa.core.earnings.service;

import com.MaSoVa.core.earnings.dto.SetPayRateRequest;
import com.MaSoVa.core.earnings.dto.WeeklyEarningsResponse;
import com.MaSoVa.core.earnings.entity.StaffEarningsSummaryEntity;
import com.MaSoVa.core.earnings.entity.StaffPayRateEntity;
import com.MaSoVa.core.earnings.repository.StaffEarningsSummaryRepository;
import com.MaSoVa.core.earnings.repository.StaffPayRateRepository;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EarningsService {

    private static final Logger log = LoggerFactory.getLogger(EarningsService.class);

    private final StaffEarningsSummaryRepository summaryRepository;
    private final StaffPayRateRepository payRateRepository;
    private final WorkingSessionRepository sessionRepository;

    public EarningsService(
            StaffEarningsSummaryRepository summaryRepository,
            StaffPayRateRepository payRateRepository,
            WorkingSessionRepository sessionRepository) {
        this.summaryRepository = summaryRepository;
        this.payRateRepository = payRateRepository;
        this.sessionRepository = sessionRepository;
    }

    // ── Pay Rate Management ────────────────────────────────────────────────────

    public StaffPayRateEntity setPayRate(SetPayRateRequest request) {
        StaffPayRateEntity rate = StaffPayRateEntity.builder()
            .employeeId(request.getEmployeeId())
            .storeId(request.getStoreId())
            .hourlyRateInr(request.getHourlyRateInr())
            .effectiveFrom(request.getEffectiveFrom())
            .effectiveTo(request.getEffectiveTo())
            .build();
        return payRateRepository.save(rate);
    }

    public Optional<StaffPayRateEntity> getCurrentPayRate(String employeeId) {
        return payRateRepository.findTopByEmployeeIdOrderByEffectiveFromDesc(employeeId);
    }

    // ── Earnings Query ─────────────────────────────────────────────────────────

    public WeeklyEarningsResponse getWeeklyEarnings(String employeeId, LocalDate weekStart) {
        LocalDate ws = (weekStart != null) ? weekStart : currentWeekStart();
        StaffEarningsSummaryEntity summary = summaryRepository
            .findByEmployeeIdAndWeekStart(employeeId, ws)
            .orElseGet(() -> computeWeekSummary(employeeId, ws));

        BigDecimal rate = payRateRepository.findEffectiveRate(employeeId, ws)
            .map(StaffPayRateEntity::getHourlyRateInr)
            .orElse(null);

        return new WeeklyEarningsResponse(summary, rate);
    }

    public List<WeeklyEarningsResponse> getEarningsHistory(String employeeId, int weeks) {
        List<StaffEarningsSummaryEntity> records = summaryRepository
            .findRecentByEmployeeId(employeeId, PageRequest.of(0, weeks));
        return records.stream()
            .map(e -> {
                BigDecimal rate = payRateRepository.findEffectiveRate(employeeId, e.getWeekStart())
                    .map(StaffPayRateEntity::getHourlyRateInr).orElse(null);
                return new WeeklyEarningsResponse(e, rate);
            })
            .collect(Collectors.toList());
    }

    // ── Weekly Job ─────────────────────────────────────────────────────────────

    /**
     * Runs every Sunday at midnight IST (18:30 UTC = UTC+5:30).
     * Computes base pay for the week that just ended for all staff who had sessions.
     */
    @Scheduled(cron = "0 30 18 * * SUN", zone = "UTC")
    @Transactional
    public void runWeeklyEarningsJob() {
        LocalDate lastWeekStart = currentWeekStart().minusWeeks(1);
        log.info("Weekly earnings job started for week {}", lastWeekStart);

        List<WorkingSession> sessions = sessionRepository
            .findSessionsInDateRange(lastWeekStart, lastWeekStart.plusDays(6));

        sessions.stream()
            .map(WorkingSession::getEmployeeId)
            .distinct()
            .forEach(employeeId -> {
                try {
                    StaffEarningsSummaryEntity summary = computeWeekSummary(employeeId, lastWeekStart);
                    summaryRepository.save(summary);
                    log.info("Earnings computed: employeeId={} week={} hours={} base={}",
                        employeeId, lastWeekStart, summary.getHoursWorked(), summary.getBasePayInr());
                } catch (Exception e) {
                    log.warn("Failed to compute earnings for employeeId={} week={}: {}",
                        employeeId, lastWeekStart, e.getMessage());
                }
            });
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    private StaffEarningsSummaryEntity computeWeekSummary(String employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);

        List<WorkingSession> sessions = sessionRepository
            .findByEmployeeIdAndLoginTimeBetween(
                employeeId,
                weekStart.atStartOfDay(),
                weekEnd.plusDays(1).atStartOfDay()
            );

        BigDecimal totalHours = sessions.stream()
            .map(s -> s.getTotalHours() != null ? BigDecimal.valueOf(s.getTotalHours()) : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal hourlyRate = payRateRepository
            .findEffectiveRate(employeeId, weekStart)
            .map(StaffPayRateEntity::getHourlyRateInr)
            .orElse(BigDecimal.ZERO);

        BigDecimal basePay = totalHours.multiply(hourlyRate).setScale(2, RoundingMode.HALF_UP);

        String storeId = sessions.stream()
            .map(WorkingSession::getStoreId)
            .filter(s -> s != null && !s.isEmpty())
            .findFirst()
            .orElse("");

        // Upsert — preserve existing tips_inr if record already exists
        StaffEarningsSummaryEntity summary = summaryRepository
            .findByEmployeeIdAndWeekStart(employeeId, weekStart)
            .orElseGet(() -> StaffEarningsSummaryEntity.builder()
                .employeeId(employeeId)
                .storeId(storeId)
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .tipsInr(BigDecimal.ZERO)
                .build()
            );

        summary.setHoursWorked(totalHours);
        summary.setBasePayInr(basePay);
        return summary;
    }

    private LocalDate currentWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
