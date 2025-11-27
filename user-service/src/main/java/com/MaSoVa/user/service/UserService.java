package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.user.dto.LoginRequest;
import com.MaSoVa.user.dto.LoginResponse;
import com.MaSoVa.user.dto.UserCreateRequest;
import com.MaSoVa.user.dto.UserResponse;
import com.MaSoVa.user.repository.UserRepository;
import com.MaSoVa.user.repository.WorkingSessionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private WorkingSessionRepository sessionRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private WorkingSessionService sessionService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${customer.service.url:http://localhost:8082}")
    private String customerServiceUrl;
    
    public LoginResponse registerUser(UserCreateRequest request) {
        validateUserCreation(request);

        User user = new User();
        user.setType(request.getType());

        User.PersonalInfo personalInfo = new User.PersonalInfo();
        personalInfo.setName(request.getName());
        personalInfo.setEmail(request.getEmail());
        personalInfo.setPhone(request.getPhone());
        personalInfo.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        personalInfo.setAddress(request.getAddress());
        user.setPersonalInfo(personalInfo);

        if (user.isEmployee()) {
            User.EmployeeDetails employeeDetails = new User.EmployeeDetails();
            employeeDetails.setStoreId(request.getStoreId());
            employeeDetails.setRole(request.getRole());
            employeeDetails.setPermissions(request.getPermissions());
            employeeDetails.setSchedule(request.getSchedule());
            user.setEmployeeDetails(employeeDetails);
        }

        User savedUser = userRepository.save(user);

        // Create customer profile for CUSTOMER type users
        if (savedUser.getType() == UserType.CUSTOMER) {
            try {
                createCustomerProfile(savedUser);
            } catch (Exception e) {
                logger.error("Failed to create customer profile for user {}: {}", savedUser.getId(), e.getMessage(), e);
                // Don't fail registration if customer profile creation fails
                // Customer profile will be auto-created on first access
            }
        }

        // Generate tokens and auto-login the user
        String storeId = savedUser.isEmployee() ? savedUser.getEmployeeDetails().getStoreId() : null;
        String accessToken = jwtService.generateAccessToken(savedUser.getId(), savedUser.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId());

        // Update last login
        savedUser.setLastLogin(LocalDateTime.now());
        userRepository.save(savedUser);

        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(savedUser));
    }

    private void createCustomerProfile(User user) {
        logger.info("Creating customer profile for user: {}", user.getId());

        Map<String, Object> customerRequest = new HashMap<>();
        customerRequest.put("userId", user.getId());
        customerRequest.put("name", user.getPersonalInfo().getName());
        customerRequest.put("email", user.getPersonalInfo().getEmail());
        customerRequest.put("phone", user.getPersonalInfo().getPhone());
        customerRequest.put("marketingOptIn", false);
        customerRequest.put("smsOptIn", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(customerRequest, headers);

        String url = customerServiceUrl + "/api/customers";
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            logger.info("Customer profile created successfully for user: {}", user.getId());
        } else {
            logger.error("Failed to create customer profile, status: {}", response.getStatusCode());
        }
    }

    public UserResponse createUser(UserCreateRequest request) {
        validateUserCreation(request);

        User user = new User();
        user.setType(request.getType());

        User.PersonalInfo personalInfo = new User.PersonalInfo();
        personalInfo.setName(request.getName());
        personalInfo.setEmail(request.getEmail());
        personalInfo.setPhone(request.getPhone());
        personalInfo.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        personalInfo.setAddress(request.getAddress());
        user.setPersonalInfo(personalInfo);

        if (user.isEmployee()) {
            User.EmployeeDetails employeeDetails = new User.EmployeeDetails();
            employeeDetails.setStoreId(request.getStoreId());
            employeeDetails.setRole(request.getRole());
            employeeDetails.setPermissions(request.getPermissions());
            employeeDetails.setSchedule(request.getSchedule());
            user.setEmployeeDetails(employeeDetails);
        }

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }
    
    public UserResponse createEmployee(UserCreateRequest request) {
        validateEmployeeCreation(request);
        
        User user = new User();
        user.setType(request.getType());
        
        User.PersonalInfo personalInfo = new User.PersonalInfo();
        personalInfo.setName(request.getName());
        personalInfo.setEmail(request.getEmail());
        personalInfo.setPhone(request.getPhone());
        personalInfo.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        personalInfo.setAddress(request.getAddress());
        user.setPersonalInfo(personalInfo);
        
        // Set employee details
        User.EmployeeDetails employeeDetails = new User.EmployeeDetails();
        employeeDetails.setStoreId(request.getStoreId());
        employeeDetails.setRole(request.getRole());
        employeeDetails.setPermissions(request.getPermissions());
        employeeDetails.setSchedule(request.getSchedule());
        user.setEmployeeDetails(employeeDetails);
        
        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }
    
    public LoginResponse authenticate(LoginRequest request) {
        User user = userRepository.findByPersonalInfoEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPersonalInfo().getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        String storeId = user.isEmployee() ? user.getEmployeeDetails().getStoreId() : null;
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        
        // Start working session for employees
        if (user.isEmployee()) {
            try {
                sessionService.startSession(user.getId(), storeId);
            } catch (Exception e) {
                // Log the error but don't fail the login
                logger.error("Failed to start working session for user {}: {}", user.getId(), e.getMessage(), e);
            }
        }
        
        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(user));
    }
    
    public void logout(String userId) {
        User user = getUserById(userId);
        if (user.isEmployee()) {
            try {
                sessionService.endSession(userId);
            } catch (Exception e) {
                // Log the error but don't fail the logout
                logger.error("Failed to end working session for user {}: {}", userId, e.getMessage(), e);
            }
        }
    }
    
    // FIX 1: Proper cache key specification using SpEL
    @Cacheable(value = "users", key = "'user:' + #p0")
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public UserResponse getUserResponseById(String userId) {
        return mapToUserResponse(getUserById(userId));
    }
    
    public List<UserResponse> getUsersByType(UserType type) {
        return userRepository.findByType(type).stream()
                .map(this::mapToUserResponse)
                .toList();
    }
    
    public List<UserResponse> getStoreEmployees(String storeId) {
        return userRepository.findByStoreId(storeId).stream()
                .map(this::mapToUserResponse)
                .toList();
    }
    
    public List<UserResponse> getActiveManagers() {
        return userRepository.findActiveManagersAndAssistants(UserType.MANAGER, UserType.ASSISTANT_MANAGER)
                .stream()
                .map(this::mapToUserResponse)
                .toList();
    }
    
    // FIX 2: Proper cache eviction with explicit key
    @CacheEvict(value = "users", key = "'user:' + #p0")
    public UserResponse updateUser(String userId, UserCreateRequest request) {
        User user = getUserById(userId);
        
        user.getPersonalInfo().setName(request.getName());
        user.getPersonalInfo().setPhone(request.getPhone());
        user.getPersonalInfo().setAddress(request.getAddress());
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.getPersonalInfo().setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        
        if (user.isEmployee() && request.getStoreId() != null) {
            user.getEmployeeDetails().setStoreId(request.getStoreId());
            user.getEmployeeDetails().setRole(request.getRole());
            user.getEmployeeDetails().setPermissions(request.getPermissions());
            user.getEmployeeDetails().setSchedule(request.getSchedule());
        }
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }
    
    @CacheEvict(value = "users", key = "'user:' + #p0")
    public void deactivateUser(String userId) {
        User user = getUserById(userId);
        user.setActive(false);
        userRepository.save(user);
        
        // End any active working session
        if (user.isEmployee()) {
            try {
                sessionService.endSession(userId);
            } catch (Exception e) {
                // Log the error but continue
                logger.error("Failed to end session during deactivation for user {}: {}", userId, e.getMessage(), e);
            }
        }
    }
    
    // FIX 3: Robust permission checking method
    public boolean canUserTakeOrders(String userId) {
        try {
            User user = getUserById(userId);
            
            // Check if user is active
            if (!user.isActive()) {
                return false;
            }
            
            // Check user type permissions
            UserType userType = user.getType();
            boolean hasRolePermission = (userType == UserType.MANAGER || userType == UserType.ASSISTANT_MANAGER);
            
            // Additional validation: If employee, must be assigned to a store
            if (user.isEmployee()) {
                if (user.getEmployeeDetails() == null || 
                    user.getEmployeeDetails().getStoreId() == null || 
                    user.getEmployeeDetails().getStoreId().trim().isEmpty()) {
                    return false;
                }
            }
            
            return hasRolePermission;

        } catch (Exception e) {
            // Log error and return false for safety
            logger.error("Error checking order permissions for user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }
    
    public String refreshAccessToken(String refreshToken) {
        String userId = jwtService.extractUserId(refreshToken);
        if (jwtService.isTokenExpired(refreshToken)) {
            throw new RuntimeException("Refresh token expired");
        }
        
        User user = getUserById(userId);
        String storeId = user.isEmployee() ? user.getEmployeeDetails().getStoreId() : null;
        return jwtService.generateAccessToken(userId, user.getType().name(), storeId);
    }
    
    @CacheEvict(value = "users", key = "'user:' + #p0")
    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = getUserById(userId);
        
        if (!passwordEncoder.matches(currentPassword, user.getPersonalInfo().getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        user.getPersonalInfo().setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    public List<UserResponse> searchUsers(String name, String email, String phone, UserType type, String storeId) {
        List<User> allUsers = userRepository.findAll();
        
        return allUsers.stream()
                .filter(user -> name == null || user.getPersonalInfo().getName().toLowerCase().contains(name.toLowerCase()))
                .filter(user -> email == null || user.getPersonalInfo().getEmail().toLowerCase().contains(email.toLowerCase()))
                .filter(user -> phone == null || user.getPersonalInfo().getPhone().contains(phone))
                .filter(user -> type == null || user.getType() == type)
                .filter(user -> storeId == null || (user.getEmployeeDetails() != null && storeId.equals(user.getEmployeeDetails().getStoreId())))
                .map(this::mapToUserResponse)
                .toList();
    }
    
    public Map<String, Object> getUserStatistics() {
        List<User> allUsers = userRepository.findAll();
        
        Map<UserType, Long> usersByType = allUsers.stream()
                .collect(Collectors.groupingBy(User::getType, Collectors.counting()));
        
        long activeUsers = allUsers.stream()
                .filter(User::isActive)
                .count();
        
        long inactiveUsers = allUsers.size() - activeUsers;
        
        long recentLogins = allUsers.stream()
                .filter(user -> user.getLastLogin() != null && 
                       user.getLastLogin().isAfter(LocalDateTime.now().minusDays(7)))
                .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", allUsers.size());
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("recentLogins", recentLogins);
        stats.put("usersByType", usersByType);
        
        return stats;
    }
    
    private void validateUserCreation(UserCreateRequest request) {
        if (userRepository.existsByPersonalInfoEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        if (userRepository.existsByPersonalInfoPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already exists");
        }
        
        // Validation for employee types
        if (request.getType() != UserType.CUSTOMER && 
            (request.getStoreId() == null || request.getStoreId().trim().isEmpty())) {
            throw new RuntimeException("Store ID required for employees");
        }
    }
    
    private void validateEmployeeCreation(UserCreateRequest request) {
        if (userRepository.existsByPersonalInfoEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        if (userRepository.existsByPersonalInfoPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already exists");
        }
        
        if (request.getStoreId() == null || request.getStoreId().trim().isEmpty()) {
            throw new RuntimeException("Store ID is required for employees");
        }
    }
    
    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setType(user.getType());
        response.setName(user.getPersonalInfo().getName());
        response.setEmail(user.getPersonalInfo().getEmail());
        response.setPhone(user.getPersonalInfo().getPhone());
        response.setAddress(user.getPersonalInfo().getAddress());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());
        response.setActive(user.isActive());
        
        if (user.isEmployee() && user.getEmployeeDetails() != null) {
            response.setStoreId(user.getEmployeeDetails().getStoreId());
            response.setRole(user.getEmployeeDetails().getRole());
            response.setPermissions(user.getEmployeeDetails().getPermissions());
        }
        
        return response;
    }

    // Analytics methods
    public List<UserResponse> getDriversByStore(String storeId) {
        logger.info("Fetching drivers for store: {}", storeId);
        List<User> drivers = userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, storeId);
        return drivers.stream()
                .map(this::mapToUserResponse)
                .collect(java.util.stream.Collectors.toList());
    }
}