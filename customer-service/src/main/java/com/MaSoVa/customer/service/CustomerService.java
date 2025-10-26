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

    @Value("${MaSoVa.customer.loyalty.points-per-rupee:1}")
    private int pointsPerRupee;

    @Value("${MaSoVa.customer.loyalty.signup-bonus-points:100}")
    private int signupBonusPoints;

    @Value("${MaSoVa.customer.loyalty.birthday-bonus-points:200}")
    private int birthdayBonusPoints;

    @Value("${MaSoVa.customer.loyalty.tier-thresholds.silver:1000}")
    private int silverThreshold;

    @Value("${MaSoVa.customer.loyalty.tier-thresholds.gold:5000}")
    private int goldThreshold;

    @Value("${MaSoVa.customer.loyalty.tier-thresholds.platinum:10000}")
    private int platinumThreshold;

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

    @Cacheable(value = "customers", key = "#id")
    public Optional<Customer> getCustomerById(String id) {
        logger.debug("Fetching customer by ID: {}", id);
        return customerRepository.findById(id);
    }

    @Cacheable(value = "customers", key = "'userId:' + #userId")
    public Optional<Customer> getCustomerByUserId(String userId) {
        logger.debug("Fetching customer by userId: {}", userId);
        return customerRepository.findByUserId(userId);
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

    @CacheEvict(value = "customers", key = "#id")
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

    @CacheEvict(value = "customers", key = "#id")
    public Customer deactivateCustomer(String id) {
        logger.info("Deactivating customer: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));
        customer.setActive(false);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#id")
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

    @CacheEvict(value = "customers", key = "#customerId")
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

    @CacheEvict(value = "customers", key = "#customerId")
    public Customer removeAddress(String customerId, String addressId) {
        logger.info("Removing address {} for customer: {}", addressId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        customer.getAddresses().removeIf(addr -> addr.getId().equals(addressId));

        // If removed address was default, set first address as default
        if (addressId.equals(customer.getDefaultAddressId()) && !customer.getAddresses().isEmpty()) {
            customer.getAddresses().get(0).setDefault(true);
            customer.setDefaultAddressId(customer.getAddresses().get(0).getId());
        } else if (customer.getAddresses().isEmpty()) {
            customer.setDefaultAddressId(null);
        }

        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#customerId")
    public Customer setDefaultAddress(String customerId, String addressId) {
        logger.info("Setting default address {} for customer: {}", addressId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));

        boolean addressFound = false;
        for (CustomerAddress address : customer.getAddresses()) {
            if (address.getId().equals(addressId)) {
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

    @CacheEvict(value = "customers", key = "#customerId")
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

    // ===========================
    // PREFERENCES MANAGEMENT
    // ===========================

    @CacheEvict(value = "customers", key = "#customerId")
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

    @CacheEvict(value = "customers", key = "#customerId")
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

            // Award loyalty points
            int pointsToAdd = (int) (request.getOrderTotal() * pointsPerRupee);
            AddLoyaltyPointsRequest loyaltyRequest = new AddLoyaltyPointsRequest(
                    pointsToAdd, "EARNED", "Order #" + request.getOrderId());
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

    @CacheEvict(value = "customers", key = "#customerId")
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

    @CacheEvict(value = "customers", key = "#customerId")
    public Customer verifyEmail(String customerId) {
        logger.info("Verifying email for customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.setEmailVerified(true);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#customerId")
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

    @CacheEvict(value = "customers", key = "#customerId")
    public Customer addTags(String customerId, Set<String> tags) {
        logger.info("Adding tags to customer: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + customerId));
        customer.getTags().addAll(tags);
        return customerRepository.save(customer);
    }

    @CacheEvict(value = "customers", key = "#customerId")
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

    @CacheEvict(value = "customers", key = "#id")
    public void deleteCustomer(String id) {
        logger.warn("Deleting customer: {}", id);
        customerRepository.deleteById(id);
    }
}
