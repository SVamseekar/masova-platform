package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.service.EmailService;
import com.MaSoVa.core.notification.service.ManagerNotificationService;
import com.MaSoVa.core.notification.service.ManagerNotificationService.AlertSeverity;
import com.MaSoVa.core.notification.service.ManagerNotificationService.LowStockItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ManagerNotificationService Unit Tests")
class ManagerNotificationServiceTest {

    @Mock private EmailService emailService;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private ManagerNotificationService service;

    // ===========================
    // sendLowStockAlert
    // ===========================

    @Nested
    @DisplayName("sendLowStockAlert")
    class SendLowStockAlert {

        @Test
        @DisplayName("does not throw when email service is called with low stock items")
        void doesNotThrowOnValidItems() {
            List<LowStockItem> items = List.of(
                    new LowStockItem("item-1", "Chicken", 5, 20),
                    new LowStockItem("item-2", "Rice", 2, 10)
            );

            assertThatCode(() -> service.sendLowStockAlert("store-1", "MaSoVa Chennai", items))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw when item list is empty")
        void doesNotThrowOnEmptyList() {
            assertThatCode(() -> service.sendLowStockAlert("store-1", "Store", List.of()))
                    .doesNotThrowAnyException();
        }
    }

    // ===========================
    // sendCriticalStockAlert
    // ===========================

    @Nested
    @DisplayName("sendCriticalStockAlert")
    class SendCriticalStockAlert {

        @Test
        @DisplayName("does not throw for valid inputs")
        void doesNotThrow() {
            assertThatCode(() -> service.sendCriticalStockAlert("store-1", "MaSoVa", "Chicken"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw with valid store and item")
        void doesNotThrowWithValidInputs() {
            assertThatCode(() -> service.sendCriticalStockAlert("store-1", "Store", "Chicken"))
                    .doesNotThrowAnyException();
        }
    }

    // ===========================
    // sendStoreDailySummary
    // ===========================

    @Nested
    @DisplayName("sendStoreDailySummary")
    class SendStoreDailySummary {

        @Test
        @DisplayName("does not throw when called")
        void doesNotThrow() {
            assertThatCode(() -> service.sendStoreDailySummary("store-1", "MaSoVa"))
                    .doesNotThrowAnyException();
        }
    }

    // ===========================
    // sendSystemAlert
    // ===========================

    @Nested
    @DisplayName("sendSystemAlert")
    class SendSystemAlert {

        @Test
        @DisplayName("does not throw for CRITICAL severity store alert")
        void criticalStoreAlert() {
            assertThatCode(() -> service.sendSystemAlert(
                    "store-1", "Payment Gateway Down", "Razorpay unreachable", AlertSeverity.CRITICAL))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw for system-wide alert when storeId is null")
        void systemWideAlertNullStore() {
            assertThatCode(() -> service.sendSystemAlert(
                    null, "DB Alert", "MongoDB slow", AlertSeverity.HIGH))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw for LOW severity alert")
        void doesNotThrowForLowSeverity() {
            assertThatCode(() -> service.sendSystemAlert(
                    "store-1", "Alert", "Message", AlertSeverity.LOW))
                    .doesNotThrowAnyException();
        }
    }

    // ===========================
    // LowStockItem DTO
    // ===========================

    @Nested
    @DisplayName("LowStockItem")
    class LowStockItemTest {

        @Test
        @DisplayName("getters return values set by constructor")
        void constructorSetsFields() {
            LowStockItem item = new LowStockItem("i1", "Chicken", 3, 20);
            assertThat(item.getItemId()).isEqualTo("i1");
            assertThat(item.getItemName()).isEqualTo("Chicken");
            assertThat(item.getCurrentStock()).isEqualTo(3);
            assertThat(item.getThreshold()).isEqualTo(20);
        }

        @Test
        @DisplayName("setters work correctly")
        void settersWork() {
            LowStockItem item = new LowStockItem();
            item.setItemId("i2");
            item.setItemName("Rice");
            item.setCurrentStock(5);
            item.setThreshold(15);
            assertThat(item.getItemName()).isEqualTo("Rice");
            assertThat(item.getCurrentStock()).isEqualTo(5);
        }
    }
}
