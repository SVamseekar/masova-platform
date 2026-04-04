package com.MaSoVa.core.earnings.controller;

import com.MaSoVa.core.earnings.dto.SetPayRateRequest;
import com.MaSoVa.core.earnings.dto.WeeklyEarningsResponse;
import com.MaSoVa.core.earnings.entity.StaffPayRateEntity;
import com.MaSoVa.core.earnings.service.EarningsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
@SecurityRequirement(name = "bearerAuth")
public class EarningsController {

    private final EarningsService earningsService;

    public EarningsController(EarningsService earningsService) {
        this.earningsService = earningsService;
    }

    /**
     * GET /api/staff/earnings/weekly?employeeId={id}&weekStart={date}
     * weekStart defaults to current week Monday if omitted.
     */
    @GetMapping("/earnings/weekly")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER') or #employeeId == authentication.name")
    public ResponseEntity<WeeklyEarningsResponse> getWeeklyEarnings(
            @RequestParam String employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(earningsService.getWeeklyEarnings(employeeId, weekStart));
    }

    /**
     * GET /api/staff/earnings/history?employeeId={id}&weeks=12
     * Returns up to `weeks` recent weekly summaries, newest first.
     */
    @GetMapping("/earnings/history")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER') or #employeeId == authentication.name")
    public ResponseEntity<List<WeeklyEarningsResponse>> getEarningsHistory(
            @RequestParam String employeeId,
            @RequestParam(defaultValue = "12") int weeks) {
        return ResponseEntity.ok(earningsService.getEarningsHistory(employeeId, weeks));
    }

    /**
     * GET /api/staff/pay-rates?employeeId={id}
     * Manager-only: view current pay rate for an employee.
     */
    @GetMapping("/pay-rates")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> getPayRate(@RequestParam String employeeId) {
        return earningsService.getCurrentPayRate(employeeId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/staff/pay-rates
     * Manager-only: set hourly pay rate for an employee.
     */
    @PostMapping("/pay-rates")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<StaffPayRateEntity> setPayRate(@Valid @RequestBody SetPayRateRequest request) {
        return ResponseEntity.ok(earningsService.setPayRate(request));
    }
}
