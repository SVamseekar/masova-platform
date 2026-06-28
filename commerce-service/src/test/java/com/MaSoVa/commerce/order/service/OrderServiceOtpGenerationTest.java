package com.MaSoVa.commerce.order.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("OrderService delivery OTP generation (Task 11)")
class OrderServiceOtpGenerationTest {

    @RepeatedTest(20)
    @DisplayName("generateDeliveryOtpCode produces a 4-digit numeric string")
    void generatesFourDigitOtp() {
        String otp = OrderService.generateDeliveryOtpCode();

        assertThat(otp).hasSize(4);
        assertThat(otp).matches("\\d{4}");
    }

    @Test
    @DisplayName("OrderService uses SecureRandom for OTP generation")
    void usesSecureRandomField() throws Exception {
        var field = OrderService.class.getDeclaredField("SECURE_RANDOM");
        assertThat(field.getType().getName()).isEqualTo("java.security.SecureRandom");
    }
}