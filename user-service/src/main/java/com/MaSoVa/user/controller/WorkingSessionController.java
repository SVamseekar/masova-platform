package com.MaSoVa.user.controller;

import com.MaSoVa.shared.model.Location;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.user.dto.WorkingSessionResponse;
import com.MaSoVa.user.dto.WorkingHoursReport;
import com.MaSoVa.user.service.WorkingSessionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/sessions")
@Tag(name = "Working Sessions", description = "Employee working hours and session management")
@SecurityRequirement(name = "bearerAuth")
public class WorkingSessionController {
    
    @Autowired
    private WorkingSessionService sessionService;

    @PostMapping("/start")
    @Operation(summary = "Start working session")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> startSession(
            @RequestHeader("X-User-Id") String employeeId,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        var session = sessionService.startSession(employeeId, storeId);
        return ResponseEntity.ok(mapToResponse(session));
    }
    
    @PostMapping("/end")
    @Operation(summary = "End working session")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> endSession(@RequestHeader("X-User-Id") String employeeId) {
        var session = sessionService.endSession(employeeId);
        return ResponseEntity.ok(mapToResponse(session));
    }
    
    @PostMapping("/{employeeId}/break")
    @Operation(summary = "Add break time to session")
    @PreAuthorize("#employeeId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> addBreakTime(
            @PathVariable String employeeId,
            @RequestBody Map<String, Long> request) {
        Long breakMinutes = request.get("breakMinutes");
        var session = sessionService.addBreakTime(employeeId, breakMinutes);
        return ResponseEntity.ok(mapToResponse(session));
    }
    
    // Add these methods to existing WorkingSessionController

    @PostMapping("/start-with-location")
    @Operation(summary = "Start working session with location")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> startSessionWithLocation(
            @RequestHeader("X-User-Id") String employeeId,
            @RequestBody Map<String, Object> locationData,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        Location clockInLocation = null;
        if (locationData.containsKey("latitude") && locationData.containsKey("longitude")) {
            clockInLocation = new Location(
                (Double) locationData.get("latitude"),
                (Double) locationData.get("longitude")
            );
        }

        var session = sessionService.startSessionWithLocation(employeeId, storeId, clockInLocation);
        return ResponseEntity.ok(mapToResponse(session));
    }

    @PostMapping("/end-with-location")
    @Operation(summary = "End working session with location")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingSessionResponse> endSessionWithLocation(
            @RequestHeader("X-User-Id") String employeeId,
            @RequestBody Map<String, Object> locationData) {
        
        Location clockOutLocation = null;
        if (locationData.containsKey("latitude") && locationData.containsKey("longitude")) {
            clockOutLocation = new Location(
                (Double) locationData.get("latitude"),
                (Double) locationData.get("longitude")
            );
        }
        
        var session = sessionService.endSessionWithLocation(employeeId, clockOutLocation);
        return ResponseEntity.ok(mapToResponse(session));
    }

    @GetMapping("/pending-approval")
    @Operation(summary = "Get sessions pending approval")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getSessionsPendingApproval(
            HttpServletRequest request) {
        // Implementation will be added to service
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{sessionId}/approve")
    @Operation(summary = "Approve working session")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> approveSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String managerId) {
        sessionService.approveSession(sessionId, managerId);
        return ResponseEntity.ok(Map.of("message", "Session approved successfully"));
    }

    @PostMapping("/{sessionId}/reject")
    @Operation(summary = "Reject working session")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> rejectSession(
            @PathVariable String sessionId,
            @RequestHeader("X-User-Id") String managerId,
            @RequestBody Map<String, String> request) {
        String reason = request.get("reason");
        sessionService.rejectSession(sessionId, managerId, reason);
        return ResponseEntity.ok(Map.of("message", "Session rejected"));
    }

    @GetMapping("/current")
    @Operation(summary = "Get current working session")
    public ResponseEntity<WorkingSessionResponse> getCurrentSession(@RequestHeader("X-User-Id") String employeeId) {
        WorkingSessionResponse session = sessionService.getCurrentSession(employeeId);
        return ResponseEntity.ok(session);
    }
    
    @GetMapping("/{employeeId}")
    @Operation(summary = "Get employee working sessions")
    @PreAuthorize("#employeeId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getEmployeeSessions(
            @PathVariable String employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<WorkingSessionResponse> sessions = sessionService.getEmployeeSessions(employeeId, startDate, endDate, page, size);
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/store")
    @Operation(summary = "Get store working sessions")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getStoreSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        // If no dates provided, default to today
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now();
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        List<WorkingSessionResponse> sessions = sessionService.getStoreSessions(storeId, effectiveStartDate, effectiveEndDate);
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/{employeeId}/report")
    @Operation(summary = "Generate working hours report")
    @PreAuthorize("#employeeId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<WorkingHoursReport> getWorkingHoursReport(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        WorkingHoursReport report = sessionService.generateEmployeeReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/store/active")
    @Operation(summary = "Get active sessions for store")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<WorkingSessionResponse>> getActiveStoreSessions(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        List<WorkingSessionResponse> sessions = sessionService.getActiveSessionsForStore(storeId);
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/{employeeId}/status")
    @Operation(summary = "Check if employee is currently working")
    public ResponseEntity<Map<String, Object>> getEmployeeWorkingStatus(@PathVariable String employeeId) {
        boolean isWorking = sessionService.isEmployeeCurrentlyWorking(employeeId);
        Duration currentDuration = sessionService.getCurrentWorkingDuration(employeeId);

        return ResponseEntity.ok(Map.of(
            "isWorking", isWorking,
            "currentWorkingDuration", currentDuration
        ));
    }

    @PostMapping("/clock-in-with-pin")
    @Operation(summary = "Clock in employee with PIN - supports dual authentication for staff")
    public ResponseEntity<?> clockInWithPin(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String employeeId = request.get("employeeId");
        String pin = request.get("pin");
        String authorizedBy = request.get("authorizedBy"); // Manager ID for staff/driver auth
        String storeId = StoreContextUtil.getStoreIdFromHeaders(httpRequest);

        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Store ID is required"));
        }

        if (employeeId == null || pin == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Employee ID and PIN are required"));
        }

        try {
            // If authorizedBy is provided, it's a staff/driver needing manager auth
            // Otherwise, it's a manager clocking themselves in
            String managerId = authorizedBy != null ? authorizedBy : employeeId;

            var session = sessionService.clockInWithPin(employeeId, pin, storeId, managerId);
            return ResponseEntity.ok(Map.of(
                "message", "Employee clocked in successfully",
                "session", mapToResponse(session)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/clock-out-employee")
    @Operation(summary = "Clock out employee (manager initiated)")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> clockOutEmployee(
            @RequestBody Map<String, String> request,
            @RequestHeader("X-User-Id") String managerId) {
        String employeeId = request.get("employeeId");

        if (employeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Employee ID is required"));
        }

        try {
            var session = sessionService.endSession(employeeId);
            return ResponseEntity.ok(Map.of(
                "message", "Employee clocked out successfully",
                "session", mapToResponse(session)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
}