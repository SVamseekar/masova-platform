package com.MaSoVa.customer.controller;

import com.MaSoVa.customer.dto.request.*;
import com.MaSoVa.customer.dto.response.CustomerStatsResponse;
import com.MaSoVa.customer.dto.response.MessageResponse;
import com.MaSoVa.customer.entity.Customer;
import com.MaSoVa.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer Management", description = "Customer profile, loyalty, preferences, and address management")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);
    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
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

    // ===========================
    // READ
    // ===========================

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<?> getCustomerById(@PathVariable("id") String id) {
        try {
            Customer customer = customerService.getCustomerById(id)
                    .orElseThrow(() -> new NoSuchElementException("Customer not found"));
            return ResponseEntity.ok(customer);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get customer by user ID")
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
    public ResponseEntity<List<Customer>> getAllCustomers() {
        List<Customer> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active customers")
    public ResponseEntity<List<Customer>> getActiveCustomers() {
        List<Customer> customers = customerService.getActiveCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/search")
    @Operation(summary = "Search customers", description = "Search by name, email, or phone")
    public ResponseEntity<Page<Customer>> searchCustomers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Customer> customers = customerService.searchCustomers(query, page, size);
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

    @GetMapping("/loyalty/tier/{tier}")
    @Operation(summary = "Get customers by loyalty tier")
    public ResponseEntity<List<Customer>> getCustomersByTier(@PathVariable("tier") String tier) {
        List<Customer> customers = customerService.getCustomersByLoyaltyTier(tier.toUpperCase());
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
    public ResponseEntity<List<Customer>> getCustomersByTags(@RequestParam List<String> tags) {
        List<Customer> customers = customerService.getCustomersByTags(tags);
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // QUERIES
    // ===========================

    @GetMapping("/high-value")
    @Operation(summary = "Get high-value customers", description = "Customers with spending above threshold")
    public ResponseEntity<List<Customer>> getHighValueCustomers(
            @RequestParam(defaultValue = "10000") double minSpending) {
        List<Customer> customers = customerService.getHighValueCustomers(minSpending);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/top-spenders")
    @Operation(summary = "Get top spenders")
    public ResponseEntity<List<Customer>> getTopSpenders(
            @RequestParam(defaultValue = "10") int limit) {
        List<Customer> customers = customerService.getTopSpenders(limit);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/recently-active")
    @Operation(summary = "Get recently active customers")
    public ResponseEntity<List<Customer>> getRecentlyActiveCustomers(
            @RequestParam(defaultValue = "30") int days) {
        List<Customer> customers = customerService.getRecentlyActiveCustomers(days);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/inactive")
    @Operation(summary = "Get inactive customers")
    public ResponseEntity<List<Customer>> getInactiveCustomers(
            @RequestParam(defaultValue = "90") int days) {
        List<Customer> customers = customerService.getInactiveCustomers(days);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/birthdays/today")
    @Operation(summary = "Get customers with birthday today")
    public ResponseEntity<List<Customer>> getBirthdayCustomersToday() {
        List<Customer> customers = customerService.getBirthdayCustomersToday();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/marketing-opt-in")
    @Operation(summary = "Get customers opted in for marketing")
    public ResponseEntity<List<Customer>> getMarketingOptInCustomers() {
        List<Customer> customers = customerService.getMarketingOptInCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/sms-opt-in")
    @Operation(summary = "Get customers opted in for SMS")
    public ResponseEntity<List<Customer>> getSmsOptInCustomers() {
        List<Customer> customers = customerService.getSmsOptInCustomers();
        return ResponseEntity.ok(customers);
    }

    // ===========================
    // STATISTICS
    // ===========================

    @GetMapping("/stats")
    @Operation(summary = "Get customer statistics")
    public ResponseEntity<CustomerStatsResponse> getCustomerStats() {
        CustomerStatsResponse stats = customerService.getCustomerStats();
        return ResponseEntity.ok(stats);
    }

    // ===========================
    // DELETE
    // ===========================

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer", description = "Permanently delete customer (use with caution)")
    public ResponseEntity<?> deleteCustomer(@PathVariable("id") String id) {
        try {
            customerService.deleteCustomer(id);
            return ResponseEntity.ok(new MessageResponse("Customer deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete customer"));
        }
    }
}
