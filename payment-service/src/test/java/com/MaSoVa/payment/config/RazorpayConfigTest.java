package com.MaSoVa.payment.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("RazorpayConfig credential validation (Task 9)")
class RazorpayConfigTest {

    private static final String VALID_KEY_ID = "rzp_test_newRotatedKeyId123";
    private static final String VALID_KEY_SECRET = "new_rotated_secret_not_in_source";
    private static final String VALID_WEBHOOK = "whsec_real_webhook_secret_value";

    @Test
    @DisplayName("accepts non-denylisted credentials outside prod")
    void acceptsValidCredentialsNonProd() {
        assertThatCode(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID, VALID_KEY_SECRET, VALID_WEBHOOK, false))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("accepts placeholder webhook secret outside prod")
    void acceptsPlaceholderWebhookNonProd() {
        assertThatCode(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID,
                                VALID_KEY_SECRET,
                                RazorpayConfig.PLACEHOLDER_WEBHOOK_SECRET,
                                false))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("rejects missing key id")
    void rejectsMissingKeyId() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                "", VALID_KEY_SECRET, VALID_WEBHOOK, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RAZORPAY_KEY_ID");
    }

    @Test
    @DisplayName("rejects missing key secret")
    void rejectsMissingKeySecret() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID, "  ", VALID_WEBHOOK, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RAZORPAY_KEY_SECRET");
    }

    @Test
    @DisplayName("rejects missing webhook secret")
    void rejectsMissingWebhookSecret() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID, VALID_KEY_SECRET, null, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RAZORPAY_WEBHOOK_SECRET");
    }

    @Test
    @DisplayName("rejects the known leaked key id")
    void rejectsDenylistedKeyId() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                RazorpayConfig.DENYLISTED_LEAKED_KEY_ID,
                                VALID_KEY_SECRET,
                                VALID_WEBHOOK,
                                false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("known leaked");
    }

    @Test
    @DisplayName("rejects the known leaked key secret")
    void rejectsDenylistedKeySecret() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID,
                                RazorpayConfig.DENYLISTED_LEAKED_KEY_SECRET,
                                VALID_WEBHOOK,
                                false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("known leaked");
    }

    @Test
    @DisplayName("rejects placeholder webhook secret in prod profile")
    void rejectsPlaceholderWebhookInProd() {
        assertThatThrownBy(() ->
                        RazorpayConfig.validateRazorpayConfig(
                                VALID_KEY_ID,
                                VALID_KEY_SECRET,
                                RazorpayConfig.PLACEHOLDER_WEBHOOK_SECRET,
                                true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder");
    }
}