package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.Shift;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.core.user.service.ShiftService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Shift management — 10 canonical endpoints at /api/shifts.
 * Replaces: /api/shifts/employee/{id}, /api/shifts/store, /api/shifts/store/coverage,
 *           /api/shifts/store/{id}/week, /api/shifts/bulk-create, /api/shifts/copy-previous-week.
 */
@RestController
@RequestMapping("/api/shifts")
@Tag(name = "Shift Management", description = "Employee shift scheduling")
@SecurityRequirement(name = "bearerAuth")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    /**
     * GET /api/shifts?storeId=&employeeId=&week=&date=&view=coverage
     * Replaces: /api/shifts/store, /api/shifts/employee/{id}, /api/shifts/store/{id}/week,
     *           /api/shifts/store/coverage
     */
    @GetMapping
    @Operation(summary = "List shifts (query: storeId, employeeId, week, date, view=coverage)")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> getShifts(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String view,
            HttpServletRequest request) {

        String resolvedStore = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);

        if ("coverage".equals(view) && resolvedStore != null) {
            LocalDate coverageDate = date != null ? date : LocalDate.now();
            Map<String, Object> coverage = shiftService.getShiftCoverage(resolvedStore, coverageDate);
            return ResponseEntity.ok(coverage);
        }
        if (employeeId != null && date != null) {
            LocalDate end = date.plusDays(1);
            return ResponseEntity.ok(shiftService.getEmployeeShifts(employeeId, date, end));
        }
        if (employeeId != null) {
            LocalDate start = week != null ? week : LocalDate.now().minusDays(7);
            return ResponseEntity.ok(shiftService.getEmployeeShifts(employeeId, start, start.plusDays(7)));
        }
        if (week != null && resolvedStore != null) {
            return ResponseEntity.ok(shiftService.getWeeklySchedule(resolvedStore, week));
        }
        if (date != null && resolvedStore != null) {
            return ResponseEntity.ok(shiftService.getStoreShifts(resolvedStore, date));
        }
        if (resolvedStore != null) {
            return ResponseEntity.ok(shiftService.getStoreShifts(resolvedStore, LocalDate.now()));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "storeId or employeeId required"));
    }

    @PostMapping
    @Operation(summary = "Create shift")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Shift> createShift(@Valid @RequestBody Shift shift) {
        return ResponseEntity.ok(shiftService.createShift(shift));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk create shifts for weekly schedule")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<Shift>> bulkCreateShifts(@Valid @RequestBody List<Shift> shifts) {
        return ResponseEntity.ok(shiftService.bulkCreateShifts(shifts));
    }

    /**
     * POST /api/shifts/copy-week — copies previous week's schedule
     * (was /api/shifts/copy-previous-week)
     */
    @PostMapping("/copy-week")
    @Operation(summary = "Copy previous week schedule")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<Shift>> copyWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetWeekStart,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        return ResponseEntity.ok(shiftService.copyPreviousWeekSchedule(storeId, targetWeekStart));
    }

    @GetMapping("/{shiftId}")
    @Operation(summary = "Get shift by ID")
    public ResponseEntity<Shift> getShift(@PathVariable String shiftId) {
        return ResponseEntity.ok(shiftService.getShift(shiftId));
    }

    @PatchMapping("/{shiftId}")
    @Operation(summary = "Update shift")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Shift> updateShift(
            @PathVariable String shiftId,
            @Valid @RequestBody Shift shift) {
        shift.setId(shiftId);
        return ResponseEntity.ok(shiftService.updateShift(shift));
    }

    @DeleteMapping("/{shiftId}")
    @Operation(summary = "Cancel shift")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Void> cancelShift(@PathVariable String shiftId) {
        shiftService.cancelShift(shiftId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{shiftId}/confirm")
    @Operation(summary = "Confirm shift attendance")
    @PreAuthorize("#shiftId == @shiftService.getShift(#shiftId).employeeId or hasRole('MANAGER')")
    public ResponseEntity<Shift> confirmShift(@PathVariable String shiftId) {
        return ResponseEntity.ok(shiftService.confirmShift(shiftId));
    }

    @PostMapping("/{shiftId}/start")
    @Operation(summary = "Start shift")
    @PreAuthorize("#shiftId == @shiftService.getShift(#shiftId).employeeId")
    public ResponseEntity<Shift> startShift(@PathVariable String shiftId) {
        return ResponseEntity.ok(shiftService.startShift(shiftId));
    }

    @PostMapping("/{shiftId}/complete")
    @Operation(summary = "Complete shift")
    @PreAuthorize("#shiftId == @shiftService.getShift(#shiftId).employeeId or hasRole('MANAGER')")
    public ResponseEntity<Shift> completeShift(@PathVariable String shiftId) {
        return ResponseEntity.ok(shiftService.completeShift(shiftId));
    }
}
