package com.MaSoVa.core.customer.controller;

import com.MaSoVa.core.customer.dto.request.*;
import com.MaSoVa.core.customer.dto.response.CustomerStatsResponse;
import com.MaSoVa.core.customer.dto.response.MessageResponse;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;

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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
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

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    private String getStoreId(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selected = request.getHeader("X-Selected-Store-Id");
        String assigned = request.getHeader("X-User-Store-Id");
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selected != null ? selected : assigned;
        }
        return assigned;
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
        String storeId = getStoreId(request);
        if (email != null) {
            return customerService.getCustomerByEmail(email)
                    .map(c -> ResponseEntity.ok(List.of(c)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (phone != null) {
            return customerService.getCustomerByPhone(phone)
                    .map(c -> ResponseEntity.ok(List.of(c)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (userId != null) {
            return customerService.getCustomerByUserId(userId)
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
            Customer customer = customerService.getCustomerById(id)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("#id == authentication.name or hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update customer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        try {
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
    public ResponseEntity<?> activate(@PathVariable String id) {
        try {
            return ResponseEntity.ok(customerService.activateCustomer(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate customer")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<?> deactivate(@PathVariable String id) {
        try {
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
    @Operation(summary = "Add or redeem loyalty points (body: type=EARNED|REDEEMED, points, description)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> manageLoyalty(
            @PathVariable String id,
            @RequestBody AddLoyaltyPointsRequest request) {
        try {
            if ("REDEEMED".equals(request.getType()) || "REDEEM".equals(request.getType())) {
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
    @Operation(summary = "Add address")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> addAddress(
            @PathVariable String id,
            @Valid @RequestBody AddAddressRequest request) {
        try {
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
    @Operation(summary = "Update address (includes isDefault flag in body)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> updateAddress(
            @PathVariable String id,
            @PathVariable String addressId,
            @Valid @RequestBody AddAddressRequest request) {
        try {
            Customer customer = customerService.updateAddress(id, addressId, request);
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/addresses/{addressId}")
    @Operation(summary = "Remove address")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> removeAddress(
            @PathVariable String id,
            @PathVariable String addressId) {
        try {
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
    @Operation(summary = "Add/remove tags (body: add[], remove[])")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> manageTags(
            @PathVariable String id,
            @RequestBody Map<String, Set<String>> request) {
        try {
            Set<String> add = request.getOrDefault("add", Set.of());
            Set<String> remove = request.getOrDefault("remove", Set.of());
            Customer customer = customerService.getCustomerById(id)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
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
            @RequestParam(required = false, defaultValue = "GDPR_REQUEST") String reason) {
        try {
            Customer anonymized = customerService.anonymizeAndDeleteCustomer(id, reason);
            return ResponseEntity.ok(Map.of(
                    "message", "Customer data anonymized successfully per GDPR requirements",
                    "customerId", id,
                    "deletedAt", anonymized.getDeletedAt()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
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
