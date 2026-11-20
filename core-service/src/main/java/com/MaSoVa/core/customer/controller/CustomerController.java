package com.MaSoVa.core.customer.controller;

import com.MaSoVa.core.customer.dto.request.*;
import com.MaSoVa.core.customer.dto.response.CustomerStatsResponse;
import com.MaSoVa.core.customer.dto.response.MessageResponse;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;
import com.MaSoVa.core.user.service.UserService;
import com.MaSoVa.shared.entity.User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

/**
 * Customer management — 13 canonical endpoints at /api/customers.
 * Removes: /api/v1/customers/*, /api/customers/user/{userId}, /email/*, /phone/*,
 *          /high-value, /top-spenders, /recently-active, /inactive, /birthdays/*,
 *          /marketing-opt-in, /sms-opt-in, /loyalty/tier/*, /tags (GET),
 *          /active, /search, /{id}/loyalty/points (old), /{id}/loyalty/redeem (old),
 *          /{id}/loyalty/max-redeemable, /{id}/preferences, /{id}/order-stats,
 *          /{id}/notes, /{id}/verify-email, /{id}/verify-phone, /{id}/tags (DELETE),
 *          /{id}/update-email, /{id}/gdpr, /{id}/hard
 * Internal-only: POST /api/customers/get-or-create (blocked at gateway per CLAUDE.md)
 */
@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer Management", description = "Customer profile, loyalty, addresses, tags")
public class CustomerController {

    private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

    private final CustomerService customerService;
    private final UserService userService;

    public CustomerController(CustomerService customerService, UserService userService) {
        this.customerService = customerService;
        this.userService = userService;
    }

    private String getStoreId(HttpServletRequest request) {
        Authentication authentication = authenticatedIdentity();
        String selected = request.getHeader("X-Selected-Store-Id");
        String assigned = (String) request.getAttribute("storeId");
        if (hasRole(authentication, "MANAGER")) {
            return selected != null ? selected : assigned;
        }
        return assigned;
    }

    private Authentication authenticatedIdentity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("Authentication required");
        }
        return authentication;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority()));
    }

    private boolean privileged(Authentication authentication, boolean allowStaff) {
        return hasRole(authentication, "MANAGER") || hasRole(authentication, "ASSISTANT_MANAGER")
                || allowStaff && hasRole(authentication, "STAFF");
    }

    /**
     * Loads the customer the caller may act on, or throws.
     * Customers may only reach their own profile (JWT subject is User.id; customer profile IDs are a
     * separate identity namespace). Managers, assistant managers and (when allowed) staff may only
     * reach customers of the store they are working in.
     */
    private Customer requireCustomerAccess(String id, boolean allowStaff, HttpServletRequest request) {
        Authentication authentication = authenticatedIdentity();
        if (privileged(authentication, allowStaff)) {
            Customer customer = customerService.getCustomerById(id)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            requireSameStore(customer, request);
            return customer;
        }
        if (!hasRole(authentication, "CUSTOMER")) throw new AccessDeniedException("Access denied");
        Customer customer = customerService.getCustomerById(id)
                .orElseThrow(() -> new NoSuchElementException("Customer not found"));
        if (!authentication.getName().equals(customer.getUserId())) {
            throw new AccessDeniedException("Access denied");
        }
        return customer;
    }

    private void requireSameStore(Customer customer, HttpServletRequest request) {
        String storeId = getStoreId(request);
        if (!belongsToStore(customer, storeId)) {
            log.warn("Cross-store customer access: caller store={}, customer={}", storeId, customer.getId());
            throw new AccessDeniedException("Cannot access a customer of another store");
        }
    }

    /** A customer belongs to every store they have ordered from (storeIds) and to their legacy storeId. */
    @SuppressWarnings("deprecation")
    private static boolean belongsToStore(Customer customer, String storeId) {
        if (storeId == null || storeId.isBlank()) {
            return false;
        }
        return storeId.equals(customer.getStoreId())
                || customer.getStoreIds() != null && customer.getStoreIds().contains(storeId);
    }

    // ── LIST ────────────────────────────────────────────────────────────────────

    /**
     * GET /api/customers?filter=&email=&phone=&userId=&tag=&tier=&search=
     * Replaces: GET /api/customers, /active, /search, /email/*, /phone/*,
     *           /user/*, /loyalty/tier/*, /tags, /high-value, /top-spenders, etc.
     */
    @GetMapping
    @Operation(summary = "List customers (query: filter, email, phone, userId, tag, tier, search)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<List<Customer>> getCustomers(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        Authentication authentication = authenticatedIdentity();
        if (!privileged(authentication, false)) {
            if (!hasRole(authentication, "CUSTOMER") || email != null || phone != null || tag != null
                    || tier != null || search != null
                    || userId != null && !authentication.getName().equals(userId)) {
                throw new AccessDeniedException("Access denied");
            }
            return customerService.getCustomerByUserId(authentication.getName())
                    .map(customer -> ResponseEntity.ok(List.of(customer)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        String storeId = getStoreId(request);
        if (email != null) {
            return customerService.getCustomerByEmail(email)
                    .filter(c -> belongsToStore(c, storeId))
                    .map(c -> ResponseEntity.ok(List.of(c)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (phone != null) {
            return customerService.getCustomerByPhone(phone)
                    .filter(c -> belongsToStore(c, storeId))
                    .map(c -> ResponseEntity.ok(List.of(c)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (userId != null) {
            return customerService.getCustomerByUserId(userId)
                    .filter(c -> belongsToStore(c, storeId))
                    .map(c -> ResponseEntity.ok(List.of(c)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (tier != null) {
            return ResponseEntity.ok(customerService.getCustomersByLoyaltyTierAndStore(storeId, tier.toUpperCase()));
        }
        if (tag != null) {
            return ResponseEntity.ok(customerService.getCustomersByTagsAndStore(storeId, List.of(tag)));
        }
        if (search != null) {
            return ResponseEntity.ok(customerService.searchCustomersByStoreId(storeId, search, 0, 50).getContent());
        }
        return ResponseEntity.ok(customerService.getAllCustomersByStoreId(storeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Create customer")
    public ResponseEntity<?> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Customer statistics")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<CustomerStatsResponse> getStats(HttpServletRequest request) {
        return ResponseEntity.ok(customerService.getCustomerStatsByStore(getStoreId(request)));
    }

    // ── SINGLE CUSTOMER ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get customer (includes loyalty + max redeemable)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> getCustomer(@PathVariable String id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(requireCustomerAccess(id, false, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update customer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody UpdateCustomerRequest request,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, false, httpRequest);
            if (!privileged(authenticatedIdentity(), false) && (request.getEmailVerified() != null
                    || request.getPhoneVerified() != null || request.getNote() != null
                    || request.getOrderStats() != null)) {
                throw new AccessDeniedException("Access denied");
            }
            return ResponseEntity.ok(customerService.updateCustomer(id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    // ── STATUS ───────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate customer")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> activate(@PathVariable String id, HttpServletRequest request) {
        try {
            requireCustomerAccess(id, false, request);
            return ResponseEntity.ok(customerService.activateCustomer(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate customer")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> deactivate(@PathVariable String id, HttpServletRequest request) {
        try {
            requireCustomerAccess(id, false, request);
            return ResponseEntity.ok(customerService.deactivateCustomer(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── LOYALTY ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/customers/{id}/loyalty — collapsed add/redeem
     * Body: { type: "EARNED"|"REDEEMED", points: N, description: "...", orderId: "..." }
     * Replaces: POST /loyalty/points and POST /loyalty/redeem
     */
    @PostMapping("/{id}/loyalty")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Add or redeem loyalty points (body: type=EARNED|REDEEMED, points, description)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> manageLoyalty(
            @PathVariable String id,
            @RequestBody AddLoyaltyPointsRequest request,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, true, httpRequest);
            boolean redemption = "REDEEMED".equals(request.getType()) || "REDEEM".equals(request.getType());
            if (!privileged(authenticatedIdentity(), true) && !redemption) {
                throw new AccessDeniedException("Access denied");
            }
            if (request.getPoints() <= 0) {
                throw new IllegalArgumentException("Points must be at least 1");
            }
            if (redemption) {
                Customer customer = customerService.redeemLoyaltyPoints(id, request.getPoints(), request.getOrderId());
                return ResponseEntity.ok(customer);
            }
            return ResponseEntity.ok(customerService.addLoyaltyPoints(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── ADDRESSES ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/addresses")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Add address")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> addAddress(
            @PathVariable String id,
            @Valid @RequestBody AddAddressRequest request,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, false, httpRequest);
            return ResponseEntity.ok(customerService.addAddress(id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PATCH /api/customers/{id}/addresses/{aid} — includes isDefault flag in body
     * Replaces: PATCH /addresses/{aid} and PATCH /addresses/{aid}/set-default
     */
    @PatchMapping("/{id}/addresses/{addressId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update address (includes isDefault flag in body)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> updateAddress(
            @PathVariable String id,
            @PathVariable String addressId,
            @Valid @RequestBody UpdateAddressRequest request,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, false, httpRequest);
            Customer customer = request.isDefaultOnly()
                    ? customerService.setDefaultAddress(id, addressId)
                    : customerService.updateAddress(id, addressId, request.toAddressRequest());
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/addresses/{addressId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Remove address")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> removeAddress(
            @PathVariable String id,
            @PathVariable String addressId,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, false, httpRequest);
            return ResponseEntity.ok(customerService.removeAddress(id, addressId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── TAGS ─────────────────────────────────────────────────────────────────────

    /**
     * POST /api/customers/{id}/tags — collapsed add/remove
     * Body: { add: ["tag1"], remove: ["tag2"] }
     * Replaces: POST /{id}/tags and DELETE /{id}/tags
     */
    @PostMapping("/{id}/tags")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Add/remove tags (body: add[], remove[])")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> manageTags(
            @PathVariable String id,
            @RequestBody Map<String, Set<String>> request,
            HttpServletRequest httpRequest) {
        try {
            Set<String> add = request.getOrDefault("add", Set.of());
            Set<String> remove = request.getOrDefault("remove", Set.of());
            Customer customer = requireCustomerAccess(id, false, httpRequest);
            if (!add.isEmpty()) customer = customerService.addTags(id, add);
            if (!remove.isEmpty()) customer = customerService.removeTags(id, remove);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── GDPR ─────────────────────────────────────────────────────────────────────

    /**
     * DELETE /api/customers/{id} — GDPR anonymise (soft delete)
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "GDPR anonymise (soft delete)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> gdprDelete(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "GDPR_REQUEST") String reason,
            HttpServletRequest httpRequest) {
        try {
            requireCustomerAccess(id, false, httpRequest);
            Customer anonymized = customerService.anonymizeAndDeleteCustomer(id, reason);
            return ResponseEntity.ok(Map.of(
                    "message", "Customer data anonymized successfully per GDPR requirements",
                    "customerId", id,
                    "deletedAt", anonymized.getDeletedAt()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── SELF-SERVICE PROFILE ─────────────────────────────────────────────────────

    /**
     * POST /api/customers/me — get or create the signed-in customer's own profile (checkout).
     * Body (optional): { "storeId": "..." } adds the store to the profile's stores.
     * Name, email and phone come from the caller's own account, never from the body:
     * get-or-create links an existing profile with the same email, so a body email would let
     * a caller take over someone else's profile.
     */
    @PostMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get or create the signed-in customer's own profile")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> ensureOwnProfile(@RequestBody(required = false) Map<String, Object> body) {
        String userId = authenticatedIdentity().getName();
        User user = userService.getUserByIdUncached(userId);
        User.PersonalInfo info = user.getPersonalInfo();
        if (info == null || info.getEmail() == null || info.getEmail().isBlank()) {
            log.warn("Account {} has no email; no customer profile can be created", userId);
            return ResponseEntity.unprocessableEntity()
                    .body(new MessageResponse("Add an email address to your account to check out."));
        }
        CreateCustomerRequest request = new CreateCustomerRequest(userId, info.getName(), info.getEmail(),
                info.getPhone() != null ? info.getPhone() : "");
        Object storeId = body != null ? body.get("storeId") : null;
        if (storeId instanceof String store && !store.isBlank()) {
            request.setStoreId(store);
        }
        try {
            return ResponseEntity.ok(customerService.getOrCreateCustomer(request));
        } catch (IllegalArgumentException e) {
            // A concurrent request may have just created this account's profile
            Optional<Customer> created = customerService.getCustomerByUserId(userId);
            if (created.isPresent()) {
                return ResponseEntity.ok(created.get());
            }
            // Another profile already uses this email or phone; the message names it, so keep it in the log only
            log.warn("Customer profile for account {} could not be created: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(
                    "Your email or phone number is already on another customer profile. Contact the store to merge them."));
        }
    }

    // ── INTERNAL — blocked at gateway ─────────────────────────────────────────────

    /**
     * POST /api/customers/get-or-create — internal service-to-service only.
     * This endpoint is BLOCKED at the API Gateway (denyAll). Direct service calls only.
     */
    @PostMapping("/get-or-create")
    @Operation(summary = "Get or create customer (internal only — blocked at gateway)")
    public ResponseEntity<?> getOrCreate(@Valid @RequestBody CreateCustomerRequest request) {
        try {
            return ResponseEntity.ok(customerService.getOrCreateCustomer(request));
        } catch (Exception e) {
            log.error("Error in get-or-create customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to get or create customer"));
        }
    }
}
