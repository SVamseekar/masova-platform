package com.MaSoVa.payment.service;

import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.entity.TransactionJpaEntity;
import com.MaSoVa.payment.repository.TransactionJpaRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class TransactionLedgerWriter {

    private final TransactionJpaRepository transactionJpaRepository;

    public TransactionLedgerWriter(TransactionJpaRepository transactionJpaRepository) {
        this.transactionJpaRepository = transactionJpaRepository;
    }

    public void write(Transaction transaction) {
        TransactionJpaEntity row = transactionJpaRepository.findByMongoId(transaction.getId())
                .orElseGet(TransactionJpaEntity::new);
        if (row.getId() == null) {
            row.setId(UUID.randomUUID().toString());
            row.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        }
        row.setMongoId(transaction.getId());
        row.setOrderId(transaction.getOrderId());
        row.setRazorpayOrderId(transaction.getRazorpayOrderId());
        row.setRazorpayPaymentId(transaction.getRazorpayPaymentId());
        row.setRazorpaySignature(transaction.getRazorpaySignature());
        row.setAmount(transaction.getAmount());
        row.setStatus(transaction.getStatus() != null ? transaction.getStatus().name() : null);
        row.setPaymentMethod(transaction.getPaymentMethod() != null ? transaction.getPaymentMethod().name() : null);
        row.setCustomerId(transaction.getCustomerId());
        row.setCustomerEmail(transaction.getCustomerEmail());
        row.setCustomerPhone(transaction.getCustomerPhone());
        row.setStoreId(transaction.getStoreId());
        row.setErrorCode(transaction.getErrorCode());
        row.setErrorDescription(transaction.getErrorDescription());
        row.setErrorSource(transaction.getErrorSource());
        row.setErrorStep(transaction.getErrorStep());
        row.setErrorReason(transaction.getErrorReason());
        row.setReceipt(transaction.getReceipt());
        row.setCurrency(transaction.getCurrency() != null ? transaction.getCurrency() : "INR");
        row.setReconciled(transaction.isReconciled());
        row.setReconciledAt(toOffset(transaction.getReconciledAt()));
        row.setReconciledBy(transaction.getReconciledBy());
        row.setPaidAt(toOffset(transaction.getPaidAt()));
        row.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        row.setPaymentGateway(transaction.getPaymentGateway());
        row.setStripePaymentIntentId(transaction.getStripePaymentIntentId());
        row.setStripeFeeMinorUnits(transaction.getStripeFeeMinorUnits());
        transactionJpaRepository.save(row);
    }

    private static OffsetDateTime toOffset(java.time.LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }
}
