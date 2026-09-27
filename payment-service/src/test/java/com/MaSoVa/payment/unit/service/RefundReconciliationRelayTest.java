package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.RefundReconciliationRelay;
import com.MaSoVa.payment.service.RefundService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * A refund can get stuck PROCESSING two ways: Razorpay's confirming webhook never arrives
 * (real gateway id exists, safe to reconcile via a status lookup), or a prior gateway call
 * timed out with the outcome genuinely unknown (still holding its local "claim_..." placeholder,
 * no gateway id to query — deliberately left for manual review, not auto-resolved).
 */
class RefundReconciliationRelayTest {

    private RefundRepository refundRepository;
    private TransactionRepository transactionRepository;
    private PaymentGatewayResolver paymentGatewayResolver;
    private RefundService refundService;
    private PaymentGateway gateway;
    private RefundReconciliationRelay relay;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        refundRepository = mock(RefundRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        paymentGatewayResolver = mock(PaymentGatewayResolver.class);
        refundService = mock(RefundService.class);
        gateway = mock(PaymentGateway.class);
        ObjectProvider<MeterRegistry> meterRegistry = mock(ObjectProvider.class);
        when(meterRegistry.getIfAvailable()).thenReturn(null);
        relay = new RefundReconciliationRelay(refundRepository, transactionRepository,
                paymentGatewayResolver, refundService, meterRegistry, 300, 50);
    }

    private Refund stuckRefund(String id, String gatewayRefundId) {
        Refund refund = new Refund();
        refund.setId(id);
        refund.setTransactionId("txn-" + id);
        refund.setStatus(Refund.RefundStatus.PROCESSING);
        refund.setRazorpayPaymentId("pay_" + id);
        refund.setRazorpayRefundId(gatewayRefundId);
        refund.setAmount(BigDecimal.TEN);
        refund.setUpdatedAt(LocalDateTime.now().minusMinutes(10));
        return refund;
    }

    private Transaction transactionFor(Refund refund, String gatewayName) {
        Transaction transaction = new Transaction();
        transaction.setId(refund.getTransactionId());
        transaction.setPaymentGateway(gatewayName);
        return transaction;
    }

    @Test
    @DisplayName("reconciles a stuck refund with a real gateway id via status lookup")
    void reconcilesRefundWithRealGatewayId() {
        Refund refund = stuckRefund("r1", "rfnd_real123");
        Transaction transaction = transactionFor(refund, "RAZORPAY");
        when(refundRepository.findByStatusAndUpdatedAtBefore(eq(Refund.RefundStatus.PROCESSING), any()))
                .thenReturn(List.of(refund));
        when(transactionRepository.findById("txn-r1")).thenReturn(Optional.of(transaction));
        when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(gateway);
        try {
            when(gateway.fetchRefundStatus("pay_r1", "rfnd_real123")).thenReturn("processed");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        relay.reconcileDue();

        verify(refundService).updateRefundStatus("rfnd_real123", "processed");
    }

    @Test
    @DisplayName("does not touch a refund with no confirmed gateway id — logs for manual review instead")
    void doesNotAutoResolveUnconfirmedClaim() {
        Refund refund = stuckRefund("r2", "claim_abc123");
        when(refundRepository.findByStatusAndUpdatedAtBefore(eq(Refund.RefundStatus.PROCESSING), any()))
                .thenReturn(List.of(refund));

        relay.reconcileDue();

        verifyNoInteractions(transactionRepository, paymentGatewayResolver, refundService);
    }

    @Test
    @DisplayName("one refund's gateway lookup failure does not block reconciling the rest of the batch")
    void continuesBatchWhenOneLookupFails() throws Exception {
        Refund first = stuckRefund("r3", "rfnd_a");
        Refund second = stuckRefund("r4", "rfnd_b");
        when(refundRepository.findByStatusAndUpdatedAtBefore(eq(Refund.RefundStatus.PROCESSING), any()))
                .thenReturn(List.of(first, second));
        when(transactionRepository.findById("txn-r3")).thenReturn(Optional.of(transactionFor(first, "RAZORPAY")));
        when(transactionRepository.findById("txn-r4")).thenReturn(Optional.of(transactionFor(second, "RAZORPAY")));
        when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(gateway);
        when(gateway.fetchRefundStatus("pay_r3", "rfnd_a")).thenThrow(new RuntimeException("gateway down"));
        when(gateway.fetchRefundStatus("pay_r4", "rfnd_b")).thenReturn("processed");

        relay.reconcileDue();

        verify(refundService, never()).updateRefundStatus(eq("rfnd_a"), any());
        verify(refundService).updateRefundStatus("rfnd_b", "processed");
    }

    @Test
    @DisplayName("skips a refund whose transaction no longer exists")
    void skipsRefundWithMissingTransaction() {
        Refund refund = stuckRefund("r5", "rfnd_orphan");
        when(refundRepository.findByStatusAndUpdatedAtBefore(eq(Refund.RefundStatus.PROCESSING), any()))
                .thenReturn(List.of(refund));
        when(transactionRepository.findById("txn-r5")).thenReturn(Optional.empty());

        relay.reconcileDue();

        verifyNoInteractions(paymentGatewayResolver, refundService);
    }
}
