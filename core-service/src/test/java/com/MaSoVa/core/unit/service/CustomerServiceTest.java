package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.customer.dto.request.*;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.entity.Customer.*;
import com.MaSoVa.core.customer.repository.CustomerRepository;
import com.MaSoVa.core.customer.service.CustomerAuditService;
import com.MaSoVa.core.customer.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CustomerService Unit Tests")
class CustomerServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerAuditService auditService;

    @InjectMocks private CustomerService customerService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(customerService, "rupeesPerPoint", 10);
        ReflectionTestUtils.setField(customerService, "signupBonusPoints", 100);
        ReflectionTestUtils.setField(customerService, "birthdayBonusPoints", 200);
        ReflectionTestUtils.setField(customerService, "pointsRedemptionRate", 100);
        ReflectionTestUtils.setField(customerService, "rupeesPerRedemption", 50);
        ReflectionTestUtils.setField(customerService, "minPointsToRedeem", 100);
        ReflectionTestUtils.setField(customerService, "maxRedemptionPercent", 50);
        ReflectionTestUtils.setField(customerService, "silverThreshold", 1000);
        ReflectionTestUtils.setField(customerService, "goldThreshold", 5000);
        ReflectionTestUtils.setField(customerService, "platinumThreshold", 10000);
        ReflectionTestUtils.setField(customerService, "bronzeMultiplier", 1.0);
        ReflectionTestUtils.setField(customerService, "silverMultiplier", 1.25);
        ReflectionTestUtils.setField(customerService, "goldMultiplier", 1.5);
        ReflectionTestUtils.setField(customerService, "platinumMultiplier", 2.0);
    }

    private Customer buildCustomer(String id, String email) {
        Customer c = new Customer();
        c.setId(id);
        c.setUserId("user-" + id);
        c.setEmail(email);
        c.setPhone("9876543210");
        c.setName("Test Customer");
        c.setActive(true);
        LoyaltyInfo loyalty = new LoyaltyInfo();
        loyalty.setTotalPoints(0);
        loyalty.setPointsEarned(0);
        loyalty.setPointsRedeemed(0);
        loyalty.setTier("BRONZE");
        loyalty.setPointHistory(new ArrayList<>());
        c.setLoyaltyInfo(loyalty);
        c.setAddresses(new ArrayList<>());
        c.setNotes(new ArrayList<>());
        c.setTags(new HashSet<>());
        c.setPreferences(new CustomerPreferences());
        c.setOrderStats(new OrderStats());
        return c;
    }

    private CreateCustomerRequest buildCreateRequest(String userId, String email, String phone) {
        CreateCustomerRequest req = new CreateCustomerRequest();
        req.setUserId(userId);
        req.setEmail(email);
        req.setPhone(phone);
        req.setName("Test Customer");
        req.setStoreId("store-1");
        return req;
    }

    // ===========================
    // getOrCreateCustomer
    // ===========================

    @Nested
    @DisplayName("getOrCreateCustomer")
    class GetOrCreateCustomer {

        @Test
        @DisplayName("returns existing customer when found by userId")
        void returnsExistingByUserId() {
            Customer existing = buildCustomer("c1", "test@example.com");
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(existing));

            CreateCustomerRequest req = buildCreateRequest("user-c1", "test@example.com", "9876543210");
            Customer result = customerService.getOrCreateCustomer(req);

            assertThat(result.getId()).isEqualTo("c1");
            verify(customerRepository, never()).save(any());
        }

        @Test
        @DisplayName("adds storeId to existing customer if not already present")
        void addsStoreIdToExisting() {
            Customer existing = buildCustomer("c1", "test@example.com");
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(existing));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateCustomerRequest req = buildCreateRequest("user-c1", "test@example.com", "9876543210");
            req.setStoreId("store-new");
            customerService.getOrCreateCustomer(req);

            verify(customerRepository).save(argThat(c -> c.getStoreIds().contains("store-new")));
        }

        @Test
        @DisplayName("updates userId when existing customer found by email with different userId")
        void updatesUserIdOnEmailMatch() {
            Customer existing = buildCustomer("c1", "test@example.com");
            existing.setUserId("old-user-id");
            when(customerRepository.findByUserId("new-user-id")).thenReturn(Optional.empty());
            when(customerRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existing));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateCustomerRequest req = buildCreateRequest("new-user-id", "test@example.com", "9876543210");
            Customer result = customerService.getOrCreateCustomer(req);

            assertThat(result.getUserId()).isEqualTo("new-user-id");
        }

        @Test
        @DisplayName("creates new customer when none found by userId or email")
        void createsNewCustomer() {
            when(customerRepository.findByUserId("new-user")).thenReturn(Optional.empty());
            when(customerRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(customerRepository.findByUserId("new-user")).thenReturn(Optional.empty());
            when(customerRepository.existsByStoreIdAndEmail(any(), any())).thenReturn(false);
            when(customerRepository.existsByStoreIdAndPhone(any(), any())).thenReturn(false);
            Customer saved = buildCustomer("c2", "new@example.com");
            when(customerRepository.save(any())).thenReturn(saved);

            CreateCustomerRequest req = buildCreateRequest("new-user", "new@example.com", "9876543210");
            Customer result = customerService.getOrCreateCustomer(req);

            assertThat(result.getId()).isEqualTo("c2");
        }
    }

    // ===========================
    // createCustomer
    // ===========================

    @Nested
    @DisplayName("createCustomer")
    class CreateCustomer {

        @Test
        @DisplayName("throws when customer with userId already exists")
        void throwsOnDuplicateUserId() {
            Customer existing = buildCustomer("c1", "test@example.com");
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(existing));

            CreateCustomerRequest req = buildCreateRequest("user-c1", "test@example.com", "9876543210");
            assertThatThrownBy(() -> customerService.createCustomer(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("throws when email already exists in store")
        void throwsOnDuplicateEmailInStore() {
            when(customerRepository.findByUserId(any())).thenReturn(Optional.empty());
            when(customerRepository.existsByStoreIdAndEmail("store-1", "dup@example.com")).thenReturn(true);

            CreateCustomerRequest req = buildCreateRequest("new-user", "dup@example.com", "9876543210");
            assertThatThrownBy(() -> customerService.createCustomer(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("email already exists");
        }

        @Test
        @DisplayName("throws when phone already exists in store")
        void throwsOnDuplicatePhoneInStore() {
            when(customerRepository.findByUserId(any())).thenReturn(Optional.empty());
            when(customerRepository.existsByStoreIdAndEmail(any(), any())).thenReturn(false);
            when(customerRepository.existsByStoreIdAndPhone("store-1", "9876543210")).thenReturn(true);

            CreateCustomerRequest req = buildCreateRequest("new-user", "new@example.com", "9876543210");
            assertThatThrownBy(() -> customerService.createCustomer(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("phone already exists");
        }

        @Test
        @DisplayName("creates customer with signup bonus points")
        void createsWithSignupBonus() {
            when(customerRepository.findByUserId(any())).thenReturn(Optional.empty());
            when(customerRepository.existsByStoreIdAndEmail(any(), any())).thenReturn(false);
            when(customerRepository.existsByStoreIdAndPhone(any(), any())).thenReturn(false);
            Customer saved = buildCustomer("c1", "new@example.com");
            saved.getLoyaltyInfo().setTotalPoints(100);
            when(customerRepository.save(any())).thenReturn(saved);

            CreateCustomerRequest req = buildCreateRequest("new-user", "new@example.com", "9876543210");
            Customer result = customerService.createCustomer(req);

            verify(customerRepository).save(argThat(c ->
                    c.getLoyaltyInfo().getTotalPoints() == 100 &&
                    "BRONZE".equals(c.getLoyaltyInfo().getTier())));
        }
    }

    // ===========================
    // updateCustomer
    // ===========================

    @Nested
    @DisplayName("updateCustomer")
    class UpdateCustomer {

        @Test
        @DisplayName("throws when customer not found")
        void throwsWhenNotFound() {
            when(customerRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> customerService.updateCustomer("missing", new UpdateCustomerRequest()))
                    .isInstanceOf(NoSuchElementException.class);
        }

        @Test
        @DisplayName("throws when new email already in use by another customer")
        void throwsOnDuplicateEmail() {
            Customer existing = buildCustomer("c1", "old@example.com");
            Customer other = buildCustomer("c2", "taken@example.com");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(existing));
            when(customerRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(other));

            UpdateCustomerRequest req = new UpdateCustomerRequest();
            req.setEmail("taken@example.com");

            assertThatThrownBy(() -> customerService.updateCustomer("c1", req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email already in use");
        }

        @Test
        @DisplayName("resets emailVerified when email changes")
        void resetsEmailVerifiedOnChange() {
            Customer existing = buildCustomer("c1", "old@example.com");
            existing.setEmailVerified(true);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(existing));
            when(customerRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateCustomerRequest req = new UpdateCustomerRequest();
            req.setEmail("new@example.com");
            customerService.updateCustomer("c1", req);

            verify(customerRepository).save(argThat(c -> !c.isEmailVerified()));
        }
    }

    // ===========================
    // Address management
    // ===========================

    @Nested
    @DisplayName("addAddress")
    class AddAddress {

        @Test
        @DisplayName("first address is set as default automatically")
        void firstAddressBecomesDefault() {
            Customer customer = buildCustomer("c1", "test@example.com");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AddAddressRequest req = new AddAddressRequest();
            req.setLabel("Home");
            req.setAddressLine1("123 Main St");
            req.setCity("Chennai");
            req.setState("TN");
            req.setPostalCode("600001");
            req.setCountry("IN");

            Customer result = customerService.addAddress("c1", req);

            assertThat(result.getAddresses()).hasSize(1);
            assertThat(result.getAddresses().get(0).isDefault()).isTrue();
            assertThat(result.getDefaultAddressId()).isNotNull();
        }

        @Test
        @DisplayName("throws when customer not found")
        void throwsWhenNotFound() {
            when(customerRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> customerService.addAddress("missing", new AddAddressRequest()))
                    .isInstanceOf(NoSuchElementException.class);
        }
    }

    @Nested
    @DisplayName("removeAddress")
    class RemoveAddress {

        @Test
        @DisplayName("reassigns default to first remaining address when default is removed")
        void reassignsDefaultOnRemoval() {
            Customer customer = buildCustomer("c1", "test@example.com");
            CustomerAddress addr1 = new CustomerAddress();
            addr1.setId("addr-1");
            addr1.setDefault(true);
            CustomerAddress addr2 = new CustomerAddress();
            addr2.setId("addr-2");
            addr2.setDefault(false);
            customer.getAddresses().add(addr1);
            customer.getAddresses().add(addr2);
            customer.setDefaultAddressId("addr-1");

            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.removeAddress("c1", "addr-1");

            assertThat(result.getAddresses()).hasSize(1);
            assertThat(result.getDefaultAddressId()).isEqualTo("addr-2");
        }

        @Test
        @DisplayName("sets defaultAddressId to null when last address removed")
        void clearsDefaultWhenLastAddressRemoved() {
            Customer customer = buildCustomer("c1", "test@example.com");
            CustomerAddress addr = new CustomerAddress();
            addr.setId("addr-1");
            addr.setDefault(true);
            customer.getAddresses().add(addr);
            customer.setDefaultAddressId("addr-1");

            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.removeAddress("c1", "addr-1");

            assertThat(result.getAddresses()).isEmpty();
            assertThat(result.getDefaultAddressId()).isNull();
        }
    }

    @Nested
    @DisplayName("setDefaultAddress")
    class SetDefaultAddress {

        @Test
        @DisplayName("throws when addressId not found")
        void throwsWhenAddressNotFound() {
            Customer customer = buildCustomer("c1", "test@example.com");
            CustomerAddress addr = new CustomerAddress();
            addr.setId("addr-1");
            customer.getAddresses().add(addr);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> customerService.setDefaultAddress("c1", "nonexistent"))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("Address not found");
        }

        @Test
        @DisplayName("sets correct address as default and unsets others")
        void setsDefaultCorrectly() {
            Customer customer = buildCustomer("c1", "test@example.com");
            CustomerAddress addr1 = new CustomerAddress();
            addr1.setId("addr-1");
            addr1.setDefault(true);
            CustomerAddress addr2 = new CustomerAddress();
            addr2.setId("addr-2");
            addr2.setDefault(false);
            customer.getAddresses().addAll(List.of(addr1, addr2));
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.setDefaultAddress("c1", "addr-2");

            assertThat(result.getDefaultAddressId()).isEqualTo("addr-2");
            assertThat(result.getAddresses().stream()
                    .filter(a -> "addr-1".equals(a.getId()))
                    .findFirst().get().isDefault()).isFalse();
        }
    }

    // ===========================
    // Loyalty tier transitions
    // ===========================

    @Nested
    @DisplayName("addLoyaltyPoints — tier transitions")
    class LoyaltyTierTransitions {

        @Test
        @DisplayName("upgrades to SILVER at 1000 points")
        void upgradesToSilver() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(950);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AddLoyaltyPointsRequest req = new AddLoyaltyPointsRequest();
            req.setPoints(60);
            req.setType("EARNED");
            req.setDescription("Order bonus");
            Customer result = customerService.addLoyaltyPoints("c1", req);

            assertThat(result.getLoyaltyInfo().getTier()).isEqualTo("SILVER");
        }

        @Test
        @DisplayName("upgrades to GOLD at 5000 points")
        void upgradesToGold() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(4950);
            customer.getLoyaltyInfo().setTier("SILVER");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AddLoyaltyPointsRequest req = new AddLoyaltyPointsRequest();
            req.setPoints(60);
            req.setType("EARNED");
            req.setDescription("Order bonus");
            Customer result = customerService.addLoyaltyPoints("c1", req);

            assertThat(result.getLoyaltyInfo().getTier()).isEqualTo("GOLD");
        }

        @Test
        @DisplayName("upgrades to PLATINUM at 10000 points")
        void upgradesToPlatinum() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(9950);
            customer.getLoyaltyInfo().setTier("GOLD");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AddLoyaltyPointsRequest req = new AddLoyaltyPointsRequest();
            req.setPoints(60);
            req.setType("EARNED");
            req.setDescription("Order bonus");
            Customer result = customerService.addLoyaltyPoints("c1", req);

            assertThat(result.getLoyaltyInfo().getTier()).isEqualTo("PLATINUM");
        }

        @Test
        @DisplayName("deducts points for REDEEMED type — never goes below zero")
        void deductsPointsNeverBelowZero() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(50);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AddLoyaltyPointsRequest req = new AddLoyaltyPointsRequest();
            req.setPoints(200);
            req.setType("REDEEMED");
            req.setDescription("Redemption");
            Customer result = customerService.addLoyaltyPoints("c1", req);

            assertThat(result.getLoyaltyInfo().getTotalPoints()).isEqualTo(0);
        }
    }

    // ===========================
    // redeemLoyaltyPoints
    // ===========================

    @Nested
    @DisplayName("redeemLoyaltyPoints")
    class RedeemLoyaltyPoints {

        @Test
        @DisplayName("throws when points below minimum (100)")
        void throwsBelowMinimum() {
            assertThatThrownBy(() -> customerService.redeemLoyaltyPoints("c1", 50, "order-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Minimum");
        }

        @Test
        @DisplayName("throws when insufficient points")
        void throwsInsufficientPoints() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(200);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> customerService.redeemLoyaltyPoints("c1", 500, "order-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Insufficient points");
        }

        @Test
        @DisplayName("deducts points and records transaction on successful redemption")
        void deductsPointsOnSuccess() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(500);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.redeemLoyaltyPoints("c1", 200, "order-1");

            assertThat(result.getLoyaltyInfo().getTotalPoints()).isEqualTo(300);
            assertThat(result.getLoyaltyInfo().getPointsRedeemed()).isEqualTo(200);
            assertThat(result.getLoyaltyInfo().getPointHistory()).isNotEmpty();
        }
    }

    // ===========================
    // calculatePointsDiscount
    // ===========================

    @Nested
    @DisplayName("calculatePointsDiscount")
    class CalculatePointsDiscount {

        @Test
        @DisplayName("returns 0 when points below minimum")
        void returnsZeroBelowMinimum() {
            assertThat(customerService.calculatePointsDiscount(50)).isEqualTo(0.0);
        }

        @Test
        @DisplayName("returns correct discount amount for 200 points")
        void returnsCorrectDiscount() {
            // 200 points / 100 rate * 50 rupees = 100 rupees
            assertThat(customerService.calculatePointsDiscount(200)).isEqualTo(100.0);
        }
    }

    // ===========================
    // updateOrderStats
    // ===========================

    @Nested
    @DisplayName("updateOrderStats")
    class UpdateOrderStats {

        @Test
        @DisplayName("increments totalOrders on RECEIVED status")
        void incrementsOnReceived() {
            Customer customer = buildCustomer("c1", "test@example.com");
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateOrderStatsRequest req = new UpdateOrderStatsRequest();
            req.setStatus("RECEIVED");
            req.setOrderId("order-1");
            req.setOrderTotal(500.0);
            req.setOrderType("DELIVERY");
            Customer result = customerService.updateOrderStats("user-c1", req);

            assertThat(result.getOrderStats().getTotalOrders()).isEqualTo(1);
        }

        @Test
        @DisplayName("increments completedOrders and awards points on DELIVERED status")
        void completesAndAwardsPoints() {
            Customer customer = buildCustomer("c1", "test@example.com");
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateOrderStatsRequest req = new UpdateOrderStatsRequest();
            req.setStatus("DELIVERED");
            req.setOrderId("order-1");
            req.setOrderTotal(1000.0);
            req.setOrderType("DELIVERY");
            Customer result = customerService.updateOrderStats("user-c1", req);

            assertThat(result.getOrderStats().getCompletedOrders()).isEqualTo(1);
            // 1000 / 10 rupees-per-point = 100 base points * 1.0 BRONZE multiplier = 100
            assertThat(result.getLoyaltyInfo().getTotalPoints()).isEqualTo(100);
        }

        @Test
        @DisplayName("increments cancelledOrders and reverses earned points on CANCELLED")
        void cancelledReversesPoints() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.getLoyaltyInfo().setTotalPoints(100);
            PointTransaction earned = new PointTransaction(100, "EARNED", "Order #order-1");
            earned.setOrderId("order-1");
            customer.getLoyaltyInfo().getPointHistory().add(earned);
            when(customerRepository.findByUserId("user-c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateOrderStatsRequest req = new UpdateOrderStatsRequest();
            req.setStatus("CANCELLED");
            req.setOrderId("order-1");
            req.setOrderTotal(0.0);
            req.setOrderType("DELIVERY");
            Customer result = customerService.updateOrderStats("user-c1", req);

            assertThat(result.getOrderStats().getCancelledOrders()).isEqualTo(1);
            assertThat(result.getLoyaltyInfo().getTotalPoints()).isEqualTo(0);
        }
    }

    // ===========================
    // anonymizeAndDeleteCustomer
    // ===========================

    @Nested
    @DisplayName("anonymizeAndDeleteCustomer")
    class AnonymizeAndDeleteCustomer {

        @Test
        @DisplayName("throws when customer not found")
        void throwsWhenNotFound() {
            when(customerRepository.findById("missing")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> customerService.anonymizeAndDeleteCustomer("missing", "GDPR_REQUEST"))
                    .isInstanceOf(NoSuchElementException.class);
        }

        @Test
        @DisplayName("anonymizes PII fields and marks inactive")
        void anonymizesPii() {
            Customer customer = buildCustomer("c1", "real@example.com");
            customer.setPhone("9876543210");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.anonymizeAndDeleteCustomer("c1", "GDPR_REQUEST");

            assertThat(result.getName()).isEqualTo("DELETED_USER");
            assertThat(result.getEmail()).contains("@anonymized.local");
            assertThat(result.getPhone()).isEqualTo("0000000000");
            assertThat(result.isActive()).isFalse();
            assertThat(result.getDeletedAt()).isNotNull();
            assertThat(result.getAddresses()).isEmpty();
        }
    }

    // ===========================
    // hardDeleteCustomer
    // ===========================

    @Nested
    @DisplayName("hardDeleteCustomer")
    class HardDeleteCustomer {

        @Test
        @DisplayName("throws when customer is still active — safety check")
        void throwsWhenActiveNotAnonymized() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.setActive(true);
            customer.setDeletedAt(null);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> customerService.hardDeleteCustomer("c1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("anonymize");
        }

        @Test
        @DisplayName("deletes anonymized customer successfully")
        void deletesAnonymizedCustomer() {
            Customer customer = buildCustomer("c1", "deleted@anonymized.local");
            customer.setActive(false);
            customer.setDeletedAt(LocalDateTime.now().minusDays(90));
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));

            customerService.hardDeleteCustomer("c1");

            verify(customerRepository).deleteById("c1");
        }

        @Test
        @DisplayName("does nothing when customer already deleted")
        void noopWhenAlreadyDeleted() {
            when(customerRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatCode(() -> customerService.hardDeleteCustomer("missing"))
                    .doesNotThrowAnyException();
            verify(customerRepository, never()).deleteById(any());
        }
    }

    // ===========================
    // activate / deactivate
    // ===========================

    @Nested
    @DisplayName("activateCustomer / deactivateCustomer")
    class ActivateDeactivate {

        @Test
        @DisplayName("activateCustomer sets active=true")
        void activates() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.setActive(false);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.activateCustomer("c1");
            assertThat(result.isActive()).isTrue();
        }

        @Test
        @DisplayName("deactivateCustomer sets active=false")
        void deactivates() {
            Customer customer = buildCustomer("c1", "test@example.com");
            customer.setActive(true);
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.deactivateCustomer("c1");
            assertThat(result.isActive()).isFalse();
        }
    }

    // ===========================
    // updateEmail
    // ===========================

    @Nested
    @DisplayName("updateEmail")
    class UpdateEmail {

        @Test
        @DisplayName("allows walk-in placeholder email without conflict check")
        void allowsWalkinEmail() {
            Customer customer = buildCustomer("c1", "old@example.com");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Customer result = customerService.updateEmail("c1", "walkin123@walkin.local");
            assertThat(result.getEmail()).isEqualTo("walkin123@walkin.local");
        }

        @Test
        @DisplayName("throws when regular email already in use by another customer")
        void throwsOnEmailConflict() {
            Customer customer = buildCustomer("c1", "old@example.com");
            Customer other = buildCustomer("c2", "taken@example.com");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));
            when(customerRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(other));

            assertThatThrownBy(() -> customerService.updateEmail("c1", "taken@example.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already in use");
        }

        @Test
        @DisplayName("returns same customer unchanged when email is the same")
        void noopWhenEmailSame() {
            Customer customer = buildCustomer("c1", "same@example.com");
            when(customerRepository.findById("c1")).thenReturn(Optional.of(customer));

            Customer result = customerService.updateEmail("c1", "same@example.com");
            assertThat(result.getEmail()).isEqualTo("same@example.com");
            verify(customerRepository, never()).save(any());
        }
    }
}
