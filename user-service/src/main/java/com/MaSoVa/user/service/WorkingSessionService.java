package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.shared.enums.WorkingSessionStatus;
import com.MaSoVa.shared.model.Location;
import com.MaSoVa.shared.model.SessionViolation;
import com.MaSoVa.user.dto.WorkingSessionResponse;
import com.MaSoVa.user.dto.WorkingHoursReport;
import com.MaSoVa.user.repository.UserRepository;
import com.MaSoVa.user.repository.WorkingSessionRepository;
import com.MaSoVa.user.service.ShiftValidationService.ShiftValidationResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkingSessionService {

    private static final Logger logger = LoggerFactory.getLogger(WorkingSessionService.class);

    @Autowired
    private WorkingSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShiftValidationService shiftValidationService;

    @Autowired
    private StoreService storeService;

    @Autowired
    private NotificationService notificationService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public WorkingSession startSession(String employeeId, String storeId) {
        return startSessionWithLocation(employeeId, storeId, null);
    }
    
    public WorkingSession startSessionWithLocation(String employeeId, String storeId, Location clockInLocation) {
        LocalDateTime startTime = LocalDateTime.now();

        // Step 1: Handle any existing active sessions
        handleExistingActiveSessions(employeeId, startTime);

        // Step 1.5: Get employee details FIRST to populate employeeName
        User employee = userRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        String employeeName = (employee.getPersonalInfo() != null && employee.getPersonalInfo().getName() != null)
            ? employee.getPersonalInfo().getName()
            : (employee.getPersonalInfo() != null ? employee.getPersonalInfo().getEmail() : "Unknown"); // Fallback to email if name not set

        // Step 2: Validate shift and business rules
        ShiftValidationResult validation = shiftValidationService
            .validateSessionStart(employeeId, storeId, startTime);

        // Step 3: Validate store operational status (only if store exists)
        if (storeId != null && !storeId.trim().isEmpty()) {
            try {
                if (!storeService.validateStoreOperational(storeId)) {
                    throw new RuntimeException("Store is not operational");
                }
            } catch (RuntimeException e) {
                // If store not found, log warning but allow session to continue
                // This handles cases where manager is created manually without proper store setup
                if (e.getMessage().contains("Store not found")) {
                    // Allow login to proceed without store validation
                } else {
                    throw e;
                }
            }
        }

        // Step 4: Create new session WITH employeeName
        WorkingSession session = new WorkingSession(employeeId, storeId, startTime);
        session.setEmployeeName(employeeName);  // Set employee name immediately

        if (validation.getShift() != null) {
            session.setShiftId(validation.getShift().getId());
        }

        if (clockInLocation != null) {
            session.setClockInLocation(clockInLocation);
            validateClockInLocation(session, storeId, clockInLocation);
        }

        if ("WARNING".equals(validation.getSeverity())) {
            session.addViolation(new SessionViolation("UNSCHEDULED_SHIFT", validation.getMessage()));
        }

        return sessionRepository.save(session);
    }

    /**
     * Clock in employee with PIN verification (manager initiated)
     */
    public WorkingSession clockInWithPin(String employeeId, String pin, String storeId, String managerId) {
        // Validate employee exists and has PIN set
        User employee = userRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        // Validate employee is actually an employee type
        if (!employee.isEmployee()) {
            throw new IllegalArgumentException("User is not an employee");
        }

        // Validate employee has PIN set
        if (employee.getEmployeeDetails() == null ||
            employee.getEmployeeDetails().getEmployeePINHash() == null) {
            throw new IllegalArgumentException("Employee PIN not set. Please contact administrator.");
        }

        // Verify PIN
        if (!passwordEncoder.matches(pin, employee.getEmployeeDetails().getEmployeePINHash())) {
            throw new IllegalArgumentException("Invalid PIN");
        }

        // Check if employee already has active session
        Optional<WorkingSession> existingSession = getSafeActiveSession(employeeId);
        if (existingSession.isPresent()) {
            throw new IllegalArgumentException("Employee already has an active session");
        }

        // CRITICAL FIX: Use employee's storeId from their profile, not from request header
        String employeeStoreId = employee.getEmployeeDetails().getStoreId();
        if (employeeStoreId == null || employeeStoreId.isEmpty()) {
            employeeStoreId = storeId; // Fallback to header storeId if employee has no store
        }

        // Start session with employee's actual storeId
        // employeeName is now set inside startSession, so no need to set it again
        WorkingSession session = startSession(employeeId, employeeStoreId);

        // Add note that manager initiated clock-in
        session.setNotes("Clocked in by manager: " + managerId);

        // Save session with notes (only one additional save for notes)
        return sessionRepository.save(session);
    }

    private void handleExistingActiveSessions(String employeeId, LocalDateTime currentTime) {
        // Get all active sessions sorted by login time (most recent first)
        List<WorkingSession> activeSessions = sessionRepository
            .findAllActiveSessionsByEmployeeIdSorted(employeeId);

        if (activeSessions.isEmpty()) {
            return;
        }

        // Process most recent session
        WorkingSession mostRecent = activeSessions.get(0);

        // Check if it's a reasonable continuation (same day, short gap)
        Duration gap = Duration.between(mostRecent.getLoginTime(), currentTime);

        if (gap.toHours() < 1 && mostRecent.getDate().equals(currentTime.toLocalDate())) {
            // Likely a quick re-login, continue existing session
            // But still close any duplicate sessions
            closeOlderDuplicateSessions(activeSessions.subList(1, activeSessions.size()), currentTime);
            return;
        }

        // Close all active sessions (including the most recent one)
        for (WorkingSession existing : activeSessions) {
            Duration sessionGap = Duration.between(existing.getLoginTime(), currentTime);

            // Handle abandoned session
            if (sessionGap.toHours() > 12) {
                // Auto-close very old sessions
                existing.setLogoutTime(existing.getLoginTime().plusHours(8)); // Assume 8-hour day
                existing.setStatus(WorkingSessionStatus.AUTO_CLOSED);
                existing.addViolation(new SessionViolation("AUTO_CLOSED",
                    "Session auto-closed due to extended duration"));
            } else {
                // Recent session, needs manager approval
                existing.setLogoutTime(currentTime.minusMinutes(1));
                existing.setStatus(WorkingSessionStatus.PENDING_APPROVAL);
                existing.addViolation(new SessionViolation("MISSING_LOGOUT",
                    "Previous session not properly closed"));

                // Notify manager (only once for the most recent session)
                if (existing == mostRecent) {
                    notificationService.notifyManager(existing.getStoreId(),
                        "Employee " + employeeId + " session requires approval");
                }
            }

            existing.setActive(false);
            existing.calculateTotalHours();
            sessionRepository.save(existing);
        }
    }

    private void closeOlderDuplicateSessions(List<WorkingSession> duplicateSessions, LocalDateTime currentTime) {
        for (WorkingSession duplicate : duplicateSessions) {
            duplicate.setLogoutTime(currentTime.minusMinutes(1));
            duplicate.setStatus(WorkingSessionStatus.AUTO_CLOSED);
            duplicate.setActive(false);
            duplicate.addViolation(new SessionViolation("DUPLICATE_SESSION",
                "Duplicate active session auto-closed"));
            duplicate.calculateTotalHours();
            sessionRepository.save(duplicate);
        }
    }

    /**
     * Safely retrieves the active session for an employee, handling duplicates.
     * If multiple active sessions exist, closes all but the most recent one.
     */
    private Optional<WorkingSession> getSafeActiveSession(String employeeId) {
        List<WorkingSession> activeSessions = sessionRepository
            .findAllActiveSessionsByEmployeeIdSorted(employeeId);

        if (activeSessions.isEmpty()) {
            return Optional.empty();
        }

        // If there are duplicates, close all but the most recent
        if (activeSessions.size() > 1) {
            closeOlderDuplicateSessions(activeSessions.subList(1, activeSessions.size()), LocalDateTime.now());
        }

        return Optional.of(activeSessions.get(0));
    }
    
    private void validateClockInLocation(WorkingSession session, String storeId, Location clockInLocation) {
        // Get store location and validate proximity
        try {
            var store = storeService.getStore(storeId);
            if (store.getAddress().getLatitude() != null && store.getAddress().getLongitude() != null) {
                Location storeLocation = new Location(
                    store.getAddress().getLatitude(),
                    store.getAddress().getLongitude()
                );

                double distance = clockInLocation.getDistanceFrom(storeLocation);

                // Allow clock in within 100 meters of store
                if (distance > 0.1) { // 0.1 km = 100 meters
                    session.addViolation(new SessionViolation("REMOTE_CLOCKIN",
                        "Clock in location is " + String.format("%.2f", distance) + " km from store"));
                }
            }
        } catch (RuntimeException e) {
            // If store not found, skip location validation
            // This allows managers created manually without proper store setup to log in
        }
    }
    
    public WorkingSession endSession(String employeeId) {
        return endSessionWithLocation(employeeId, null);
    }
    
    public WorkingSession endSessionWithLocation(String employeeId, Location clockOutLocation) {
        WorkingSession session = getSafeActiveSession(employeeId)
                .orElseThrow(() -> new RuntimeException("No active session found"));
        
        LocalDateTime endTime = LocalDateTime.now();
        
        // Validate shift timing
        shiftValidationService.validateSessionEnd(employeeId, endTime);
        
        session.setLogoutTime(endTime);
        session.setActive(false);
        
        if (clockOutLocation != null) {
            session.setClockOutLocation(clockOutLocation);
        }
        
        session.calculateTotalHours();
        
        // Validate session business rules
        validateSessionCompletion(session);
        
        // Determine final status
        if (session.requiresManagerApproval()) {
            session.setStatus(WorkingSessionStatus.PENDING_APPROVAL);
            notificationService.notifyManager(session.getStoreId(), 
                "Session requires approval for employee: " + employeeId);
        } else {
            session.setStatus(WorkingSessionStatus.COMPLETED);
        }
        
        return sessionRepository.save(session);
    }
    
    private void validateSessionCompletion(WorkingSession session) {
        Duration sessionLength = session.getWorkingDuration();
        
        // Validate session length
        if (sessionLength.toHours() > 12) {
            session.addViolation(new SessionViolation("EXCESSIVE_HOURS", 
                "Session exceeds 12 hours: " + sessionLength.toHours()));
        }
        
        if (sessionLength.toMinutes() < 30) {
            session.addViolation(new SessionViolation("TOO_SHORT", 
                "Session less than 30 minutes: " + sessionLength.toMinutes()));
        }
        
        // Validate break compliance for long shifts
        if (sessionLength.toHours() > 6 && session.getBreakDurationMinutes() < 30) {
            session.addViolation(new SessionViolation("INSUFFICIENT_BREAKS", 
                "Long shift requires minimum 30 minutes break"));
        }
    }
    
    public WorkingSession addBreakTime(String employeeId, long breakMinutes) {
        WorkingSession session = getSafeActiveSession(employeeId)
                .orElseThrow(() -> new RuntimeException("No active session found"));
        
        // Validate break request
        validateBreakRequest(session, breakMinutes);
        
        session.setBreakDurationMinutes(session.getBreakDurationMinutes() + breakMinutes);
        return sessionRepository.save(session);
    }
    
    private void validateBreakRequest(WorkingSession session, long breakMinutes) {
        LocalDateTime now = LocalDateTime.now();
        Duration totalDuration = Duration.between(session.getLoginTime(), now);
        long currentBreaks = session.getBreakDurationMinutes();

        // Phase 3: Enhanced break validation rules

        // Rule 1: Maximum single break cannot exceed 120 minutes (2 hours)
        if (breakMinutes > 120) {
            throw new RuntimeException("Single break cannot exceed 120 minutes (2 hours)");
        }

        // Rule 2: Total breaks cannot exceed 25% of total duration
        long maxAllowedBreaks = totalDuration.toMinutes() / 4;
        if (currentBreaks + breakMinutes > maxAllowedBreaks) {
            throw new RuntimeException("Total break time cannot exceed 25% of shift duration. Maximum allowed: " + maxAllowedBreaks + " minutes");
        }

        // Rule 3: Minimum work time before first break (2 hours)
        if (currentBreaks == 0 && totalDuration.toMinutes() < 120) {
            throw new RuntimeException("Must work minimum 2 hours before taking first break");
        }

        // Rule 4: For shifts >6 hours, minimum 30 minutes break required (compliance)
        if (totalDuration.toHours() > 6 && currentBreaks + breakMinutes < 30) {
            // This is a warning, not blocking - just add note
            session.addViolation(new SessionViolation("INSUFFICIENT_BREAKS_WARNING",
                "Shifts over 6 hours require minimum 30 minutes break for compliance"));
        }
    }
    
    public WorkingSessionResponse getCurrentSession(String employeeId) {
        return getSafeActiveSession(employeeId)
                .map(this::mapToResponse)
                .orElse(null);
    }
    
    public List<WorkingSessionResponse> getEmployeeSessions(String employeeId, LocalDate startDate, LocalDate endDate, int page, int size) {
        List<WorkingSession> sessions;

        if (startDate != null && endDate != null) {
            sessions = sessionRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
        } else {
            sessions = sessionRepository.findByEmployeeId(employeeId);
        }

        // Sort by date descending (most recent first)
        sessions.sort((a, b) -> {
            LocalDateTime aDate = a.getLoginTime() != null ? a.getLoginTime() : LocalDateTime.MIN;
            LocalDateTime bDate = b.getLoginTime() != null ? b.getLoginTime() : LocalDateTime.MIN;
            return bDate.compareTo(aDate);
        });

        // Apply pagination
        int start = page * size;
        int end = Math.min(start + size, sessions.size());

        if (start >= sessions.size()) {
            return List.of();
        }

        return sessions.subList(start, end)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
    public List<WorkingSessionResponse> getStoreSessions(String storeId, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching sessions for store: {} between {} and {}", storeId, startDate, endDate);
        List<WorkingSession> sessions = sessionRepository.findByStoreIdAndDateBetween(storeId, startDate, endDate);
        logger.info("Found {} sessions for store {}", sessions.size(), storeId);

        return sessions.stream()
                .map(this::mapToResponse)
                .toList();
    }
    
    public WorkingHoursReport generateEmployeeReport(String employeeId, LocalDate startDate, LocalDate endDate) {
        List<WorkingSession> sessions = sessionRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
        
        double totalHours = sessions.stream()
                .filter(s -> s.getTotalHours() != null && s.getStatus() != WorkingSessionStatus.REJECTED)
                .mapToDouble(WorkingSession::getTotalHours)
                .sum();
        
        long totalDays = sessions.stream()
                .filter(s -> s.getTotalHours() != null && s.getStatus() != WorkingSessionStatus.REJECTED)
                .count();
        
        double averageHours = totalDays > 0 ? totalHours / totalDays : 0;
        
        Map<LocalDate, Double> dailyHours = sessions.stream()
                .filter(s -> s.getTotalHours() != null && s.getStatus() != WorkingSessionStatus.REJECTED)
                .collect(Collectors.toMap(
                    WorkingSession::getDate,
                    WorkingSession::getTotalHours,
                    (a, b) -> a + b
                ));
        
        WorkingHoursReport report = new WorkingHoursReport();
        report.setEmployeeId(employeeId);
        report.setStartDate(startDate);
        report.setEndDate(endDate);
        report.setTotalHours(totalHours);
        report.setTotalDays((int) totalDays);
        report.setAverageHoursPerDay(averageHours);
        report.setDailyHours(dailyHours);
        
        return report;
    }
    
    public List<WorkingSessionResponse> getActiveSessionsForStore(String storeId) {
        return sessionRepository.findActiveSessionsByStoreId(storeId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
    public boolean isEmployeeCurrentlyWorking(String employeeId) {
        return getSafeActiveSession(employeeId).isPresent();
    }
    
    public Duration getCurrentWorkingDuration(String employeeId) {
        return getSafeActiveSession(employeeId)
                .map(WorkingSession::getWorkingDuration)
                .orElse(Duration.ZERO);
    }

    public void approveSession(String sessionId, String managerId) {
        WorkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(WorkingSessionStatus.APPROVED);
        session.setApprovedBy(managerId);
        session.setApprovalTime(LocalDateTime.now());
        session.setRequiresApproval(false);
        
        sessionRepository.save(session);
    }

    public void rejectSession(String sessionId, String managerId, String reason) {
        WorkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(WorkingSessionStatus.REJECTED);
        session.setApprovedBy(managerId);
        session.setApprovalTime(LocalDateTime.now());
        session.addViolation(new SessionViolation("MANAGER_REJECTION", reason));
        
        sessionRepository.save(session);
    }
    
    /**
     * Phase 1: Close all active sessions on service shutdown
     * Called by shutdown hook in UserServiceApplication
     */
    public void closeAllActiveSessions() {
        LocalDateTime shutdownTime = LocalDateTime.now();

        // Find all active sessions across all stores
        List<WorkingSession> activeSessions = sessionRepository.findAll()
            .stream()
            .filter(WorkingSession::isActive)
            .toList();

        if (activeSessions.isEmpty()) {
            return;
        }

        // Auto-close each active session
        for (WorkingSession session : activeSessions) {
            // Set logout time to shutdown time
            session.setLogoutTime(shutdownTime);

            // Mark as auto-closed
            session.setStatus(WorkingSessionStatus.AUTO_CLOSED);
            session.setActive(false);

            // Add violation for tracking
            session.addViolation(new SessionViolation(
                "AUTO_CLOSED_ON_SHUTDOWN",
                "Session auto-closed when services were stopped at " + shutdownTime
            ));

            // Calculate total hours worked
            session.calculateTotalHours();

            // Mark as requiring manager approval for review
            session.setRequiresApproval(true);

            // Save updated session
            sessionRepository.save(session);
        }

        System.out.println("[WorkingSession] Auto-closed " + activeSessions.size() +
            " active sessions on service shutdown");
    }

    private WorkingSessionResponse mapToResponse(WorkingSession session) {
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

        // Populate employee name and role
        // First try to get from cached session field, then fallback to User entity lookup
        if (session.getEmployeeName() != null && !session.getEmployeeName().isEmpty()) {
            response.setEmployeeName(session.getEmployeeName());
        }

        try {
            User employee = userRepository.findById(session.getEmployeeId()).orElse(null);
            if (employee != null && employee.getPersonalInfo() != null) {
                // Use employee name from User if not in session cache
                if (response.getEmployeeName() == null) {
                    response.setEmployeeName(employee.getPersonalInfo().getName());
                }
                if (employee.getEmployeeDetails() != null) {
                    response.setRole(employee.getEmployeeDetails().getRole());
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch employee details for session {}: {}", session.getId(), e.getMessage());
        }

        if (session.isActive()) {
            response.setCurrentWorkingDuration(session.getWorkingDuration());

            // Phase 3: Calculate and set enhanced duration fields
            LocalDateTime now = LocalDateTime.now();
            Duration totalDuration = Duration.between(session.getLoginTime(), now);
            Duration workingDuration = session.getWorkingDuration();

            response.setCurrentDurationMinutes(totalDuration.toMinutes());
            response.setWorkingDurationMinutes(workingDuration.toMinutes());
        }

        return response;
    }
}