package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.OrderServiceClient;
import com.MaSoVa.payment.service.RefundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Agent/customer-requested refunds land in PENDING_APPROVAL (no money moved);
 * manager approval executes via Stripe/Razorpay/synthetic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RefundService approval-gate Tests")
class RefundServiceApprovalTest {

    @Mock private RefundRepository refundRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private PaymentGatewayResolver paymentGatewayResolver;
    @Mock private PaymentGateway paymentGateway;
    @Mock private OrderServiceClient orderServiceClient;

    @InjectMocks private RefundService refundService;

    private Transaction successTransaction;
    private RefundRequest request;

    @BeforeEach
    void setUp() {
        successTransaction = Transaction.builder()
                .orderId("order-123")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.SUCCESS)
                .customerId("cust-456")
                .storeId("DOM001")
                .currency("INR")
                .paymentGateway("RAZORPAY")
                .build();
        successTransaction.setId("txn-001");
        successTransaction.setRazorpayPaymentId("pay_001");

        request = RefundRequest.builder()
                .transactionId("txn-001")
                .amount(BigDecimal.valueOf(200.00))
                .type(Refund.RefundType.PARTIAL)
                .reason("Customer requested via agent")
                .initiatedBy("AGENT")
                .speed("normal")
                .build();
    }

    @Test
    @DisplayName("requestRefundApproval lands in PENDING_APPROVAL, no gateway call")
    void requestLandsPendingApproval() {
        when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
        when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund result = refundService.requestRefundApproval(request);

        assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PENDING_APPROVAL);
        // Unique placeholder until manager approves (Mongo unique index on razorpayRefundId)
        assertThat(result.getRazorpayRefundId()).startsWith("pending_");
        assertThat(result.getInitiatedBy()).isEqualTo("AGENT");
        assertThat(result.getStoreId()).isEqualTo("DOM001");
        verifyNoInteractions(paymentGatewayResolver);
        verify(orderServiceClient, never()).updateOrderPaymentStatus(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("requestRefundApproval still validates amount/transaction")
    void requestValidatesAmount() {
        RefundRequest tooLarge = RefundRequest.builder()
                .transactionId("txn-001").amount(BigDecimal.valueOf(9999.00))
                .type(Refund.RefundType.FULL).reason("x").initiatedBy("AGENT").build();
        when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));

        assertThatThrownBy(() -> refundService.requestRefundApproval(tooLarge))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot exceed");
        verify(refundRepository, never()).save(any());
    }

    @Test
    @DisplayName("manager-initiated initiateRefund still executes immediately")
    void managerInitiatedStillImmediate() throws Exception {
        when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
        when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
        when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
        when(paymentGateway.getGatewayName()).thenReturn("RAZORPAY");
        when(paymentGateway.refund("pay_001", BigDecimal.valueOf(200.00), "normal")).thenReturn("rfnd_001");
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund result = refundService.initiateRefund(request);

        assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSING);
        assertThat(result.getRazorpayRefundId()).isEqualTo("rfnd_001");
        verify(orderServiceClient).updateOrderPaymentStatus("order-123", "REFUNDED", "txn-001");
    }

    @Test
    @DisplayName("approveRefund executes the pending refund via gateway")
    void approveExecutesRefund() throws Exception {
        Refund pending = Refund.builder()
                .transactionId("txn-001").orderId("order-123").razorpayPaymentId("pay_001")
                .amount(BigDecimal.valueOf(200.00)).status(Refund.RefundStatus.PENDING_APPROVAL)
                .type(Refund.RefundType.PARTIAL).reason("agent req").initiatedBy("AGENT").speed("normal")
                .build();
        pending.setId("refund-001");

        when(refundRepository.findById("refund-001")).thenReturn(Optional.of(pending));
        when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
        when(refundRepository.findByTransactionId("txn-001")).thenReturn(List.of(pending));
        when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
        when(paymentGateway.getGatewayName()).thenReturn("RAZORPAY");
        when(paymentGateway.refund("pay_001", BigDecimal.valueOf(200.00), "normal")).thenReturn("rfnd_approved");
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund result = refundService.approveRefund("refund-001", "manager-001");

        assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSING);
        assertThat(result.getRazorpayRefundId()).isEqualTo("rfnd_approved");
        assertThat(result.getInitiatedBy()).isEqualTo("manager-001");
        verify(orderServiceClient).updateOrderPaymentStatus("order-123", "REFUNDED", "txn-001");
    }

    @Test
    @DisplayName("approveRefund rejects non-pending refund (no double processing)")
    void approveRejectsNonPending() {
        Refund alreadyProcessed = Refund.builder()
                .transactionId("txn-001").amount(BigDecimal.valueOf(200.00))
                .status(Refund.RefundStatus.PROCESSED).build();
        alreadyProcessed.setId("refund-001");
        when(refundRepository.findById("refund-001")).thenReturn(Optional.of(alreadyProcessed));

        assertThatThrownBy(() -> refundService.approveRefund("refund-001", "manager-001"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not pending approval");
        verifyNoInteractions(paymentGatewayResolver);
    }

    @Test
    @DisplayName("rejectRefund marks REJECTED with no money moved")
    void rejectMarksRejected() {
        Refund pending = Refund.builder()
                .transactionId("txn-001").amount(BigDecimal.valueOf(200.00))
                .status(Refund.RefundStatus.PENDING_APPROVAL).build();
        pending.setId("refund-001");
        when(refundRepository.findById("refund-001")).thenReturn(Optional.of(pending));
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund result = refundService.rejectRefund("refund-001", "manager-001", "not justified");

        assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.REJECTED);
        verifyNoInteractions(paymentGatewayResolver);
        verify(orderServiceClient, never()).updateOrderPaymentStatus(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("rejectRefund refuses a non-pending refund")
    void rejectRefusesNonPending() {
        Refund processed = Refund.builder().status(Refund.RefundStatus.PROCESSED).build();
        processed.setId("refund-001");
        when(refundRepository.findById("refund-001")).thenReturn(Optional.of(processed));

        assertThatThrownBy(() -> refundService.rejectRefund("refund-001", "m", "x"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("approveRefund blocks when prior PROCESSED refunds exhaust available amount")
    void approveBlocksWhenExhausted() {
        Refund pending = Refund.builder()
                .transactionId("txn-001").orderId("order-123").razorpayPaymentId("pay_001")
                .amount(BigDecimal.valueOf(400.00)).status(Refund.RefundStatus.PENDING_APPROVAL)
                .type(Refund.RefundType.PARTIAL).speed("normal").build();
        pending.setId("refund-001");
        Refund priorProcessed = Refund.builder()
                .amount(BigDecimal.valueOf(300.00)).status(Refund.RefundStatus.PROCESSED).build();
        priorProcessed.setId("refund-prior");

        when(refundRepository.findById("refund-001")).thenReturn(Optional.of(pending));
        when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
        when(refundRepository.findByTransactionId("txn-001")).thenReturn(List.of(priorProcessed, pending));

        assertThatThrownBy(() -> refundService.approveRefund("refund-001", "manager-001"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("exceeds available");
        verifyNoInteractions(paymentGatewayResolver);
    }
}
