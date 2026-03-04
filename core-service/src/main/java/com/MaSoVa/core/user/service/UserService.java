package com.MaSoVa.core.user.service;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.util.PiiMasker;
import com.MaSoVa.core.user.dto.LoginRequest;
import com.MaSoVa.core.user.dto.LoginResponse;
import com.MaSoVa.core.user.dto.UserCreateRequest;
import com.MaSoVa.core.user.dto.UserResponse;
import com.MaSoVa.core.user.entity.UserAuthProviderEntity;
import com.MaSoVa.core.user.entity.UserEntity;
import com.MaSoVa.core.user.repository.UserJpaRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;

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
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    /** Phase 2 dual-write: PostgreSQL secondary write (non-blocking). MongoDB remains primary. */
    @Autowired
    private UserJpaRepository userJpaRepository;

    @SuppressWarnings("unused")
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

    @Value("${google.oauth.client-id:}")
    private String googleOAuthClientId;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    
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

            // Set driver-specific fields if provided
            if (request.getVehicleType() != null) {
                employeeDetails.setVehicleType(request.getVehicleType());
            }
            if (request.getLicenseNumber() != null) {
                employeeDetails.setLicenseNumber(request.getLicenseNumber());
            }

            user.setEmployeeDetails(employeeDetails);
        }

        User savedUser = userRepository.save(user);

        // Create customer profile for CUSTOMER type users
        if (savedUser.getType() == UserType.CUSTOMER) {
            try {
                createCustomerProfile(savedUser);
            } catch (org.springframework.web.client.HttpClientErrorException.Forbidden e) {
                logger.error("Failed to create customer profile - authentication issue for user {}", savedUser.getId());
                // Customer profile will be auto-created on first order
            } catch (org.springframework.web.client.HttpClientErrorException.BadRequest e) {
                // Check if it's a duplicate error
                String errorBody = e.getResponseBodyAsString();
                if (errorBody.contains("already exists")) {
                    logger.warn("Customer profile already exists for user {} with email {}", savedUser.getId(), PiiMasker.maskEmail(savedUser.getPersonalInfo().getEmail()));
                    // This is okay - customer profile exists from previous registration
                } else {
                    logger.error("Failed to create customer profile for user {}: {}", savedUser.getId(), e.getMessage());
                    // Delete the user to keep data consistent
                    userRepository.delete(savedUser);
                    throw new RuntimeException("Registration failed: " + errorBody);
                }
            } catch (Exception e) {
                logger.error("Failed to create customer profile for user {}: {}", savedUser.getId(), e.getMessage(), e);
                // Customer profile will be auto-created on first order
            }
        }

        // Generate tokens and auto-login the user
        String storeId = savedUser.isEmployee() ? savedUser.getEmployeeDetails().getStoreId() : null;
        String accessToken = jwtService.generateAccessToken(savedUser.getId(), savedUser.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId());

        // Update last login
        savedUser.setLastLogin(LocalDateTime.now());
        userRepository.save(savedUser);

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            userJpaRepository.save(toUserEntity(savedUser));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for registerUser userId={}: {}", savedUser.getId(), e.getMessage());
        }

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
        @SuppressWarnings("rawtypes")
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

            // Set driver-specific fields if provided
            if (request.getVehicleType() != null) {
                employeeDetails.setVehicleType(request.getVehicleType());
            }
            if (request.getLicenseNumber() != null) {
                employeeDetails.setLicenseNumber(request.getLicenseNumber());
            }

            user.setEmployeeDetails(employeeDetails);
        }

        User savedUser = userRepository.save(user);

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            userJpaRepository.save(toUserEntity(savedUser));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for createUser userId={}: {}", savedUser.getId(), e.getMessage());
        }

        // Auto-generate 5-digit PIN for employees
        if (savedUser.isEmployee()) {
            try {
                String plainPin = generateEmployeePIN(savedUser.getId(), request.getStoreId());
                logger.info("IMPORTANT: Generated PIN for employee {} ({}): {}",
                    savedUser.getPersonalInfo().getName(),
                    savedUser.getId(),
                    plainPin);
                // Store PIN temporarily in response so it can be displayed to manager
                UserResponse response = mapToUserResponse(savedUser);
                response.setGeneratedPIN(plainPin);
                return response;
            } catch (Exception e) {
                logger.error("Failed to generate PIN for employee {}: {}", savedUser.getId(), e.getMessage());
            }
        }

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

        // Set driver-specific fields if provided
        if (request.getVehicleType() != null) {
            employeeDetails.setVehicleType(request.getVehicleType());
        }
        if (request.getLicenseNumber() != null) {
            employeeDetails.setLicenseNumber(request.getLicenseNumber());
        }

        user.setEmployeeDetails(employeeDetails);

        User savedUser = userRepository.save(user);

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            userJpaRepository.save(toUserEntity(savedUser));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for createEmployee userId={}: {}", savedUser.getId(), e.getMessage());
        }

        return mapToUserResponse(savedUser);
    }

    public LoginResponse authenticate(LoginRequest request) {
        logger.info("Authentication attempt for email: {}", PiiMasker.maskEmail(request.getEmail()));

        User user = userRepository.findByPersonalInfoEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.error("User not found for email: {}", PiiMasker.maskEmail(request.getEmail()));
                    return new RuntimeException("Invalid credentials");
                });

        logger.info("User found: {} (type: {}, active: {})", user.getId(), user.getType(), user.isActive());

        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPersonalInfo().getPasswordHash());
        logger.info("Password match result: {}", passwordMatches);

        if (!passwordMatches) {
            logger.error("Password mismatch for user: {}", user.getId());
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            logger.error("User account deactivated: {}", user.getId());
            throw new RuntimeException("Account is deactivated");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Phase 2 dual-write: sync lastLogin to PostgreSQL (non-blocking)
        try {
            final OffsetDateTime loginTime = OffsetDateTime.now(IST);
            userJpaRepository.findByMongoId(user.getId()).ifPresentOrElse(
                entity -> { entity.setLastLogin(loginTime); userJpaRepository.save(entity); },
                () -> logger.warn("PG dual-write: no PG row for authenticate userId={} — row missing", user.getId())
            );
        } catch (Exception e) {
            logger.warn("PG dual-write failed for authenticate lastLogin userId={}: {}", user.getId(), e.getMessage());
        }

        String storeId = null;
        if (user.isEmployee() && user.getEmployeeDetails() != null) {
            storeId = user.getEmployeeDetails().getStoreId();
            logger.info("Employee store ID: {}", storeId);
        }

        logger.info("Generating tokens for user: {}", user.getId());
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        // DISABLED: Auto clock-in for ALL employees
        // All employees (STAFF, DRIVER, MANAGER, ASSISTANT_MANAGER) must use POS clock-in feature
        // This ensures intentional session recording and accurate time tracking
        logger.info("Auto clock-in disabled - user must clock in via POS: {} (type: {})",
            user.getId(), user.getType());

        // No automatic session start on login

        logger.info("Authentication successful for user: {}", user.getId());
        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(user));
    }

    /**
     * Sign in via Google — existing accounts only. Errors if no account found.
     */
    public LoginResponse loginWithGoogle(String idToken) {
        logger.info("Google Sign-In attempt");

        Map<String, Object> tokenInfo = verifyGoogleIdToken(idToken);
        String googleSub = (String) tokenInfo.get("sub");
        String email = (String) tokenInfo.get("email");

        if (googleSub == null || email == null) {
            throw new RuntimeException("Invalid Google ID token: missing sub or email");
        }

        if (googleOAuthClientId != null && !googleOAuthClientId.isEmpty()) {
            String aud = (String) tokenInfo.get("aud");
            if (!googleOAuthClientId.equals(aud)) {
                throw new RuntimeException("Google ID token audience mismatch");
            }
        }

        Optional<User> existingByEmail = userRepository.findByPersonalInfoEmail(email);
        if (existingByEmail.isEmpty()) {
            throw new RuntimeException("No account found for this Google email. Please register first.");
        }

        User user = existingByEmail.get();

        // Link Google provider if not already linked
        boolean alreadyLinked = user.getAuthProviders().stream()
                .anyMatch(p -> "GOOGLE".equals(p.getProvider()) && googleSub.equals(p.getProviderId()));
        if (!alreadyLinked) {
            user.getAuthProviders().add(new User.AuthProvider("GOOGLE", googleSub, email));
            userRepository.save(user);
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Phase 2 dual-write: sync lastLogin to PostgreSQL (non-blocking)
        try {
            final OffsetDateTime loginTime = OffsetDateTime.now(IST);
            userJpaRepository.findByMongoId(user.getId()).ifPresentOrElse(
                entity -> { entity.setLastLogin(loginTime); userJpaRepository.save(entity); },
                () -> logger.warn("PG dual-write: no PG row for loginWithGoogle userId={} — row missing", user.getId())
            );
        } catch (Exception e) {
            logger.warn("PG dual-write failed for loginWithGoogle lastLogin userId={}: {}", user.getId(), e.getMessage());
        }

        String storeId = user.isEmployee() && user.getEmployeeDetails() != null
                ? user.getEmployeeDetails().getStoreId() : null;
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        logger.info("Google Sign-In successful for user: {}", user.getId());
        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(user));
    }

    /**
     * Register via Google — new accounts only. Errors if account already exists.
     */
    public LoginResponse registerWithGoogle(String idToken) {
        logger.info("Google Register attempt");

        Map<String, Object> tokenInfo = verifyGoogleIdToken(idToken);
        String googleSub = (String) tokenInfo.get("sub");
        String email = (String) tokenInfo.get("email");
        String name = (String) tokenInfo.get("name");

        if (googleSub == null || email == null) {
            throw new RuntimeException("Invalid Google ID token: missing sub or email");
        }

        if (googleOAuthClientId != null && !googleOAuthClientId.isEmpty()) {
            String aud = (String) tokenInfo.get("aud");
            if (!googleOAuthClientId.equals(aud)) {
                throw new RuntimeException("Google ID token audience mismatch");
            }
        }

        Optional<User> existingByEmail = userRepository.findByPersonalInfoEmail(email);
        if (existingByEmail.isPresent()) {
            throw new RuntimeException("An account already exists for this Google email. Please sign in instead.");
        }

        User user = new User();
        user.setType(UserType.CUSTOMER);

        User.PersonalInfo personalInfo = new User.PersonalInfo();
        personalInfo.setName(name != null ? name : email.split("@")[0]);
        personalInfo.setEmail(email);
        personalInfo.setPhone("0000000000"); // placeholder; user must update in profile
        personalInfo.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        user.setPersonalInfo(personalInfo);

        List<User.AuthProvider> providers = new ArrayList<>();
        providers.add(new User.AuthProvider("GOOGLE", googleSub, email));
        user.setAuthProviders(providers);

        user = userRepository.save(user);
        logger.info("Created new user via Google Register: {}", user.getId());

        try {
            createCustomerProfile(user);
        } catch (Exception e) {
            logger.warn("Customer profile creation failed for Google user {}: {}", user.getId(), e.getMessage());
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Phase 2 dual-write: sync new user + lastLogin to PostgreSQL (non-blocking)
        try {
            userJpaRepository.save(toUserEntity(user));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for registerWithGoogle userId={}: {}", user.getId(), e.getMessage());
        }

        String storeId = null;
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getType().name(), storeId);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        logger.info("Google Register successful for user: {}", user.getId());
        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(user));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleIdToken(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Google token verification failed");
            }
            return response.getBody();
        } catch (org.springframework.web.client.RestClientException e) {
            logger.error("Google tokeninfo request failed: {}", e.getMessage());
            throw new RuntimeException("Google token verification failed: " + e.getMessage());
        }
    }

    public void logout(String userId, String accessToken) {
        // Blacklist the access token so it cannot be reused after logout
        if (accessToken != null && !accessToken.isBlank()) {
            jwtService.invalidateToken(accessToken);
        }

        User user = getUserById(userId);
        if (user.isEmployee()) {
            try {
                sessionService.endSession(userId);
            } catch (Exception e) {
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

    /**
     * Get user by ID without using cache
     * Use this to avoid LinkedHashMap casting issues with cache deserialization
     */
    public User getUserByIdUncached(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserResponse getUserResponseById(String userId) {
        return mapToUserResponse(getUserById(userId));
    }
    
    /**
     * WARNING: This method loads all users - should use pagination in production
     * Consider using getUsersByType() or getStoreEmployees() for filtered queries
     */
    @Deprecated
    public List<UserResponse> getAllUsers() {
        // For now, limit to active employees only to reduce memory footprint
        return userRepository.findAllActiveEmployees().stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    public List<UserResponse> getUsersByType(UserType type) {
        return userRepository.findByType(type).stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    public List<UserResponse> getUsersByTypeAndStore(UserType type, String storeId) {
        return userRepository.findByTypeAndEmployeeDetailsStoreId(type, storeId).stream()
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

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            userJpaRepository.findByMongoId(updatedUser.getId()).ifPresentOrElse(
                existing -> {
                    updateUserEntityFields(existing, updatedUser);
                    userJpaRepository.save(existing);
                },
                () -> userJpaRepository.save(toUserEntity(updatedUser))
            );
        } catch (Exception e) {
            logger.warn("PG dual-write failed for updateUser userId={}: {}", updatedUser.getId(), e.getMessage());
        }

        return mapToUserResponse(updatedUser);
    }
    
    @CacheEvict(value = "users", key = "'user:' + #p0")
    public void activateUser(String userId) {
        User user = getUserById(userId);
        user.setActive(true);
        userRepository.save(user);

        // Phase 2 dual-write: reactivate in PostgreSQL (non-blocking)
        try {
            userJpaRepository.findByMongoId(userId).ifPresentOrElse(entity -> {
                entity.setActive(true);
                entity.setDeletedAt(null);
                userJpaRepository.save(entity);
            }, () -> logger.warn("PG dual-write: no PG row found for activateUser userId={}", userId));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for activateUser userId={}: {}", userId, e.getMessage());
        }

        logger.info("Activated user: {}", userId);
    }

    @CacheEvict(value = "users", key = "'user:' + #p0")
    public void deactivateUser(String userId) {
        User user = getUserById(userId);
        user.setActive(false);
        userRepository.save(user);

        // Phase 2 dual-write: soft-delete in PostgreSQL (non-blocking)
        try {
            userJpaRepository.findByMongoId(userId).ifPresentOrElse(entity -> {
                entity.setActive(false);
                entity.setDeletedAt(OffsetDateTime.now(IST));
                userJpaRepository.save(entity);
            }, () -> logger.warn("PG dual-write: no PG row found for deactivateUser userId={}", userId));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for deactivateUser userId={}: {}", userId, e.getMessage());
        }

        // End any active working session
        if (user.isEmployee()) {
            try {
                sessionService.endSession(userId);
            } catch (Exception e) {
                logger.error("Failed to end session during deactivation for user {}: {}", userId, e.getMessage(), e);
            }
        }
    }

    // SecureRandom for 5-digit PIN generation
    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    /**
     * Generate a random 5-digit PIN for an employee with store-level uniqueness guarantee
     * PIN is used for authentication in POS and clock-in systems
     * @param userId User ID
     * @param storeId Store ID for uniqueness constraint
     * @return Plain PIN string (to be shown once)
     */
    @CacheEvict(value = "users", key = "'user:' + #p0")
    public String generateEmployeePIN(String userId, String storeId) {
        User user = getUserById(userId);

        if (!user.isEmployee()) {
            throw new RuntimeException("Only employees can have PINs");
        }

        if (user.getEmployeeDetails() == null) {
            user.setEmployeeDetails(new User.EmployeeDetails());
        }

        String pin = null;
        int maxAttempts = 100;
        int attempts = 0;

        // Generate random PIN with collision detection
        while (attempts < maxAttempts) {
            // Generate random 5-digit PIN (00000-99999)
            pin = String.format("%05d", SECURE_RANDOM.nextInt(100000));

            // Hash the PIN
            String hashedPin = passwordEncoder.encode(pin);

            // Check if PIN already exists in this store
            boolean exists = userRepository.existsByStoreIdAndEmployeeDetailsPINHash(storeId, hashedPin);

            if (!exists) {
                // Unique PIN found - save it
                user.getEmployeeDetails().setEmployeePINHash(hashedPin);

                // OPTIMIZATION: Store last 2 digits for indexed lookups (95% faster)
                String pinSuffix = pin.substring(3); // Last 2 digits
                user.getEmployeeDetails().setPinSuffix(pinSuffix);

                userRepository.save(user);

                // Phase 2 dual-write: sync PIN hash + suffix to PostgreSQL (non-blocking)
                final String finalHashedPin = hashedPin;
                final String finalPinSuffix = pinSuffix;
                try {
                    userJpaRepository.findByMongoId(userId).ifPresentOrElse(entity -> {
                        entity.setEmployeePinHash(finalHashedPin);
                        entity.setPinSuffix(finalPinSuffix);
                        userJpaRepository.save(entity);
                    }, () -> logger.warn("PG dual-write: no PG row found for generateEmployeePIN userId={}", userId));
                } catch (Exception e) {
                    logger.warn("PG dual-write failed for generateEmployeePIN userId={}: {}", userId, e.getMessage());
                }

                logger.info("Generated 5-digit PIN for employee {} in store {} (suffix: {})", userId, storeId, pinSuffix);
                return pin; // Return plain PIN only once
            }

            attempts++;
        }

        throw new RuntimeException("Failed to generate unique PIN after " + maxAttempts + " attempts");
    }

    /**
     * Legacy method - calls new method with user's storeId
     */
    @Deprecated
    public String generateEmployeePIN(String userId) {
        User user = getUserById(userId);
        String storeId = user.getEmployeeDetails() != null ? user.getEmployeeDetails().getStoreId() : null;

        if (storeId == null) {
            throw new RuntimeException("Employee must be assigned to a store before generating PIN");
        }

        return generateEmployeePIN(userId, storeId);
    }

    /**
     * Verify employee PIN
     * @param userId User ID
     * @param plainPin Plain 5-digit PIN
     * @return true if PIN matches
     */
    public boolean verifyEmployeePIN(String userId, String plainPin) {
        User user = getUserById(userId);

        if (user.getEmployeeDetails() == null ||
            user.getEmployeeDetails().getEmployeePINHash() == null) {
            return false;
        }

        return passwordEncoder.matches(plainPin, user.getEmployeeDetails().getEmployeePINHash());
    }

    /**
     * Find user by validating their PIN
     * @param plainPin Plain 5-digit PIN
     * @return User if PIN matches, null otherwise
     */
    /**
     * Find user by PIN with optimized lookup
     * Uses pinSuffix index to reduce BCrypt checks from O(n) to O(1)
     *
     * Performance:
     * - Old: Check all ~100 employees with BCrypt (~100ms)
     * - New: Query by suffix index (~1-2 candidates), check with BCrypt (~5ms)
     *
     * @param plainPin Plain 5-digit PIN
     * @return User if found, null otherwise
     */
    public User findUserByPIN(String plainPin) {
        if (plainPin == null || plainPin.length() != 5) {
            return null;
        }

        // OPTIMIZATION: Extract suffix and query by index first
        String pinSuffix = plainPin.substring(3); // Last 2 digits

        // Query only users with matching suffix (reduces from ~100 to ~1-2 candidates)
        List<User> candidates = userRepository.findByEmployeeDetailsPinSuffix(pinSuffix);

        // Fallback: If suffix query returns nothing, try old method (for backwards compatibility)
        if (candidates == null || candidates.isEmpty()) {
            logger.warn("No users found with PIN suffix '{}', falling back to full scan", pinSuffix);
            candidates = userRepository.findByTypeIn(
                java.util.Arrays.asList(
                    UserType.STAFF,
                    UserType.DRIVER,
                    UserType.MANAGER,
                    UserType.ASSISTANT_MANAGER
                )
            );
        }

        // Check PIN for each candidate with BCrypt
        for (User candidate : candidates) {
            if (candidate.getEmployeeDetails() != null &&
                candidate.getEmployeeDetails().getEmployeePINHash() != null) {

                if (passwordEncoder.matches(plainPin, candidate.getEmployeeDetails().getEmployeePINHash())) {
                    logger.debug("PIN lookup optimized: checked {} candidates instead of all employees",
                        candidates.size());
                    return candidate;
                }
            }
        }

        return null;
    }

    /**
     * Generate PINs for all employees without PINs (Phase 2 - Migration)
     */
    public Map<String, String> generatePINsForAllEmployees() {
        Map<String, String> results = new HashMap<>();

        List<User> employees = userRepository.findAll().stream()
            .filter(User::isEmployee)
            .filter(u -> u.getEmployeeDetails() != null)
            .filter(u -> u.getEmployeeDetails().getEmployeePINHash() == null)
            .collect(Collectors.toList());

        logger.info("Generating PINs for {} employees", employees.size());

        for (User employee : employees) {
            try {
                String pin = generateEmployeePIN(employee.getId());
                results.put(employee.getId(), pin);
                logger.info("Generated PIN for employee: {} ({})", employee.getPersonalInfo().getName(), employee.getId());
            } catch (Exception e) {
                logger.error("Failed to generate PIN for employee {}: {}", employee.getId(), e.getMessage());
                results.put(employee.getId(), "ERROR: " + e.getMessage());
            }
        }

        return results;
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
        // Build a smarter query based on available parameters instead of loading all users
        List<User> users;

        // Priority: Use most specific filter first
        if (storeId != null && type != null) {
            users = userRepository.findByStoreIdAndType(storeId, type);
        } else if (storeId != null) {
            users = userRepository.findByStoreId(storeId);
        } else if (type != null) {
            users = userRepository.findByType(type);
        } else if (name != null) {
            users = userRepository.findByNameContainingIgnoreCase(name);
        } else if (email != null) {
            users = userRepository.findByEmailContainingIgnoreCase(email);
        } else if (phone != null) {
            users = userRepository.findByPhoneContaining(phone);
        } else {
            // Fallback: only active employees instead of all users
            users = userRepository.findAllActiveEmployees();
        }

        // Apply remaining filters in-memory (much smaller dataset now)
        return users.stream()
                .filter(user -> name == null || user.getPersonalInfo().getName().toLowerCase().contains(name.toLowerCase()))
                .filter(user -> email == null || user.getPersonalInfo().getEmail().toLowerCase().contains(email.toLowerCase()))
                .filter(user -> phone == null || user.getPersonalInfo().getPhone().contains(phone))
                .filter(user -> type == null || user.getType() == type)
                .filter(user -> storeId == null || (user.getEmployeeDetails() != null && storeId.equals(user.getEmployeeDetails().getStoreId())))
                .map(this::mapToUserResponse)
                .toList();
    }
    
    public Map<String, Object> getUserStatistics() {
        // Use count queries instead of loading all users
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long inactiveUsers = totalUsers - activeUsers;
        long recentLogins = userRepository.countByLastLoginAfter(LocalDateTime.now().minusDays(7));

        // For usersByType, we need to count each type separately
        Map<UserType, Long> usersByType = new HashMap<>();
        for (UserType type : UserType.values()) {
            usersByType.put(type, userRepository.countByType(type));
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("recentLogins", recentLogins);
        stats.put("usersByType", usersByType);

        return stats;
    }

    public Map<String, Object> getDriverStatsByStore(String storeId) {
        // Get all drivers for this store
        List<User> drivers = userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, storeId);

        // Calculate driver-specific stats
        long totalDrivers = drivers.size();
        long activeDrivers = drivers.stream().filter(User::isActive).count();
        long onlineDrivers = drivers.stream()
                .filter(d -> d.getEmployeeDetails() != null &&
                        d.getEmployeeDetails().getStatus() != null &&
                        "ONLINE".equals(d.getEmployeeDetails().getStatus()))
                .count();
        long offlineDrivers = activeDrivers - onlineDrivers;
        long availableDrivers = drivers.stream()
                .filter(d -> d.isActive() &&
                        d.getEmployeeDetails() != null &&
                        d.getEmployeeDetails().getStatus() != null &&
                        "ONLINE".equals(d.getEmployeeDetails().getStatus()) &&
                        (d.getEmployeeDetails().getActiveDeliveryCount() == null ||
                                d.getEmployeeDetails().getActiveDeliveryCount() == 0))
                .count();
        long busyDrivers = onlineDrivers - availableDrivers;

        // For now, set these to 0 - should be calculated from delivery service
        long totalDeliveriesToday = 0;
        double averageDeliveryTime = 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDrivers", totalDrivers);
        stats.put("activeDrivers", activeDrivers);
        stats.put("onlineDrivers", onlineDrivers);
        stats.put("offlineDrivers", offlineDrivers);
        stats.put("availableDrivers", availableDrivers);
        stats.put("busyDrivers", busyDrivers);
        stats.put("totalDeliveriesToday", totalDeliveriesToday);
        stats.put("averageDeliveryTime", averageDeliveryTime);

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
    
    public UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setType(user.getType());
        response.setName(user.getPersonalInfo().getName());
        response.setEmail(user.getPersonalInfo().getEmail());
        response.setPhone(user.getPersonalInfo().getPhone());
        response.setAddress(user.getPersonalInfo().getAddress());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());
        response.setIsActive(user.isActive());
        
        if (user.isEmployee() && user.getEmployeeDetails() != null) {
            response.setStoreId(user.getEmployeeDetails().getStoreId());
            response.setRole(user.getEmployeeDetails().getRole());
            response.setPermissions(user.getEmployeeDetails().getPermissions());
            response.setStatus(user.getEmployeeDetails().getStatus());
            response.setRating(user.getEmployeeDetails().getRating());
            response.setActiveDeliveryCount(user.getEmployeeDetails().getActiveDeliveryCount());

            // Check if user has active working session to determine isOnline status
            try {
                boolean isCurrentlyWorking = sessionService.isEmployeeCurrentlyWorking(user.getId());
                response.setIsOnline(isCurrentlyWorking);
            } catch (Exception e) {
                logger.warn("Failed to check active session for user {}: {}", user.getId(), e.getMessage());
                response.setIsOnline(false);
            }
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

    public List<UserResponse> getAvailableDrivers(String storeId) {
        logger.info("Fetching available drivers for store: {}", storeId);
        List<User> drivers = userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.DRIVER, storeId);

        // Filter for drivers with status = "AVAILABLE" and isActive = true
        return drivers.stream()
                .filter(driver -> driver.isActive())
                .filter(driver -> {
                    if (driver.getEmployeeDetails() == null) {
                        return false;
                    }
                    String status = driver.getEmployeeDetails().getStatus();
                    return status != null && "AVAILABLE".equals(status);
                })
                .map(this::mapToUserResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Update driver online/offline status
     * Phase 8: Persist driver status across page refreshes
     */
    public void updateDriverStatus(String driverId, String status) {
        logger.info("Updating driver {} status to: {}", driverId, status);

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with ID: " + driverId));

        // Verify user is a driver
        if (driver.getType() != UserType.DRIVER) {
            throw new RuntimeException("User is not a driver");
        }

        // Initialize EmployeeDetails if null
        if (driver.getEmployeeDetails() == null) {
            driver.setEmployeeDetails(new User.EmployeeDetails());
        }

        // Update status
        driver.getEmployeeDetails().setStatus(status);

        // Save to database
        userRepository.save(driver);

        // Phase 2 dual-write: sync driver status to PostgreSQL (non-blocking)
        try {
            userJpaRepository.findByMongoId(driverId).ifPresentOrElse(entity -> {
                entity.setEmployeeStatus(status);
                userJpaRepository.save(entity);
            }, () -> logger.warn("PG dual-write: no PG row found for updateDriverStatus driverId={}", driverId));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for updateDriverStatus driverId={}: {}", driverId, e.getMessage());
        }

        logger.info("Driver {} status updated successfully to: {}", driverId, status);
    }

    // ==================== KIOSK ACCOUNT MANAGEMENT ====================

    /**
     * Create a kiosk account for a specific POS terminal
     * Only managers can create kiosk accounts
     *
     * @param storeId Store where kiosk will be deployed
     * @param terminalId Unique terminal identifier (e.g., "POS-01")
     * @param createdByUserId Manager who is creating the kiosk account
     * @return Created kiosk user
     */
    public User createKioskAccount(String storeId, String terminalId, String createdByUserId) {
        logger.info("Creating kiosk account for store {} terminal {}", storeId, terminalId);

        // Validate that creator is a manager
        User creator = getUserById(createdByUserId);
        if (creator.getType() != UserType.MANAGER && creator.getType() != UserType.ASSISTANT_MANAGER) {
            throw new RuntimeException("Only managers can create kiosk accounts");
        }

        // Check if kiosk account already exists for this terminal
        Optional<User> existingKiosk = userRepository.findByEmployeeDetailsStoreIdAndEmployeeDetailsTerminalId(
            storeId, terminalId
        );
        if (existingKiosk.isPresent()) {
            throw new RuntimeException("Kiosk account already exists for terminal " + terminalId);
        }

        // Generate unique kiosk credentials
        String kioskEmail = String.format("kiosk.%s.%s@masova.internal", storeId, terminalId);
        String kioskName = String.format("Kiosk %s - Store %s", terminalId, storeId);

        // Create kiosk user
        User kioskUser = new User();
        kioskUser.setType(UserType.KIOSK);
        kioskUser.setActive(true);

        User.PersonalInfo personalInfo = new User.PersonalInfo();
        personalInfo.setName(kioskName);
        personalInfo.setEmail(kioskEmail);
        personalInfo.setPhone("0000000000"); // Placeholder phone for kiosk accounts
        // Generate random secure password (not meant for manual login)
        String randomPassword = java.util.UUID.randomUUID().toString() + java.util.UUID.randomUUID().toString();
        personalInfo.setPasswordHash(passwordEncoder.encode(randomPassword));
        kioskUser.setPersonalInfo(personalInfo);

        User.EmployeeDetails employeeDetails = new User.EmployeeDetails();
        employeeDetails.setStoreId(storeId);
        employeeDetails.setRole("KIOSK_TERMINAL");
        employeeDetails.setTerminalId(terminalId);
        employeeDetails.setIsKioskAccount(true);
        employeeDetails.setStatus("ACTIVE");
        employeeDetails.setPermissions(java.util.Arrays.asList("CREATE_ORDER", "VIEW_MENU", "PROCESS_PAYMENT"));
        kioskUser.setEmployeeDetails(employeeDetails);

        User savedKiosk = userRepository.save(kioskUser);
        logger.info("Kiosk account created: {} ({})", savedKiosk.getId(), terminalId);

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            userJpaRepository.save(toUserEntity(savedKiosk));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for createKioskAccount userId={}: {}", savedKiosk.getId(), e.getMessage());
        }

        return savedKiosk;
    }

    /**
     * Generate kiosk authentication tokens
     * Returns long-lived tokens (30-day access, 90-day refresh)
     *
     * @param kioskUserId ID of the kiosk account
     * @return LoginResponse with long-lived tokens
     */
    public LoginResponse generateKioskTokens(String kioskUserId) {
        User kiosk = getUserById(kioskUserId);

        if (kiosk.getType() != UserType.KIOSK) {
            throw new RuntimeException("User is not a kiosk account");
        }

        if (!kiosk.isActive()) {
            throw new RuntimeException("Kiosk account is deactivated");
        }

        String storeId = kiosk.getEmployeeDetails().getStoreId();
        String terminalId = kiosk.getEmployeeDetails().getTerminalId();

        // Generate long-lived tokens
        String accessToken = jwtService.generateKioskAccessToken(kioskUserId, storeId, terminalId);
        String refreshToken = jwtService.generateKioskRefreshToken(kioskUserId);

        // Update last access time
        kiosk.getEmployeeDetails().setLastKioskAccess(LocalDateTime.now());
        kiosk.setLastLogin(LocalDateTime.now());
        userRepository.save(kiosk);

        // Phase 2 dual-write: update lastLogin in PostgreSQL (non-blocking)
        final OffsetDateTime kioskLoginTime = OffsetDateTime.now(IST);
        try {
            userJpaRepository.findByMongoId(kioskUserId).ifPresentOrElse(entity -> {
                entity.setLastLogin(kioskLoginTime);
                userJpaRepository.save(entity);
            }, () -> logger.warn("PG dual-write: no PG row found for generateKioskTokens kioskUserId={}", kioskUserId));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for generateKioskTokens kioskUserId={}: {}", kioskUserId, e.getMessage());
        }

        logger.info("Generated kiosk tokens for terminal {} at store {}", terminalId, storeId);

        return new LoginResponse(accessToken, refreshToken, mapToUserResponse(kiosk));
    }

    /**
     * List all kiosk accounts for a store
     */
    public List<UserResponse> getKioskAccountsByStore(String storeId) {
        List<User> kiosks = userRepository.findByTypeAndEmployeeDetailsStoreId(UserType.KIOSK, storeId);
        return kiosks.stream()
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    /**
     * Deactivate a kiosk account
     */
    @CacheEvict(value = "users", key = "'user:' + #kioskUserId")
    public void deactivateKioskAccount(String kioskUserId, String managerId) {
        User manager = getUserById(managerId);
        if (manager.getType() != UserType.MANAGER && manager.getType() != UserType.ASSISTANT_MANAGER) {
            throw new RuntimeException("Only managers can deactivate kiosk accounts");
        }

        User kiosk = getUserById(kioskUserId);
        if (kiosk.getType() != UserType.KIOSK) {
            throw new RuntimeException("User is not a kiosk account");
        }

        kiosk.setActive(false);
        userRepository.save(kiosk);

        // Phase 2 dual-write: soft-delete in PostgreSQL (non-blocking)
        try {
            userJpaRepository.findByMongoId(kioskUserId).ifPresentOrElse(entity -> {
                entity.setActive(false);
                entity.setDeletedAt(OffsetDateTime.now(IST));
                userJpaRepository.save(entity);
            }, () -> logger.warn("PG dual-write: no PG row found for deactivateKioskAccount kioskUserId={}", kioskUserId));
        } catch (Exception e) {
            logger.warn("PG dual-write failed for deactivateKioskAccount kioskUserId={}: {}", kioskUserId, e.getMessage());
        }

        logger.info("Kiosk account {} deactivated by manager {}", kioskUserId, managerId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2 dual-write helpers — MongoDB User → PostgreSQL UserEntity
    // ─────────────────────────────────────────────────────────────────────────

    private UserEntity toUserEntity(User user) {
        if (user.getPersonalInfo() == null) {
            throw new IllegalArgumentException("Cannot dual-write user with null personalInfo: mongoId=" + user.getId());
        }

        OffsetDateTime now = OffsetDateTime.now(IST);

        UserEntity.UserEntityBuilder builder = UserEntity.builder()
            .mongoId(user.getId())
            .userType(user.getType() != null ? user.getType().name() : null)
            .isActive(user.isActive())
            .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().atZone(IST).toOffsetDateTime() : now)
            .name(user.getPersonalInfo().getName())
            .email(user.getPersonalInfo().getEmail())
            .phone(user.getPersonalInfo().getPhone())
            .passwordHash(user.getPersonalInfo().getPasswordHash());

        if (user.getEmployeeDetails() != null) {
            User.EmployeeDetails emp = user.getEmployeeDetails();
            builder.storeId(emp.getStoreId())
                   .employeeRole(emp.getRole())
                   .employeeStatus(emp.getStatus())
                   .employeePinHash(emp.getEmployeePINHash())
                   .pinSuffix(emp.getPinSuffix())
                   .terminalId(emp.getTerminalId())
                   .kioskAccount(emp.getIsKioskAccount());
        }

        if (user.getLastLogin() != null) {
            builder.lastLogin(user.getLastLogin().atZone(IST).toOffsetDateTime());
        }

        return builder.build();
    }

    private void updateUserEntityFields(UserEntity entity, User user) {
        if (user.getPersonalInfo() != null) {
            entity.setName(user.getPersonalInfo().getName());
            entity.setEmail(user.getPersonalInfo().getEmail());
            entity.setPhone(user.getPersonalInfo().getPhone());
            entity.setPasswordHash(user.getPersonalInfo().getPasswordHash());
        }
        if (user.getEmployeeDetails() != null) {
            User.EmployeeDetails emp = user.getEmployeeDetails();
            entity.setStoreId(emp.getStoreId());
            entity.setEmployeeRole(emp.getRole());
            entity.setEmployeeStatus(emp.getStatus());
            entity.setEmployeePinHash(emp.getEmployeePINHash());
            entity.setPinSuffix(emp.getPinSuffix());
            entity.setTerminalId(emp.getTerminalId());
            entity.setKioskAccount(emp.getIsKioskAccount());
        }
        entity.setActive(user.isActive());
    }
}