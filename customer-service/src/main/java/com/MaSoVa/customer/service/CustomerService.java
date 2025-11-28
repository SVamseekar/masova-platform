package com.MaSoVa.customer.service;

import com.MaSoVa.customer.entity.Customer;
import com.MaSoVa.customer.entity.Customer.*;
import com.MaSoVa.customer.repository.CustomerRepository;
import com.MaSoVa.customer.dto.request.*;
import com.MaSoVa.customer.dto.response.CustomerStatsResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;

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

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // ===========================
    // CREATE
    // ===========================

    @CacheEvict(value = "customers", allEntries = true)
    public Customer createCustomer(CreateCustomerRequest request) {
        logger.info("Creating customer for userId: {}", request.getUserId());

        // Check for duplicates
        if (customerRepository.findByUserId(request.getUserId()).isPresent()) {
            throw new IllegalArgumentException("Customer with userId " + request.getUserId() + " already exists");
        }
        if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
        }
        if (customerRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Customer with phone " + request.getPhone() + " already exists");
        }

        Customer customer = new Customer();
        customer.setUserId(request.getUserId());
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

        customer.setLoyaltyInfo(loyaltyInfo);

        Customer saved = customerRepository.save(customer);
        logger.info("Customer created successfully with ID: {}", saved.getId());
        return saved;
    }

    // ===========================
    // READ
    // ===========================

    @Cacheable(value = "customers", key = "#p0")
    public Optional<Customer> getCustomerById(String id) {
        logger.debug("Fetching customer by ID: {}", id);
        return customerRepository.findById(id);
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
        if (request.getAllergens() != null) {
            prefs.setAllergens(request.getAllergens());
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

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        OrderStats stats = customer.getOrderStats();
        LocalDateTime now = LocalDateTime.now();

        stats.setTotalOrders(stats.getTotalOrders() + 1);

        if ("COMPLETED".equals(request.getStatus())) {
            stats.setCompletedOrders(stats.getCompletedOrders() + 1);
            stats.setTotalSpent(stats.getTotalSpent() + request.getOrderTotal());
            stats.setAverageOrderValue(stats.getTotalSpent() / stats.getCompletedOrders());
            stats.setLastOrderDate(now);
            customer.setLastOrderDate(now);

            // Award loyalty points with tier multiplier
            int basePoints = (int) (request.getOrderTotal() / rupeesPerPoint);
            double tierMultiplier = getTierMultiplier(customer.getLoyaltyInfo().getTier());
            int pointsToAdd = (int) (basePoints * tierMultiplier);

            AddLoyaltyPointsRequest loyaltyRequest = new AddLoyaltyPointsRequest(
                    pointsToAdd, "EARNED", "Order #" + request.getOrderId() + " (" + basePoints + " base × " + tierMultiplier + "x tier bonus)");
            loyaltyRequest.setOrderId(request.getOrderId());
            addLoyaltyPoints(customerId, loyaltyRequest);
        } else if ("CANCELLED".equals(request.getStatus())) {
            stats.setCancelledOrders(stats.getCancelledOrders() + 1);
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
    // STATISTICS
    // ===========================

    public CustomerStatsResponse getCustomerStats() {
        logger.debug("Generating customer statistics");

        CustomerStatsResponse stats = new CustomerStatsResponse();
        stats.setTotalCustomers(customerRepository.count());
        stats.setActiveCustomers(customerRepository.countByActiveTrue());
        stats.setInactiveCustomers(stats.getTotalCustomers() - stats.getActiveCustomers());

        // Count verified
        List<Customer> allCustomers = customerRepository.findAll();
        stats.setVerifiedEmails(allCustomers.stream().filter(Customer::isEmailVerified).count());
        stats.setVerifiedPhones(allCustomers.stream().filter(Customer::isPhoneVerified).count());

        // Customers by tier
        Map<String, Long> tierMap = new HashMap<>();
        tierMap.put("BRONZE", customerRepository.countByLoyaltyInfo_Tier("BRONZE"));
        tierMap.put("SILVER", customerRepository.countByLoyaltyInfo_Tier("SILVER"));
        tierMap.put("GOLD", customerRepository.countByLoyaltyInfo_Tier("GOLD"));
        tierMap.put("PLATINUM", customerRepository.countByLoyaltyInfo_Tier("PLATINUM"));
        stats.setCustomersByTier(tierMap);

        // High-value customers (spent > 10,000 INR)
        stats.setHighValueCustomers(customerRepository.countHighValueCustomers(10000.0));

        // Average lifetime value
        double avgValue = allCustomers.stream()
                .mapToDouble(c -> c.getOrderStats().getTotalSpent())
                .average()
                .orElse(0.0);
        stats.setAverageLifetimeValue(avgValue);

        return stats;
    }

    // ===========================
    // DELETE
    // ===========================

    @CacheEvict(value = "customers", key = "#p0")
    public void deleteCustomer(String id) {
        logger.warn("Deleting customer: {}", id);
        customerRepository.deleteById(id);
    }
}
