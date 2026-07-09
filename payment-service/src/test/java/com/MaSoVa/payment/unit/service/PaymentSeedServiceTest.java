package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.OrderServiceClient;
import com.MaSoVa.payment.service.PaymentSeedService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("PaymentSeedService idempotency")
class PaymentSeedServiceTest {

    @Mock TransactionRepository transactionRepository;
    @Mock RefundRepository refundRepository;
    @Mock OrderServiceClient orderServiceClient;
    @Mock Environment environment;

    PaymentSeedService service;

    @BeforeEach
    void setUp() {
        service = new PaymentSeedService(
                transactionRepository, refundRepository, orderServiceClient, environment);
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(true);
        when(transactionRepository.findByOrderId(anyString())).thenReturn(Optional.empty());
        when(transactionRepository.findByRazorpayOrderId(anyString())).thenReturn(Optional.empty());
        when(transactionRepository.findByStripePaymentIntentId(anyString())).thenReturn(Optional.empty());
        when(refundRepository.findByTransactionId(anyString())).thenReturn(List.of());
        doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

        AtomicInteger seq = new AtomicInteger();
        when(transactionRepository.save(any())).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId("tx-" + seq.incrementAndGet());
            }
            return t;
        });
        when(refundRepository.save(any())).thenAnswer(inv -> {
            Refund r = inv.getArgument(0);
            if (r.getId() == null) {
                r.setId("rf-" + seq.incrementAndGet());
            }
            return r;
        });
    }

    @Test
    @DisplayName("never inserts null razorpayOrderId (unique index safe)")
    void neverNullRazorpayOrderId() {
        service.seedDemo("DOM001", "user-anna", List.of("ord-a", "ord-b", "ord-c"));

        ArgumentCaptor<Transaction> cap = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeast(3)).save(cap.capture());
        assertThat(cap.getAllValues())
                .allMatch(t -> t.getRazorpayOrderId() != null && !t.getRazorpayOrderId().isBlank());
        assertThat(cap.getAllValues())
                .extracting(Transaction::getRazorpayOrderId)
                .containsExactlyInAnyOrder("SEED_RZP_1", "SEED_RZP_2", "SEED_RZP_3");
    }

    @Test
    @DisplayName("second seed with same slots updates not inserts when found by SEED_RZP_*")
    void secondSeedUpdatesByStableSlot() {
        Transaction existing = Transaction.builder()
                .orderId("old-order")
                .razorpayOrderId("SEED_RZP_1")
                .amount(java.math.BigDecimal.TEN)
                .status(Transaction.PaymentStatus.SUCCESS)
                .build();
        existing.setId("tx-existing");

        when(transactionRepository.findByRazorpayOrderId("SEED_RZP_1")).thenReturn(Optional.of(existing));
        when(transactionRepository.findByOrderId("ord-new-1")).thenReturn(Optional.empty());
        when(transactionRepository.findByOrderId(anyString())).thenAnswer(inv -> {
            String oid = inv.getArgument(0);
            if ("old-order".equals(oid) || "ord-new-1".equals(existing.getOrderId())) {
                // after update
            }
            return Optional.empty();
        });
        when(transactionRepository.findByRazorpayOrderId(anyString())).thenAnswer(inv -> {
            if ("SEED_RZP_1".equals(inv.getArgument(0))) return Optional.of(existing);
            return Optional.empty();
        });

        Map<String, Object> result = service.seedDemo("DOM001", "user", List.of("ord-new-1", "ord-new-2", "ord-new-3"));
        assertThat(result.get("transactionIds")).isInstanceOf(List.class);
        // existing slot-1 reused
        assertThat(((List<?>) result.get("transactionIds")).get(0)).isEqualTo("tx-existing");
        assertThat(existing.getOrderId()).isEqualTo("ord-new-1");
        assertThat(existing.getRazorpayOrderId()).isEqualTo("SEED_RZP_1");
    }

    @Test
    @DisplayName("seedDemo produces 3 txs and 2 refunds")
    void producesExpectedCounts() {
        Map<String, Object> result = service.seedDemo("DOM001", "user-anna", null);
        assertThat((List<?>) result.get("transactionIds")).hasSize(3);
        assertThat((List<?>) result.get("refundIds")).hasSize(2);
        verify(transactionRepository, times(3)).save(any());
        verify(refundRepository, times(2)).save(any());
    }
}
