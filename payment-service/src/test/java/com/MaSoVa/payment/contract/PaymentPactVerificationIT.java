package com.MaSoVa.payment.contract;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.IgnoreNoPactsToVerify;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.TargetRequestFilter;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.spring6.PactVerificationSpring6Provider;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import com.razorpay.Payment;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.apache.hc.client5.http.classic.methods.HttpUriRequestBase;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("payment-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class PaymentPactVerificationIT extends BaseFullIntegrationTest {

    /** Must match jwt.secret in application-test.yml so the filter-injected token validates. */
    private static final String TEST_JWT_SECRET =
            "test-secret-key-at-least-64-characters-long-for-hs512-algorithm-ok";

    @LocalServerPort
    int port;

    @Autowired
    private TransactionRepository transactionRepository;

    @MockBean
    private RazorpayService razorpayService;

    @BeforeEach
    void before(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new HttpTestTarget("localhost", port));
        }
    }

    @TestTemplate
    @ExtendWith(PactVerificationSpring6Provider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        if (context != null) { context.verifyInteraction(); }
    }

    /**
     * Pact consumer contracts intentionally use a placeholder "Bearer test-token" since the
     * frontend doesn't own a real signing key. Inject a real signed JWT here so requests pass
     * payment-service's auth filter — Pact only checks headers declared in the contract, so this
     * extra/overridden header does not break matching.
     */
    @TargetRequestFilter
    void addAuthHeader(HttpUriRequestBase request) {
        request.setHeader("Authorization", "Bearer " + generateTestJwt());
    }

    private String generateTestJwt() {
        SecretKey key = Keys.hmacShaKeyFor(TEST_JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        return Jwts.builder()
                .subject("pact-test-user")
                .claim("email", "pact-test@masova.com")
                .claim("roles", List.of("CUSTOMER"))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + Duration.ofMinutes(5).toMillis()))
                .signWith(key)
                .compact();
    }

    @State("payment service is available")
    void paymentServiceAvailable() {
    }

    @State("payment transaction exists with id txn-1")
    void paymentTransactionExists() {
        when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                .thenReturn(true);
        try {
            when(razorpayService.fetchPayment(anyString()))
                    .thenReturn(new Payment(new JSONObject().put("method", "card")));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        Transaction transaction = Transaction.builder()
                .orderId("ORDER-PACT-1")
                .razorpayOrderId("order_razorpay_1")
                .amount(java.math.BigDecimal.valueOf(450))
                .status(Transaction.PaymentStatus.PENDING)
                .currency("INR")
                .build();
        transactionRepository.save(transaction);
    }
}
