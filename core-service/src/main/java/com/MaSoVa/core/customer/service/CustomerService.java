package com.MaSoVa.core.customer.service;

import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.entity.Customer.*;
import com.MaSoVa.core.customer.repository.CustomerRepository;
import com.MaSoVa.core.customer.dto.request.*;
import com.MaSoVa.core.customer.dto.response.CustomerStatsResponse;
import com.MaSoVa.shared.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;
    private final CustomerAuditService auditService;

    // Loyalty points earning configuration
    @Value("${MaSoVa.customer.loyalty.rupees-per-point:10}")
    private int rupeesPerPoint;

    @Value("${MaSoVa.customer.loyalty.signup-bonus-points:100}")
    private int signupBonusPoints;

    @Value("${MaSoVa.customer.loyalty.birthday-bonus-points:200}")
    private int birthdayBonusPoints;

    // Loyalty points redemption configuration
    @Value("${MaSoVa.customer.loyalty.points-redemption-rate:100}")
    private int pointsRedemptionRate;

    @Value("${MaSoVa.customer.loyalty.rupees-per-redemption:50}")
    private int rupeesPerRedemption;

    @Value("${MaSoVa.customer.loyalty.min-points-to-redeem:100}")
    private int minPointsToRedeem;

    @Value("${MaSoVa.customer.loyalty.max-redemption-percent:50}")
    private int maxRedemptionPercent;

    // Tier thresholds
    @Value("${MaSoVa.customer.loyalty.tier-thresholds.silver:1000}")
    private int silverThreshold;

    @Value("${MaSoVa.customer.loyalty.tier-thresholds.gold:5000}")
    private int goldThreshold;

    @Value("${MaSoVa.customer.loyalty.tier-thresholds.platinum:10000}")
    private int platinumThreshold;

    // Tier multipliers for earning bonus
    @Value("${MaSoVa.customer.loyalty.tier-multipliers.bronze:1.0}")
    private double bronzeMultiplier;

    @Value("${MaSoVa.customer.loyalty.tier-multipliers.silver:1.25}")
    private double silverMultiplier;

    @Value("${MaSoVa.customer.loyalty.tier-multipliers.gold:1.5}")
    private double goldMultiplier;

    @Value("${MaSoVa.customer.loyalty.tier-multipliers.platinum:2.0}")
    private double platinumMultiplier;

    public CustomerService(CustomerRepository customerRepository, CustomerAuditService auditService) {
        this.customerRepository = customerRepository;
        this.auditService = auditService;
    }

    // ===========================
    // CREATE
    // ===========================

    /**
     * Get or create customer - returns existing customer if found, creates new one if not
     * This is useful for handling registration retries and checkout flows
     */
    @CacheEvict(value = "customers", allEntries = true)
    public Customer getOrCreateCustomer(CreateCustomerRequest request) {
        logger.info("Get or create customer for userId: {}", request.getUserId());

        // Check if customer already exists by userId
        Optional<Customer> existingByUserId = customerRepository.findByUserId(request.getUserId());
        if (existingByUserId.isPresent()) {
            logger.info("Customer already exists for userId: {}", request.getUserId());
            Customer existing = existingByUserId.get();

            // Multi-store support: Add this store to customer's store list if not already present
            if (request.getStoreId() != null && !request.getStoreId().isEmpty()) {
                if (!existing.getStoreIds().contains(request.getStoreId())) {
                    logger.info("Adding store {} to existing customer {}", request.getStoreId(), existing.getId());
                    existing.addStoreId(request.getStoreId());
                    return customerRepository.save(existing);
                }
            }

            return existing;
        }

        // Check if customer exists with same email (from previous registration)
        Optional<Customer> existingByEmail = customerRepository.findByEmail(request.getEmail());
        if (existingByEmail.isPresent()) {
            logger.warn("Customer exists with email {} but different userId. Updating userId from {} to {}",
                PiiMasker.maskEmail(request.getEmail()), existingByEmail.get().getUserId(), request.getUserId());
            // Update the userId to match the new registration
            Customer existing = existingByEmail.get();
            existing.setUserId(request.getUserId());

            // Also add the new store
            if (request.getStoreId() != null && !request.getStoreId().isEmpty()) {
                existing.addStoreId(request.getStoreId());
            }

            return customerRepository.save(existing);
        }

        // Create new customer
        return createCustomer(request);
    }

    @CacheEvict(value = "customers", allEntries = true)
    public Customer createCustomer(CreateCustomerRequest request) {
        logger.info("Creating customer for userId: {}", request.getUserId());

        // Check for duplicates
        if (customerRepository.findByUserId(request.getUserId()).isPresent()) {
            throw new IllegalArgumentException("Customer with userId " + request.getUserId() + " already exists");
        }
        String storeId = request.getStoreId();
        if (storeId != null && !storeId.isEmpty()) {
            if (customerRepository.existsByStoreIdAndEmail(storeId, request.getEmail())) {
                throw new IllegalArgumentException("Customer with email already exists in this store");
            }
            if (customerRepository.existsByStoreIdAndPhone(storeId, request.getPhone())) {
                throw new IllegalArgumentException("Customer with phone already exists in this store");
            }
        } else {
            if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
            }
            if (customerRepository.findByPhone(request.getPhone()).isPresent()) {
                throw new IllegalArgumentException("Customer with phone " + request.getPhone() + " already exists");
            }
        }

        Customer customer = new Customer();
        customer.setUserId(request.getUserId());
        // Multi-store support: Use addStoreId instead of setStoreId
        if (request.getStoreId() != null && !request.getStoreId().isEmpty()) {
            customer.addStoreId(request.getStoreId());
        }
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(request.getGender());
        customer.setMarketingOptIn(request.isMarketingOptIn());
        customer.setSmsOptIn(request.isSmsOptIn());

        // Give signup bonus points
        LoyaltyInfo loyaltyInfo = new LoyaltyInfo();
        loyaltyInfo.setTotalPoints(signupBonusPoints);
        loyaltyInfo.setPointsEarned(signupBonusPoints);
        loyaltyInfo.setTier("BRONZE");
        loyaltyInfo.setLastPointsUpdate(LocalDateTime.now());

        PointTransaction signupBonus = new PointTransaction(signupBonusPoints, "BONUS", "Signup bonus");
        loyaltyInfo.getPointHistory().add(signupBonus);
        capPointHistory(loyaltyInfo);

        customer.setLoyaltyInfo(loyaltyInfo);

        Customer saved = customerRepository.save(customer);
        logger.info("Customer created successfully with ID: {}", saved.getId());
        return saved;
    }

    // ===========================
    // READ
    // ===========================

    @Cacheable(value = "customers", key = "#p0", unless = "#result == null || !#result.isPresent()")
    public Optional<Customer> getCustomerById(String id) {
        logger.debug("Fetching customer by ID: {}", id);
        return customerRepository.findById(id);
    }

    /**
     * Get customer by ID with GDPR audit logging.
     * Use this method when accessing customer data on behalf of another user.
     *
     * @param id          Customer ID
     * @param performedBy User ID of who is accessing the data
     * @param purpose     Business purpose for the access
     * @param request     HTTP request for audit context
     * @return Customer if found
     */
    public Optional<Customer> getCustomerByIdWithAudit(String id, String performedBy, String purpose, HttpServletRequest request) {
        logger.debug("Fetching customer by ID with audit: {}", PiiMasker.maskId(id));
        Optional<Customer> customer = customerRepository.findById(id);

        if (customer.isPresent()) {
            auditService.logDataAccess(id, "CUSTOMER", id, performedBy, purpose, request);
        }

        return customer;
    }

    // Removed caching to ensure fresh data is always fetched after address modifications
    public Optional<Customer> getCustomerByUserId(String userId) {
        logger.debug("Fetching customer by userId: {}", userId);
        Optional<Customer> customerOpt = customerRepository.findByUserId(userId);

        // Ensure all addresses have IDs
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            boolean needsSave = ensureAddressIds(customer);
            if (needsSave) {
                customer = customerRepository.save(customer);
                return Optional.of(customer);
            }
        }

        return customerOpt;
    }

    /**
     * Ensures all addresses have IDs. Returns true if any were missing and assigned.
     */
    private boolean ensureAddressIds(Customer customer) {
        boolean modified = false;
        for (CustomerAddress address : customer.getAddresses()) {
            if (address.getId() == null) {
                address.setId(UUID.randomUUID().toString());
                modified = true;
                logger.info("Assigned ID {} to address for customer {}", address.getId(), customer.getId());
            }
        }
        return modified;
    }

    public Optional<Customer> getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email);
    }

    public Optional<Customer> getCustomerByPhone(String phone) {
        return customerRepository.findByPhone(phone);
    }

    public List<Customer> getAllCustomers() {
        logger.debug("Fetching all customers");
        return customerRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public List<Customer> getActiveCustomers() {
        return customerRepository.findByActiveTrue();
    }

    public Page<Customer> searchCustomers(String searchTerm, int page, int size) {
        logger.debug("Searching customers with term: {}", searchTerm);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return customerRepository.searchCustomers(searchTerm, pageable);
    }

    // ===========================
    // UPDATE
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer updateCustomer(String id, UpdateCustomerRequest request) {
        logger.info("Updating customer: {}", id);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));

        if (request.getName() != null) {
            customer.setName(request.getName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(customer.getEmail())) {
            if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email already in use");
            }
            customer.setEmail(request.getEmail());
            customer.setEmailVerified(false); // Reset verification
        }
        if (request.getPhone() != null && !request.getPhone().equals(customer.getPhone())) {
            if (customerRepository.findByPhone(request.getPhone()).isPresent()) {
                throw new IllegalArgumentException("Phone already in use");
            }
            customer.setPhone(request.getPhone());
            customer.setPhoneVerified(false); // Reset verification
        }
        if (request.getDateOfBirth() != null) {
            customer.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            customer.setGender(request.getGender());
        }
        if (request.getMarketingOptIn() != null) {
            customer.setMarketingOptIn(request.getMarketingOptIn());
        }
        if (request.getSmsOptIn() != null) {
            customer.setSmsOptIn(request.getSmsOptIn());
        }

        return customerRepository.save(customer);
    }

    /**
     * Update customer email address (for walk-in customers who provide email during order)
     */
    @CacheEvict(value = "customers", key = "#p0")
    public Customer updateEmail(String id, String email) {
        logger.info("Updating email for customer: {}", id);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));

        // Only update if the new email is different from the current one
        if (email != null && !email.equals(customer.getEmail())) {
            // Skip validation for placeholder walk-in emails
            if (!email.endsWith("@walkin.local")) {
                // Check if email is already in use by another customer
                Optional<Customer> existingCustomer = customerRepository.findByEmail(email);
                if (existingCustomer.isPresent() && !existingCustomer.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Email already in use by another customer");
                }
            }

            String oldEmail = customer.getEmail();
            customer.setEmail(email);
            customer.setEmailVerified(false); // Reset verification for new email

            logger.info("Updated customer {} email from {} to {}", id, oldEmail, email);

            // Audit the email change
            auditService.logEmailChange(customer, oldEmail, email);

            return customerRepository.save(customer);
        }

        logger.debug("Email unchanged for customer {}, skipping update", id);
        return customer;
    }

    @CacheEvict(value = "customers", key = "#p0")
    public Customer deactivateCustomer(String id) {
        logger.info("Deactivating customer: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));
        customer.setActive(false);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#p0")
    public Customer activateCustomer(String id) {
        logger.info("Activating customer: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));
        customer.setActive(true);
        return customerRepository.save(customer);
    }

    // ===========================
    // ADDRESS MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer addAddress(String customerId, AddAddressRequest request) {
        logger.info("Adding address for customer: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        CustomerAddress address = new CustomerAddress();
        address.setId(UUID.randomUUID().toString());
        address.setLabel(request.getLabel());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setLandmark(request.getLandmark());
        address.setCreatedAt(LocalDateTime.now());

        // If this is the first address or marked as default, set it as default
        if (customer.getAddresses().isEmpty() || request.isDefault()) {
            address.setDefault(true);
            customer.setDefaultAddressId(address.getId());
            // Unset other defaults
            customer.getAddresses().forEach(addr -> addr.setDefault(false));
        }

        customer.getAddresses().add(address);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", allEntries = true)
    public Customer updateAddress(String customerId, String addressId, AddAddressRequest request) {
        logger.info("Updating address {} for customer: {}", addressId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        CustomerAddress address = customer.getAddresses().stream()
                .filter(addr -> addressId.equals(addr.getId()))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Address not found with id: " + addressId));

        // Update address fields
        address.setLabel(request.getLabel());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setLandmark(request.getLandmark());

        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", allEntries = true)
    public Customer removeAddress(String customerId, String addressId) {
        logger.info("Removing address {} for customer: {}", addressId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        int beforeSize = customer.getAddresses().size();
        logger.info("Customer has {} addresses before removal", beforeSize);

        // Log all address IDs for debugging
        customer.getAddresses().forEach(addr ->
            logger.info("Address: id={}, label={}, line1={}", addr.getId(), addr.getLabel(), addr.getAddressLine1())
        );

        boolean removed = customer.getAddresses().removeIf(addr -> {
            boolean matches = addressId != null && addressId.equals(addr.getId());
            if (matches) {
                logger.info("Found matching address to remove: {}", addr.getId());
            }
            return matches;
        });

        int afterSize = customer.getAddresses().size();
        logger.info("Customer has {} addresses after removal. Removed: {}", afterSize, removed);

        // If removed address was default, set first address as default
        if (addressId.equals(customer.getDefaultAddressId()) && !customer.getAddresses().isEmpty()) {
            CustomerAddress firstAddr = customer.getAddresses().get(0);
            // Ensure first address has an ID
            if (firstAddr.getId() == null) {
                firstAddr.setId(UUID.randomUUID().toString());
            }
            firstAddr.setDefault(true);
            customer.setDefaultAddressId(firstAddr.getId());
        } else if (customer.getAddresses().isEmpty()) {
            customer.setDefaultAddressId(null);
        }

        Customer saved = customerRepository.save(customer);
        logger.info("Customer saved with {} addresses", saved.getAddresses().size());
        return saved;
    }

    @CacheEvict(value = "customers", allEntries = true)
    public Customer setDefaultAddress(String customerId, String addressId) {
        logger.info("Setting default address {} for customer: {}", addressId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        boolean addressFound = false;
        for (CustomerAddress address : customer.getAddresses()) {
            // Handle null IDs by generating one if needed
            if (address.getId() == null) {
                address.setId(UUID.randomUUID().toString());
            }
            if (addressId != null && addressId.equals(address.getId())) {
                address.setDefault(true);
                customer.setDefaultAddressId(addressId);
                addressFound = true;
            } else {
                address.setDefault(false);
            }
        }

        if (!addressFound) {
            throw new NoSuchElementException("Address not found with id: " + addressId);
        }

        return customerRepository.save(customer);
    }

    // ===========================
    // LOYALTY MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer addLoyaltyPoints(String customerId, AddLoyaltyPointsRequest request) {
        logger.info("Adding {} loyalty points to customer: {}", request.getPoints(), customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        LoyaltyInfo loyalty = customer.getLoyaltyInfo();

        // Add or subtract points based on type
        int pointChange = request.getPoints();
        if ("REDEEMED".equals(request.getType()) || "EXPIRED".equals(request.getType())) {
            pointChange = -Math.abs(pointChange);
            loyalty.setPointsRedeemed(loyalty.getPointsRedeemed() + Math.abs(request.getPoints()));
        } else {
            loyalty.setPointsEarned(loyalty.getPointsEarned() + pointChange);
        }

        loyalty.setTotalPoints(Math.max(0, loyalty.getTotalPoints() + pointChange));
        loyalty.setLastPointsUpdate(LocalDateTime.now());

        // Add transaction to history
        PointTransaction transaction = new PointTransaction(request.getPoints(), request.getType(), request.getDescription());
        if (request.getOrderId() != null) {
            transaction.setOrderId(request.getOrderId());
        }
        loyalty.getPointHistory().add(transaction);
        capPointHistory(loyalty);

        // Update tier based on total points
        updateLoyaltyTier(customer);

        return customerRepository.save(customer);
    }

    private void updateLoyaltyTier(Customer customer) {
        LoyaltyInfo loyalty = customer.getLoyaltyInfo();
        int points = loyalty.getTotalPoints();
        String newTier;

        if (points >= platinumThreshold) {
            newTier = "PLATINUM";
        } else if (points >= goldThreshold) {
            newTier = "GOLD";
        } else if (points >= silverThreshold) {
            newTier = "SILVER";
        } else {
            newTier = "BRONZE";
        }

        if (!newTier.equals(loyalty.getTier())) {
            logger.info("Upgrading customer {} to {} tier", customer.getId(), newTier);
            loyalty.setTier(newTier);
            loyalty.setTierExpiryDate(LocalDate.now().plusYears(1));
        }
    }

    private static final int MAX_POINT_HISTORY = 100;

    private void capPointHistory(LoyaltyInfo loyalty) {
        List<PointTransaction> history = loyalty.getPointHistory();
        if (history != null && history.size() > MAX_POINT_HISTORY) {
            loyalty.setPointHistory(history.subList(history.size() - MAX_POINT_HISTORY, history.size()));
        }
    }


    private double getTierMultiplier(String tier) {
        return switch (tier.toUpperCase()) {
            case "PLATINUM" -> platinumMultiplier;
            case "GOLD" -> goldMultiplier;
            case "SILVER" -> silverMultiplier;
            default -> bronzeMultiplier;
        };
    }

    /**
     * Calculate discount amount based on points to redeem
     */
    public double calculatePointsDiscount(int pointsToRedeem) {
        if (pointsToRedeem < minPointsToRedeem) {
            return 0.0;
        }
        return (pointsToRedeem / (double) pointsRedemptionRate) * rupeesPerRedemption;
    }

    /**
     * Calculate maximum points that can be redeemed for an order
     */
    public int calculateMaxRedeemablePoints(String customerId, double orderTotal) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        int availablePoints = customer.getLoyaltyInfo().getTotalPoints();

        // Maximum discount is 50% of order total
        double maxDiscount = orderTotal * (maxRedemptionPercent / 100.0);

        // Calculate max points based on discount cap
        int maxPointsFromDiscount = (int) ((maxDiscount / rupeesPerRedemption) * pointsRedemptionRate);

        // Return the smaller of available points or max allowed points
        return Math.min(availablePoints, maxPointsFromDiscount);
    }

    /**
     * Redeem loyalty points for a discount
     */
    @CacheEvict(value = "customers", key = "#p0")
    public Customer redeemLoyaltyPoints(String customerId, int pointsToRedeem, String orderId) {
        logger.info("Redeeming {} loyalty points for customer: {}", pointsToRedeem, customerId);

        if (pointsToRedeem < minPointsToRedeem) {
            throw new IllegalArgumentException("Minimum " + minPointsToRedeem + " points required for redemption");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        LoyaltyInfo loyalty = customer.getLoyaltyInfo();

        if (loyalty.getTotalPoints() < pointsToRedeem) {
            throw new IllegalArgumentException("Insufficient points. Available: " + loyalty.getTotalPoints() + ", Requested: " + pointsToRedeem);
        }

        // Deduct points
        loyalty.setTotalPoints(loyalty.getTotalPoints() - pointsToRedeem);
        loyalty.setPointsRedeemed(loyalty.getPointsRedeemed() + pointsToRedeem);
        loyalty.setLastPointsUpdate(LocalDateTime.now());

        // Add transaction to history
        double discountAmount = calculatePointsDiscount(pointsToRedeem);
        PointTransaction transaction = new PointTransaction(
                pointsToRedeem,
                "REDEEMED",
                "Redeemed for ₹" + String.format("%.2f", discountAmount) + " discount on Order #" + orderId
        );
        transaction.setOrderId(orderId);
        loyalty.getPointHistory().add(transaction);
        capPointHistory(loyalty);

        logger.info("Redeemed {} points for ₹{} discount", pointsToRedeem, discountAmount);
        return customerRepository.save(customer);
    }

    // ===========================
    // PREFERENCES MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer updatePreferences(String customerId, UpdatePreferencesRequest request) {
        logger.info("Updating preferences for customer: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        CustomerPreferences prefs = customer.getPreferences();

        if (request.getFavoriteMenuItems() != null) {
            prefs.setFavoriteMenuItems(request.getFavoriteMenuItems());
        }
        if (request.getCuisinePreferences() != null) {
            prefs.setCuisinePreferences(request.getCuisinePreferences());
        }
        if (request.getDietaryRestrictions() != null) {
            prefs.setDietaryRestrictions(request.getDietaryRestrictions());
        }
        if (request.getAllergenAlerts() != null) {
            prefs.setAllergenAlerts(request.getAllergenAlerts());
        }
        if (request.getPreferredPaymentMethod() != null) {
            prefs.setPreferredPaymentMethod(request.getPreferredPaymentMethod());
        }
        if (request.getSpiceLevel() != null) {
            prefs.setSpiceLevel(request.getSpiceLevel());
        }
        if (request.getNotifyOnOffers() != null) {
            prefs.setNotifyOnOffers(request.getNotifyOnOffers());
        }
        if (request.getNotifyOnOrderStatus() != null) {
            prefs.setNotifyOnOrderStatus(request.getNotifyOnOrderStatus());
        }

        return customerRepository.save(customer);
    }

    // ===========================
    // ORDER STATS UPDATE
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer updateOrderStats(String customerId, UpdateOrderStatsRequest request) {
        logger.info("Updating order stats for customer: {}", customerId);

        // Look up by userId (which is what the order service stores as customerId)
        Customer customer = customerRepository.findByUserId(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with userId: " + customerId));

        OrderStats stats = customer.getOrderStats();
        LocalDateTime now = LocalDateTime.now();

        // Only increment totalOrders when order is first received (not on subsequent status updates)
        if ("RECEIVED".equals(request.getStatus())) {
            stats.setTotalOrders(stats.getTotalOrders() + 1);
        }

        // Treat COMPLETED, DELIVERED, and SERVED as order finished statuses
        // COMPLETED = TAKEAWAY pickup, DELIVERED = DELIVERY finished, SERVED = DINE_IN finished
        if ("COMPLETED".equals(request.getStatus()) || "DELIVERED".equals(request.getStatus()) || "SERVED".equals(request.getStatus())) {
            stats.setCompletedOrders(stats.getCompletedOrders() + 1);
            stats.setTotalSpent(stats.getTotalSpent() + request.getOrderTotal());
            stats.setAverageOrderValue(stats.getTotalSpent() / stats.getCompletedOrders());
            stats.setLastOrderDate(now);
            customer.setLastOrderDate(now);

            // Award loyalty points with tier multiplier - update directly on same customer object
            // to avoid refetching and losing stats updates
            int basePoints = (int) (request.getOrderTotal() / rupeesPerPoint);
            double tierMultiplier = getTierMultiplier(customer.getLoyaltyInfo().getTier());
            int pointsToAdd = (int) (basePoints * tierMultiplier);

            LoyaltyInfo loyalty = customer.getLoyaltyInfo();
            loyalty.setPointsEarned(loyalty.getPointsEarned() + pointsToAdd);
            loyalty.setTotalPoints(loyalty.getTotalPoints() + pointsToAdd);
            loyalty.setLastPointsUpdate(now);

            // Add transaction to history
            PointTransaction transaction = new PointTransaction(
                    pointsToAdd, "EARNED",
                    "Order #" + request.getOrderId() + " (" + basePoints + " base × " + tierMultiplier + "x tier bonus)");
            transaction.setOrderId(request.getOrderId());
            loyalty.getPointHistory().add(transaction);
            capPointHistory(loyalty);

            // Update tier based on total points
            updateLoyaltyTier(customer);

            logger.info("Awarded {} loyalty points for order {}. Total spent: {}, Avg order: {}",
                    pointsToAdd, request.getOrderId(), stats.getTotalSpent(), stats.getAverageOrderValue());
        } else if ("CANCELLED".equals(request.getStatus())) {
            stats.setCancelledOrders(stats.getCancelledOrders() + 1);

            // Week 3 Fix: Reverse loyalty points if they were previously awarded for this order
            // Check if this order previously earned points by looking at loyalty transactions
            LoyaltyInfo loyalty = customer.getLoyaltyInfo();
            if (loyalty != null && loyalty.getPointHistory() != null) {
                // Find the transaction for this order
                PointTransaction earnedTransaction = loyalty.getPointHistory().stream()
                        .filter(t -> "EARNED".equals(t.getType()) &&
                                     request.getOrderId() != null &&
                                     request.getOrderId().equals(t.getOrderId()))
                        .findFirst()
                        .orElse(null);

                if (earnedTransaction != null) {
                    int pointsToReverse = earnedTransaction.getPoints();
                    logger.info("Reversing {} loyalty points for cancelled order: {}", pointsToReverse, request.getOrderId());

                    // Deduct points (ensure don't go negative)
                    int newTotal = Math.max(0, loyalty.getTotalPoints() - pointsToReverse);
                    loyalty.setTotalPoints(newTotal);

                    // Add reversal transaction
                    PointTransaction reversalTransaction = new PointTransaction(
                            -pointsToReverse,
                            "REVERSED",
                            "Order #" + request.getOrderId() + " cancelled (reversing " + pointsToReverse + " points)"
                    );
                    reversalTransaction.setOrderId(request.getOrderId());
                    loyalty.getPointHistory().add(reversalTransaction);
                    capPointHistory(loyalty);

                    logger.info("Loyalty points reversed. New total: {}", newTotal);
                }
            }
        }

        if (stats.getFirstOrderDate() == null) {
            stats.setFirstOrderDate(now);
        }

        // Track favorite order type
        stats.setFavoriteOrderType(request.getOrderType());

        return customerRepository.save(customer);
    }

    // ===========================
    // NOTES MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer addNote(String customerId, AddCustomerNoteRequest request) {
        logger.info("Adding note to customer: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        CustomerNote note = new CustomerNote(request.getNote(), request.getAddedBy(), request.getCategory());
        customer.getNotes().add(note);

        return customerRepository.save(customer);
    }

    // ===========================
    // VERIFICATION
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer verifyEmail(String customerId) {
        logger.info("Verifying email for customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.setEmailVerified(true);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#p0")
    public Customer verifyPhone(String customerId) {
        logger.info("Verifying phone for customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.setPhoneVerified(true);
        return customerRepository.save(customer);
    }

    // ===========================
    // TAGS MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public Customer addTags(String customerId, Set<String> tags) {
        logger.info("Adding tags to customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.getTags().addAll(tags);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#p0")
    public Customer removeTags(String customerId, Set<String> tags) {
        logger.info("Removing tags from customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.getTags().removeAll(tags);
        return customerRepository.save(customer);
    }

    // ===========================
    // QUERIES
    // ===========================

    public List<Customer> getCustomersByLoyaltyTier(String tier) {
        return customerRepository.findByLoyaltyTier(tier);
    }

    public List<Customer> getHighValueCustomers(double minSpending) {
        return customerRepository.findByMinimumSpending(minSpending);
    }

    public List<Customer> getTopSpenders(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return customerRepository.findTopSpenders(pageable);
    }

    public List<Customer> getRecentlyActiveCustomers(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return customerRepository.findRecentlyActiveCustomers(since);
    }

    public List<Customer> getInactiveCustomers(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return customerRepository.findInactiveCustomersSince(since);
    }

    public List<Customer> getBirthdayCustomersToday() {
        LocalDate today = LocalDate.now();
        return customerRepository.findBirthdayCustomers(today.getMonthValue(), today.getDayOfMonth());
    }

    public List<Customer> getMarketingOptInCustomers() {
        return customerRepository.findMarketingOptInCustomers();
    }

    public List<Customer> getSmsOptInCustomers() {
        return customerRepository.findSmsOptInCustomers();
    }

    public List<Customer> getCustomersByTags(List<String> tags) {
        return customerRepository.findByTags(tags);
    }

    // ===========================
    // STORE-BASED QUERIES
    // ===========================

    public List<Customer> getAllCustomersByStoreId(String storeId) {
        logger.debug("Fetching all customers for store: {}", storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getAllCustomers();
        }
        // Multi-store support: Use storeIds array instead of single storeId
        return customerRepository.findByStoreIdsContaining(storeId);
    }

    public List<Customer> getActiveCustomersByStoreId(String storeId) {
        logger.debug("Fetching active customers for store: {}", storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getActiveCustomers();
        }
        // Multi-store support: Use storeIds array instead of single storeId
        return customerRepository.findActiveCustomersByStoreIdsContaining(storeId);
    }

    public Page<Customer> searchCustomersByStoreId(String storeId, String searchTerm, int page, int size) {
        logger.debug("Searching customers for store: {} with term: {}", storeId, searchTerm);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (storeId == null || storeId.isEmpty()) {
            return searchCustomers(searchTerm, page, size);
        }
        // Multi-store support: Use storeIds array instead of single storeId
        return customerRepository.searchCustomersByStoreIdsContaining(storeId, searchTerm, pageable);
    }

    public List<Customer> getCustomersByLoyaltyTierAndStore(String storeId, String tier) {
        logger.debug("Fetching {} tier customers for store: {}", tier, storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getCustomersByLoyaltyTier(tier);
        }
        // Multi-store support: Use storeIds array
        return customerRepository.findByStoreIdsContainingAndLoyaltyTier(storeId, tier);
    }

    public List<Customer> getHighValueCustomersByStore(String storeId, double minSpending) {
        logger.debug("Fetching high-value customers (min: {}) for store: {}", minSpending, storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getHighValueCustomers(minSpending);
        }
        return customerRepository.findHighValueCustomersByStoreId(storeId, minSpending);
    }

    public List<Customer> getTopSpendersByStore(String storeId, int limit) {
        logger.debug("Fetching top {} spenders for store: {}", limit, storeId);
        Pageable pageable = PageRequest.of(0, limit);
        if (storeId == null || storeId.isEmpty()) {
            return getTopSpenders(limit);
        }
        // Multi-store support: Use storeIds array
        return customerRepository.findTopSpendersByStoreIdsContaining(storeId, pageable);
    }

    public List<Customer> getRecentlyActiveCustomersByStore(String storeId, int days) {
        logger.debug("Fetching recently active customers (within {} days) for store: {}", days, storeId);
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        if (storeId == null || storeId.isEmpty()) {
            return getRecentlyActiveCustomers(days);
        }
        // Multi-store support: Use storeIds array
        return customerRepository.findRecentlyActiveCustomersByStoreIdsContaining(storeId, since);
    }

    public List<Customer> getInactiveCustomersByStore(String storeId, int days) {
        logger.debug("Fetching inactive customers (inactive for {} days) for store: {}", days, storeId);
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        if (storeId == null || storeId.isEmpty()) {
            return getInactiveCustomers(days);
        }
        return customerRepository.findInactiveCustomersByStoreId(storeId, since);
    }

    public List<Customer> getBirthdayCustomersTodayByStore(String storeId) {
        logger.debug("Fetching birthday customers for store: {}", storeId);
        LocalDate today = LocalDate.now();
        if (storeId == null || storeId.isEmpty()) {
            return getBirthdayCustomersToday();
        }
        return customerRepository.findBirthdayCustomersByStoreId(storeId, today.getMonthValue(), today.getDayOfMonth());
    }

    public List<Customer> getMarketingOptInCustomersByStore(String storeId) {
        logger.debug("Fetching marketing opt-in customers for store: {}", storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getMarketingOptInCustomers();
        }
        // Multi-store support: Use storeIds array
        return customerRepository.findMarketingOptInCustomersByStoreIdsContaining(storeId);
    }

    public List<Customer> getSmsOptInCustomersByStore(String storeId) {
        logger.debug("Fetching SMS opt-in customers for store: {}", storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getSmsOptInCustomers();
        }
        // Multi-store support: Use storeIds array
        return customerRepository.findSmsOptInCustomersByStoreIdsContaining(storeId);
    }

    public List<Customer> getCustomersByTagsAndStore(String storeId, List<String> tags) {
        logger.debug("Fetching customers by tags for store: {}", storeId);
        if (storeId == null || storeId.isEmpty()) {
            return getCustomersByTags(tags);
        }
        return customerRepository.findByStoreIdAndTags(storeId, tags);
    }

    public CustomerStatsResponse getCustomerStatsByStore(String storeId) {
        logger.debug("Generating customer statistics for store: {}", storeId);

        if (storeId == null || storeId.isEmpty()) {
            return getCustomerStats();
        }

        CustomerStatsResponse stats = new CustomerStatsResponse();

        // Multi-store support: Use storeIds array for counting
        long totalCustomers = customerRepository.findByStoreIdsContaining(storeId).size();
        long activeCustomers = customerRepository.countActiveCustomersByStoreIdsContaining(storeId);

        stats.setTotalCustomers(totalCustomers);
        stats.setActiveCustomers(activeCustomers);
        stats.setInactiveCustomers(stats.getTotalCustomers() - stats.getActiveCustomers());

        // Count verified - use dedicated count queries
        stats.setVerifiedEmails(customerRepository.countByStoreIdAndEmailVerifiedTrue(storeId));
        stats.setVerifiedPhones(customerRepository.countByStoreIdAndPhoneVerifiedTrue(storeId));

        // Customers by tier - MongoDB aggregation would be better but keeping simple count queries
        Map<String, Long> tierMap = new HashMap<>();
        List<Customer> storeCustomers = customerRepository.findByStoreId(storeId);
        tierMap.put("BRONZE", storeCustomers.stream().filter(c -> c.getLoyaltyInfo() != null && "BRONZE".equals(c.getLoyaltyInfo().getTier())).count());
        tierMap.put("SILVER", storeCustomers.stream().filter(c -> c.getLoyaltyInfo() != null && "SILVER".equals(c.getLoyaltyInfo().getTier())).count());
        tierMap.put("GOLD", storeCustomers.stream().filter(c -> c.getLoyaltyInfo() != null && "GOLD".equals(c.getLoyaltyInfo().getTier())).count());
        tierMap.put("PLATINUM", storeCustomers.stream().filter(c -> c.getLoyaltyInfo() != null && "PLATINUM".equals(c.getLoyaltyInfo().getTier())).count());
        stats.setCustomersByTier(tierMap);

        // High-value customers (spent > 10,000 INR)
        stats.setHighValueCustomers(customerRepository.countHighValueCustomersByStoreId(storeId, 10000.0));

        // Average lifetime value - still need to load for calculation, but at least filtered by store
        double avgValue = storeCustomers.stream()
                .filter(c -> c.getOrderStats() != null)
                .mapToDouble(c -> c.getOrderStats().getTotalSpent())
                .average()
                .orElse(0.0);
        stats.setAverageLifetimeValue(avgValue);

        return stats;
    }

    // ===========================
    // STATISTICS
    // ===========================

    public CustomerStatsResponse getCustomerStats() {
        logger.debug("Generating customer statistics");

        CustomerStatsResponse stats = new CustomerStatsResponse();
        stats.setTotalCustomers(customerRepository.count());
        stats.setActiveCustomers(customerRepository.countByActiveTrue());
        stats.setInactiveCustomers(stats.getTotalCustomers() - stats.getActiveCustomers());

        // Count verified - use dedicated count queries instead of loading all customers
        stats.setVerifiedEmails(customerRepository.countByEmailVerifiedTrue());
        stats.setVerifiedPhones(customerRepository.countByPhoneVerifiedTrue());

        // Customers by tier
        Map<String, Long> tierMap = new HashMap<>();
        tierMap.put("BRONZE", customerRepository.countByLoyaltyInfo_Tier("BRONZE"));
        tierMap.put("SILVER", customerRepository.countByLoyaltyInfo_Tier("SILVER"));
        tierMap.put("GOLD", customerRepository.countByLoyaltyInfo_Tier("GOLD"));
        tierMap.put("PLATINUM", customerRepository.countByLoyaltyInfo_Tier("PLATINUM"));
        stats.setCustomersByTier(tierMap);

        // High-value customers (spent > 10,000 INR)
        stats.setHighValueCustomers(customerRepository.countHighValueCustomers(10000.0));

        // Average lifetime value - load only order stats field for memory efficiency
        List<Customer> customersWithStats = customerRepository.findAllWithOrderStats();
        double avgValue = customersWithStats.stream()
                .filter(c -> c.getOrderStats() != null)
                .mapToDouble(c -> c.getOrderStats().getTotalSpent())
                .average()
                .orElse(0.0);
        stats.setAverageLifetimeValue(avgValue);

        return stats;
    }

    // ===========================
    // GDPR-COMPLIANT DELETE / ANONYMIZATION
    // ===========================

    /**
     * GDPR-compliant customer deletion with anonymization.
     * This method soft-deletes the customer by:
     * 1. Anonymizing PII (name, email, phone)
     * 2. Marking as inactive
     * 3. Recording deletion timestamp and reason
     *
     * Note: Full cascading deletion to order-service and payment-service
     * should be implemented via event-driven architecture or service clients.
     *
     * @param id Customer ID
     * @param reason Deletion reason (GDPR_REQUEST, ACCOUNT_CLOSURE, etc.)
     * @return Anonymized customer record
     */
    @CacheEvict(value = "customers", allEntries = true)
    public Customer anonymizeAndDeleteCustomer(String id, String reason) {
        logger.warn("GDPR: Initiating customer anonymization for ID: {} reason: {}", id, reason);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));

        // Store original data for audit log before anonymization
        String originalEmail = customer.getEmail();
        String originalPhone = customer.getPhone();

        // Anonymize PII
        customer.setName("DELETED_USER");
        customer.setEmail("deleted_" + id + "@anonymized.local");
        customer.setPhone("0000000000");
        customer.setGender(null);
        customer.setDateOfBirth(null);

        // Clear addresses (contain sensitive location data)
        customer.getAddresses().clear();
        customer.setDefaultAddressId(null);

        // Clear notes (may contain PII)
        customer.getNotes().clear();

        // Clear preferences (may be considered profiling data under GDPR)
        customer.setPreferences(new Customer.CustomerPreferences());

        // Revoke all consents
        customer.setMarketingOptIn(false);
        customer.setSmsOptIn(false);

        // Mark as deleted
        customer.setActive(false);
        customer.setDeletedAt(LocalDateTime.now());
        customer.setDeletionReason(reason);

        // Clear tags
        customer.getTags().clear();

        Customer anonymized = customerRepository.save(customer);

        logger.info("GDPR: Customer {} anonymized successfully. Original email: {}, phone: {}",
                id,
                PiiMasker.maskEmail(originalEmail),
                PiiMasker.maskPhone(originalPhone));

        // TODO: Implement cascading anonymization to other services:
        // - order-service: anonymize customerName, customerEmail, customerPhone in orders
        // - payment-service: anonymize customerEmail, customerPhone in transactions
        // This should be done via:
        // 1. Publishing a CustomerAnonymizedEvent to a message broker, OR
        // 2. Calling REST endpoints on other services

        return anonymized;
    }

    /**
     * Hard delete - permanently removes customer record.
     * Should only be called after anonymization and retention period.
     */
    @CacheEvict(value = "customers", allEntries = true)
    public void hardDeleteCustomer(String id) {
        logger.warn("GDPR: Permanently deleting customer record: {}", id);

        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            logger.info("Customer {} already deleted", id);
            return;
        }

        // Verify customer is already anonymized (safety check)
        if (customer.isActive() || customer.getDeletedAt() == null) {
            throw new IllegalStateException("Cannot hard delete active customer. Use anonymizeAndDeleteCustomer first.");
        }

        customerRepository.deleteById(id);
        logger.info("GDPR: Customer {} permanently deleted", id);
    }

    /**
     * @deprecated Use anonymizeAndDeleteCustomer for GDPR compliance.
     * This method only deletes from customer collection without cascading.
     */
    @Deprecated
    @CacheEvict(value = "customers", key = "#p0")
    public void deleteCustomer(String id) {
        logger.warn("DEPRECATED: Using non-GDPR-compliant delete for customer: {}", id);
        customerRepository.deleteById(id);
    }

}
