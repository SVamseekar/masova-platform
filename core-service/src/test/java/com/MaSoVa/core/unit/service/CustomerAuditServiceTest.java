package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerAuditService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CustomerAuditService Unit Tests")
class CustomerAuditServiceTest {

    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks private CustomerAuditService customerAuditService;

    @Test
    @DisplayName("logEmailChange does not throw")
    void logEmailChangeDoesNotThrow() {
        Customer customer = new Customer();
        customer.setId("cust-1");

        assertThatCode(() -> customerAuditService.logEmailChange(
                customer, "old@example.com", "new@example.com"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("flushAuditBufferScheduled does not throw")
    void flushAuditBufferScheduledDoesNotThrow() {
        assertThatCode(() -> customerAuditService.flushAuditBufferScheduled())
                .doesNotThrowAnyException();
    }
}
