package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.repository.CustomerRepository;
import com.MaSoVa.core.customer.service.CustomerDataRetentionService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.anyInt;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CustomerDataRetentionService Unit Tests")
class CustomerDataRetentionServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerService customerService;

    @InjectMocks private CustomerDataRetentionService retentionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(retentionService, "retentionEnabled", true);
        ReflectionTestUtils.setField(retentionService, "dryRun", false);
    }

    private Customer buildInactiveCustomer(String id) {
        Customer c = new Customer();
        c.setId(id);
        c.setActive(false);
        c.setDeletedAt(LocalDateTime.now().minusDays(400));
        c.setEmail("deleted_" + id + "@anonymized.local");
        return c;
    }

    // ===========================
    // runManualRetention
    // ===========================

    @Nested
    @DisplayName("runManualRetention")
    class RunManualRetention {

        @Test
        @DisplayName("does not throw when retention is enabled")
        void doesNotThrow() {
            when(customerRepository.findByActiveAndDeletedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(anyInt(), any())).thenReturn(List.of());

            assertThatCode(() -> retentionService.runManualRetention())
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("hard-deletes customers past deletion cutoff")
        void hardDeletesPastCutoff() {
            Customer toDelete = buildInactiveCustomer("c1");
            when(customerRepository.findByActiveAndDeletedAtBefore(anyBoolean(), any())).thenReturn(List.of(toDelete));
            when(customerRepository.findByActiveAndLastOrderDateBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(anyInt(), any())).thenReturn(List.of());

            retentionService.runManualRetention();

            verify(customerService).hardDeleteCustomer("c1");
        }

        @Test
        @DisplayName("anonymizes inactive customers past retention period")
        void anonymizesInactiveCustomers() {
            Customer inactive = new Customer();
            inactive.setId("c2");
            inactive.setActive(true);
            // stub all repo calls invoked by runDailyRetentionJob
            when(customerRepository.findByActiveAndDeletedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateBefore(anyBoolean(), any())).thenReturn(List.of(inactive));
            when(customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(anyInt(), any())).thenReturn(List.of());

            retentionService.runManualRetention();

            verify(customerService).anonymizeAndDeleteCustomer("c2", "RETENTION_POLICY_EXPIRY");
        }

        @Test
        @DisplayName("skips processing when retention is disabled")
        void skipsWhenDisabled() {
            ReflectionTestUtils.setField(retentionService, "retentionEnabled", false);

            retentionService.runManualRetention();

            verify(customerService, never()).hardDeleteCustomer(any());
            verify(customerService, never()).anonymizeAndDeleteCustomer(any(), any());
        }

        @Test
        @DisplayName("skips hard-delete in dry-run mode")
        void skipsHardDeleteInDryRun() {
            ReflectionTestUtils.setField(retentionService, "dryRun", true);
            Customer toDelete = buildInactiveCustomer("c1");
            when(customerRepository.findByActiveAndDeletedAtBefore(anyBoolean(), any())).thenReturn(List.of(toDelete));
            when(customerRepository.findByActiveAndLastOrderDateBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(anyInt(), any())).thenReturn(List.of());

            retentionService.runManualRetention();

            verify(customerService, never()).hardDeleteCustomer(any());
        }

        @Test
        @DisplayName("continues processing remaining customers when one fails")
        void continuesOnFailure() {
            Customer c1 = buildInactiveCustomer("c1");
            Customer c2 = buildInactiveCustomer("c2");
            when(customerRepository.findByActiveAndDeletedAtBefore(anyBoolean(), any())).thenReturn(List.of(c1, c2));
            when(customerRepository.findByActiveAndLastOrderDateBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(anyBoolean(), any())).thenReturn(List.of());
            when(customerRepository.findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(anyInt(), any())).thenReturn(List.of());
            doThrow(new RuntimeException("DB error")).when(customerService).hardDeleteCustomer("c1");

            assertThatCode(() -> retentionService.runManualRetention())
                    .doesNotThrowAnyException();

            verify(customerService).hardDeleteCustomer("c2");
        }
    }

    // ===========================
    // getRetentionStats
    // ===========================

    @Nested
    @DisplayName("getRetentionStats")
    class GetRetentionStats {

        @Test
        @DisplayName("returns stats with retention flag values")
        void returnsStats() {
            when(customerRepository.countByActiveAndDeletedAtBefore(eq(false), any())).thenReturn(5L);
            when(customerRepository.countByActiveAndLastOrderDateBefore(eq(true), any())).thenReturn(10L);
            when(customerRepository.countByActive(false)).thenReturn(20L);

            var stats = retentionService.getRetentionStats();

            assertThat(stats).isNotNull();
            assertThat(stats.isRetentionEnabled()).isTrue();
            assertThat(stats.isDryRunMode()).isFalse();
        }
    }
}
