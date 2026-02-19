package com.MaSoVa.core.customer.controller;

import com.MaSoVa.core.customer.dto.request.*;
import com.MaSoVa.core.customer.dto.response.CustomerStatsResponse;
import com.MaSoVa.core.customer.dto.response.MessageResponse;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;
import com.MaSoVa.shared.config.ApiVersionConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Customer Controller - Week 4: API Versioning Applied
 */
@RestController
@RequestMapping({ApiVersionConfig.V1 + "/customers", ApiVersionConfig.LEGACY + "/customers"})
@Tag(name = "Customer Management", description = "Customer profile, loyalty, preferences, and address management")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);
    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /**
     * Extract storeId from HTTP headers
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    // ===========================
    // CREATE
    // ===========================

    @PostMapping
    @Operation(summary = "Create new customer", description = "Register a new customer profile")
    public ResponseEntity<?> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        try {
            Customer customer = customerService.createCustomer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(customer);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to create customer"));
        }
    }

    @PostMapping("/get-or-create")
    @Operation(summary = "Get or create customer", description = "Returns existing customer or creates new one if not found")
    public ResponseEntity<?> getOrCreateCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        try {
            Customer customer = customerService.getOrCreateCustomer(request);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            logger.error("Error getting or creating customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to get or create customer"));
        }
    }

    // ===========================
    // READ
    // ===========================

    // Only customers and managers can view customer profiles
    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> getCustomerById(@PathVariable("id") String id, HttpServletRequest request) {
        try {
            Customer customer = customerService.getCustomerById(id)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));

            // IDOR Protection: Validate store ownership
            String userStoreId = getStoreIdFromHeaders(request);
            String userType = request.getHeader("X-User-Type");

            // Customers can only view their own profile or profiles from their store
            // Managers/Assistant Managers can view any customer from their store
            if (userStoreId != null && !userStoreId.isEmpty() &&
                customer.getStoreId() != null && !customer.getStoreId().isEmpty()) {
                if (!userStoreId.equals(customer.getStoreId())) {
                    logger.warn("IDOR attempt: User from store {} tried to access customer from store {}",
                               userStoreId, customer.getStoreId());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new MessageResponse("Access denied: Cannot access customer from different store"));
                }
            }

            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Only customers can view their own profile by userId
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get customer by user ID")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getCustomerByUserId(@PathVariable("userId") String userId) {
        try {
            Customer customer = customerService.getCustomerByUserId(userId)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Get customer by email")
    public ResponseEntity<?> getCustomerByEmail(@PathVariable("email") String email) {
        try {
            Customer customer = customerService.getCustomerByEmail(email)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/phone/{phone}")
    @Operation(summary = "Get customer by phone")
    public ResponseEntity<?> getCustomerByPhone(@PathVariable("phone") String phone) {
        try {
            Customer customer = customerService.getCustomerByPhone(phone)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @Operation(summary = "Get all customers")
    public ResponseEntity<List<Customer>> getAllCustomers(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting all customers for store: {}", storeId);
        List<Customer> customers = customerService.getAllCustomersByStoreId(storeId);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active customers")
    public ResponseEntity<List<Customer>> getActiveCustomers(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting active customers for store: {}", storeId);
        List<Customer> customers = customerService.getActiveCustomersByStoreId(storeId);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/search")
    @Operation(summary = "Search customers", description = "Search by name, email, or phone")
    public ResponseEntity<Page<Customer>> searchCustomers(
            @RequestParam(name = "query") String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Searching customers with query: {} for store: {}", query, storeId);
        Page<Customer> customers = customerService.searchCustomersByStoreId(storeId, query, page, size);
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // UPDATE
    // ===========================

    @PutMapping("/{id}")
    @Operation(summary = "Update customer profile")
    public ResponseEntity<?> updateCustomer(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        try {
            Customer updated = customerService.updateCustomer(id, request);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to update customer"));
        }
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate customer")
    public ResponseEntity<?> deactivateCustomer(@PathVariable("id") String id) {
        try {
            Customer customer = customerService.deactivateCustomer(id);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate customer")
    public ResponseEntity<?> activateCustomer(@PathVariable("id") String id) {
        try {
            Customer customer = customerService.activateCustomer(id);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===========================
    // ADDRESS MANAGEMENT
    // ===========================

    @PostMapping("/{id}/addresses")
    @Operation(summary = "Add address to customer")
    public ResponseEntity<?> addAddress(
            @PathVariable("id") String id,
            @Valid @RequestBody AddAddressRequest request) {
        try {
            Customer customer = customerService.addAddress(id, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{customerId}/addresses/{addressId}")
    @Operation(summary = "Update address")
    public ResponseEntity<?> updateAddress(
            @PathVariable("customerId") String customerId,
            @PathVariable("addressId") String addressId,
            @Valid @RequestBody AddAddressRequest request) {
        try {
            Customer customer = customerService.updateAddress(customerId, addressId, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{customerId}/addresses/{addressId}")
    @Operation(summary = "Remove address from customer")
    public ResponseEntity<?> removeAddress(
            @PathVariable("customerId") String customerId,
            @PathVariable("addressId") String addressId) {
        try {
            Customer customer = customerService.removeAddress(customerId, addressId);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{customerId}/addresses/{addressId}/set-default")
    @Operation(summary = "Set default address")
    public ResponseEntity<?> setDefaultAddress(
            @PathVariable("customerId") String customerId,
            @PathVariable("addressId") String addressId) {
        try {
            Customer customer = customerService.setDefaultAddress(customerId, addressId);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===========================
    // LOYALTY MANAGEMENT
    // ===========================

    @PostMapping("/{id}/loyalty/points")
    @Operation(summary = "Add or redeem loyalty points")
    public ResponseEntity<?> addLoyaltyPoints(
            @PathVariable("id") String id,
            @Valid @RequestBody AddLoyaltyPointsRequest request) {
        try {
            Customer customer = customerService.addLoyaltyPoints(id, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/loyalty/redeem")
    @Operation(summary = "Redeem loyalty points for discount")
    public ResponseEntity<?> redeemLoyaltyPoints(
            @PathVariable("id") String id,
            @RequestParam("points") int points,
            @RequestParam("orderId") String orderId) {
        try {
            Customer customer = customerService.redeemLoyaltyPoints(id, points, orderId);
            double discount = customerService.calculatePointsDiscount(points);
            return ResponseEntity.ok(java.util.Map.of(
                    "customer", customer,
                    "pointsRedeemed", points,
                    "discountAmount", discount
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/loyalty/max-redeemable")
    @Operation(summary = "Get maximum redeemable points for order")
    public ResponseEntity<?> getMaxRedeemablePoints(
            @PathVariable("id") String id,
            @RequestParam("orderTotal") double orderTotal) {
        try {
            int maxPoints = customerService.calculateMaxRedeemablePoints(id, orderTotal);
            double maxDiscount = customerService.calculatePointsDiscount(maxPoints);
            return ResponseEntity.ok(java.util.Map.of(
                    "maxRedeemablePoints", maxPoints,
                    "maxDiscountAmount", maxDiscount,
                    "redemptionRate", "100 points = ₹50"
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/loyalty/tier/{tier}")
    @Operation(summary = "Get customers by loyalty tier")
    public ResponseEntity<List<Customer>> getCustomersByTier(
            @PathVariable("tier") String tier,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting customers by tier: {} for store: {}", tier, storeId);
        List<Customer> customers = customerService.getCustomersByLoyaltyTierAndStore(storeId, tier.toUpperCase());
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // PREFERENCES
    // ===========================

    @PutMapping("/{id}/preferences")
    @Operation(summary = "Update customer preferences")
    public ResponseEntity<?> updatePreferences(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        try {
            Customer customer = customerService.updatePreferences(id, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===========================
    // ORDER STATS
    // ===========================

    @PostMapping("/{id}/order-stats")
    @Operation(summary = "Update order statistics", description = "Called by Order Service after order completion")
    public ResponseEntity<?> updateOrderStats(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateOrderStatsRequest request) {
        try {
            Customer customer = customerService.updateOrderStats(id, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/update-email")
    @Operation(summary = "Update customer email", description = "Called by Order Service to update walk-in customer emails")
    public ResponseEntity<?> updateCustomerEmail(
            @PathVariable("id") String id,
            @RequestBody java.util.Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Email is required"));
            }

            Customer customer = customerService.updateEmail(id, email);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating customer email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to update email"));
        }
    }

    // ===========================
    // NOTES
    // ===========================

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add note to customer profile")
    public ResponseEntity<?> addNote(
            @PathVariable("id") String id,
            @Valid @RequestBody AddCustomerNoteRequest request) {
        try {
            Customer customer = customerService.addNote(id, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===========================
    // VERIFICATION
    // ===========================

    @PatchMapping("/{id}/verify-email")
    @Operation(summary = "Mark email as verified")
    public ResponseEntity<?> verifyEmail(@PathVariable("id") String id) {
        try {
            Customer customer = customerService.verifyEmail(id);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/verify-phone")
    @Operation(summary = "Mark phone as verified")
    public ResponseEntity<?> verifyPhone(@PathVariable("id") String id) {
        try {
            Customer customer = customerService.verifyPhone(id);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===========================
    // TAGS
    // ===========================

    @PostMapping("/{id}/tags")
    @Operation(summary = "Add tags to customer")
    public ResponseEntity<?> addTags(
            @PathVariable("id") String id,
            @RequestBody Set<String> tags) {
        try {
            Customer customer = customerService.addTags(id, tags);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/tags")
    @Operation(summary = "Remove tags from customer")
    public ResponseEntity<?> removeTags(
            @PathVariable("id") String id,
            @RequestBody Set<String> tags) {
        try {
            Customer customer = customerService.removeTags(id, tags);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/tags")
    @Operation(summary = "Get customers by tags")
    public ResponseEntity<List<Customer>> getCustomersByTags(
            @RequestParam List<String> tags,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting customers by tags for store: {}", storeId);
        List<Customer> customers = customerService.getCustomersByTagsAndStore(storeId, tags);
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // QUERIES
    // ===========================

    @GetMapping("/high-value")
    @Operation(summary = "Get high-value customers", description = "Customers with spending above threshold")
    public ResponseEntity<List<Customer>> getHighValueCustomers(
            @RequestParam(defaultValue = "10000") double minSpending,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting high-value customers (min spending: {}) for store: {}", minSpending, storeId);
        List<Customer> customers = customerService.getHighValueCustomersByStore(storeId, minSpending);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/top-spenders")
    @Operation(summary = "Get top spenders")
    public ResponseEntity<List<Customer>> getTopSpenders(
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting top {} spenders for store: {}", limit, storeId);
        List<Customer> customers = customerService.getTopSpendersByStore(storeId, limit);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/recently-active")
    @Operation(summary = "Get recently active customers")
    public ResponseEntity<List<Customer>> getRecentlyActiveCustomers(
            @RequestParam(name = "days", defaultValue = "30") int days,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting recently active customers (within {} days) for store: {}", days, storeId);
        List<Customer> customers = customerService.getRecentlyActiveCustomersByStore(storeId, days);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/inactive")
    @Operation(summary = "Get inactive customers")
    public ResponseEntity<List<Customer>> getInactiveCustomers(
            @RequestParam(name = "days", defaultValue = "90") int days,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting inactive customers (inactive for {} days) for store: {}", days, storeId);
        List<Customer> customers = customerService.getInactiveCustomersByStore(storeId, days);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/birthdays/today")
    @Operation(summary = "Get customers with birthday today")
    public ResponseEntity<List<Customer>> getBirthdayCustomersToday(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting birthday customers for store: {}", storeId);
        List<Customer> customers = customerService.getBirthdayCustomersTodayByStore(storeId);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/marketing-opt-in")
    @Operation(summary = "Get customers opted in for marketing")
    public ResponseEntity<List<Customer>> getMarketingOptInCustomers(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting marketing opt-in customers for store: {}", storeId);
        List<Customer> customers = customerService.getMarketingOptInCustomersByStore(storeId);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/sms-opt-in")
    @Operation(summary = "Get customers opted in for SMS")
    public ResponseEntity<List<Customer>> getSmsOptInCustomers(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting SMS opt-in customers for store: {}", storeId);
        List<Customer> customers = customerService.getSmsOptInCustomersByStore(storeId);
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // STATISTICS
    // ===========================

    @GetMapping("/stats")
    @Operation(summary = "Get customer statistics")
    public ResponseEntity<CustomerStatsResponse> getCustomerStats(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting customer statistics for store: {}", storeId);
        CustomerStatsResponse stats = customerService.getCustomerStatsByStore(storeId);
        return ResponseEntity.ok(stats);
    }

    // ===========================
    // GDPR DELETE / ANONYMIZATION
    // ===========================

    /**
     * GDPR-compliant deletion: Anonymizes customer data instead of hard delete.
     * This is the recommended deletion method for GDPR compliance.
     */
    @DeleteMapping("/{id}/gdpr")
    @Operation(summary = "GDPR Delete (Anonymize)", description = "GDPR-compliant deletion - anonymizes customer PII")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> gdprDeleteCustomer(
            @PathVariable("id") String id,
            @RequestParam(name = "reason", defaultValue = "GDPR_REQUEST") String reason) {
        try {
            Customer anonymized = customerService.anonymizeAndDeleteCustomer(id, reason);
            return ResponseEntity.ok(java.util.Map.of(
                    "message", "Customer data anonymized successfully per GDPR requirements",
                    "customerId", id,
                    "deletionReason", reason,
                    "deletedAt", anonymized.getDeletedAt()
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error anonymizing customer for GDPR", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to process GDPR deletion request"));
        }
    }

    /**
     * Hard delete - Only for managers, after data has been anonymized.
     * Use with extreme caution - this permanently removes all customer data.
     */
    @DeleteMapping("/{id}/hard")
    @Operation(summary = "Hard Delete", description = "Permanently delete customer record (requires prior anonymization)")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> hardDeleteCustomer(@PathVariable("id") String id) {
        try {
            customerService.hardDeleteCustomer(id);
            return ResponseEntity.ok(new MessageResponse("Customer permanently deleted"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error hard deleting customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete customer"));
        }
    }

    /**
     * @deprecated Use /gdpr endpoint for GDPR-compliant deletion.
     * This endpoint is kept for backwards compatibility but calls the GDPR-compliant method.
     */
    @Deprecated
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer (deprecated)", description = "Use DELETE /{id}/gdpr instead for GDPR compliance")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> deleteCustomer(@PathVariable("id") String id) {
        logger.warn("Deprecated DELETE endpoint called - redirecting to GDPR-compliant deletion");
        try {
            customerService.anonymizeAndDeleteCustomer(id, "ACCOUNT_CLOSURE");
            return ResponseEntity.ok(new MessageResponse("Customer deleted (anonymized) successfully"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete customer"));
        }
    }
}
