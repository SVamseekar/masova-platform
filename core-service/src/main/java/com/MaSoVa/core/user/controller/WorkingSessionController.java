package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.model.Location;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.core.user.dto.WorkingSessionResponse;
import com.MaSoVa.core.user.service.WorkingSessionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Working sessions — 9 canonical endpoints at /api/sessions.
 * Replaces: /api/users/sessions/* with wrong start/end paths.
 * Canonical paths: POST /api/sessions (start), POST /api/sessions/end (end).
 */
@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Working Sessions", description = "Employee working hours and session management")
@SecurityRequirement(name = "bearerAuth")
public class WorkingSessionController {

    @Autowired
    private WorkingSessionService sessionService;

    /**
     * POST /api/sessions — start session (body: optional location)
     * Replaces: POST /api/users/sessions/start and /api/users/sessions/start-with-location
     */
    @PostMapping
    @Operation(summary = "Start working session (body: optional latitude, longitude)")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> startSession(
            @RequestHeader("X-User-Id") String employeeId,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        if (body != null && body.containsKey("latitude") && body.containsKey("longitude")) {
            Location loc = new Location(
                    toDouble(body.get("latitude")),
                    toDouble(body.get("longitude")));
            return ResponseEntity.ok(mapToResponse(sessionService.startSessionWithLocation(employeeId, storeId, loc)));
        }
        return ResponseEntity.ok(mapToResponse(sessionService.startSession(employeeId, storeId)));
    }

    /**
     * POST /api/sessions/end — end session (body: optional location)
     * Replaces: POST /api/users/sessions/end and /end-with-location
     */
    @PostMapping("/end")
    @Operation(summary = "End working session (body: optional latitude, longitude)")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> endSession(
            @RequestHeader("X-User-Id") String employeeId,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body != null && body.containsKey("latitude") && body.containsKey("longitude")) {
            Location loc = new Location(
                    toDouble(body.get("latitude")),
                    toDouble(body.get("longitude")));
            return ResponseEntity.ok(mapToResponse(sessionService.endSessionWithLocation(employeeId, loc)));
        }
        return ResponseEntity.ok(mapToResponse(sessionService.endSession(employeeId)));
    }

    /**
     * POST /api/sessions/clock-in — clock in employee with PIN
     * (was /api/users/sessions/clock-in-with-pin)
     */
    @PostMapping("/clock-in")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Clock in with PIN")
    public ResponseEntity<?> clockIn(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String employeeId = request.get("employeeId");
        String pin = request.get("pin");
        String authorizedBy = request.get("authorizedBy");
        String storeId = StoreContextUtil.getStoreIdFromHeaders(httpRequest);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Store ID is required"));
        }
        if (employeeId == null || pin == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Employee ID and PIN are required"));
        }
        try {
            String managerId = authorizedBy != null ? authorizedBy : employeeId;
            var session = sessionService.clockInWithPin(employeeId, pin, storeId, managerId);
            return ResponseEntity.ok(Map.of("message", "Employee clocked in successfully", "session", mapToResponse(session)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/sessions/clock-out — manager clocks out employee
     * (was /api/users/sessions/clock-out-employee)
     */
    @PostMapping("/clock-out")
    @Operation(summary = "Clock out employee (manager action)")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> clockOut(
            @RequestBody Map<String, String> request,
            @RequestHeader("X-User-Id") String managerId) {
        String employeeId = request.get("employeeId");
        if (employeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Employee ID is required"));
        }
        try {
            var session = sessionService.endSession(employeeId);
            return ResponseEntity.ok(Map.of("message", "Employee clocked out successfully", "session", mapToResponse(session)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/sessions?storeId=&employeeId=&active=&date=
     * Replaces: /api/users/sessions/store, /api/users/sessions/{id}, /api/users/sessions/store/active
     */
    @GetMapping
    @Operation(summary = "List sessions (query: storeId, employeeId, active, date)")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getSessions(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest request) {
        String resolvedStore = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);

        if (employeeId != null) {
            LocalDate start = date != null ? date : LocalDate.now().minusDays(30);
            LocalDate end = date != null ? date.plusDays(1) : LocalDate.now();
            return ResponseEntity.ok(sessionService.getEmployeeSessions(employeeId, start, end, 0, 50));
        }
        if (Boolean.TRUE.equals(active) && resolvedStore != null) {
            return ResponseEntity.ok(sessionService.getActiveSessionsForStore(resolvedStore));
        }
        if (resolvedStore != null) {
            LocalDate start = date != null ? date : LocalDate.now();
            LocalDate end = date != null ? date.plusDays(1) : LocalDate.now();
            return ResponseEntity.ok(sessionService.getStoreSessions(resolvedStore, start, end));
        }
        return ResponseEntity.badRequest().body(null);
    }

    /**
     * GET /api/sessions/pending — sessions pending approval
     * (was /api/users/sessions/pending-approval)
     */
    @GetMapping("/pending")
    @Operation(summary = "Sessions pending manager approval")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getPendingSessions() {
        // Service implementation returns empty; populated in Phase 3
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{sessionId}/approve")
    @Operation(summary = "Approve session")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> approveSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String managerId) {
        sessionService.approveSession(sessionId, managerId);
        return ResponseEntity.ok(Map.of("message", "Session approved successfully"));
    }

    @PostMapping("/{sessionId}/reject")
    @Operation(summary = "Reject session")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> rejectSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String managerId,
            @RequestBody Map<String, String> request) {
        sessionService.rejectSession(sessionId, managerId, request.get("reason"));
        return ResponseEntity.ok(Map.of("message", "Session rejected"));
    }

    @PostMapping("/{sessionId}/break")
    @Operation(summary = "Add break to session")
    @PreAuthorize("#sessionId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> addBreak(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String employeeId,
            @RequestBody Map<String, Long> request) {
        Long breakMinutes = request.get("breakMinutes");
        return ResponseEntity.ok(mapToResponse(sessionService.addBreakTime(employeeId, breakMinutes)));
    }

    private WorkingSessionResponse mapToResponse(com.MaSoVa.shared.entity.WorkingSession session) {
        WorkingSessionResponse response = new WorkingSessionResponse();
        response.setId(session.getId());
        response.setEmployeeId(session.getEmployeeId());
        response.setStoreId(session.getStoreId());
        response.setDate(session.getDate());
        response.setLoginTime(session.getLoginTime());
        response.setLogoutTime(session.getLogoutTime());
        response.setTotalHours(session.getTotalHours());
        response.setActive(session.isActive());
        response.setBreakDurationMinutes(session.getBreakDurationMinutes());
        response.setNotes(session.getNotes());
        if (session.isActive()) {
            response.setCurrentWorkingDuration(session.getWorkingDuration());
        }
        return response;
    }

    private double toDouble(Object value) {
        if (value instanceof Number) return ((Number) value).doubleValue();
        return Double.parseDouble(value.toString());
    }
}
