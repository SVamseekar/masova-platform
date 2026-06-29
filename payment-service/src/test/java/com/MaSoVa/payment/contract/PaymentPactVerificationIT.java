package com.MaSoVa.payment.contract;

import au.com.dius.pact.core.model.Interaction;
import au.com.dius.pact.core.model.Pact;
import au.com.dius.pact.provider.HttpClientFactory;
import au.com.dius.pact.provider.IHttpClientFactory;
import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.IgnoreNoPactsToVerify;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.spring6.PactVerificationSpring6Provider;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import com.razorpay.Order;
import com.razorpay.Payment;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import kotlin.Pair;
import org.apache.hc.client5.http.classic.methods.HttpUriRequest;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("payment-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class PaymentPactVerificationIT extends BaseFullIntegrationTest {

    /**
     * Read from the live Spring environment (not hardcoded) so this always matches whatever
     * jwt.secret is active - application-test.yml locally, or the JWT_SECRET env var override in CI.
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    @LocalServerPort
    int port;

    @Autowired
    private TransactionRepository transactionRepository;

    @MockBean
    private RazorpayService razorpayService;

    @BeforeEach
    void before(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new AuthInjectingTestTarget("localhost", port));
        }
    }

    @TestTemplate
    @ExtendWith(PactVerificationSpring6Provider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        if (context != null) { context.verifyInteraction(); }
    }

    /**
     * Pact-jvm's junit5 HttpTestTarget has no @TargetRequestFilter support (that hook only
     * exists in the junit4 module) - override prepareRequest to inject a real signed JWT so
     * requests pass payment-service's auth filter. Pact only checks headers declared in the
     * contract, so this extra/overridden header does not break matching.
     */
    private final class AuthInjectingTestTarget extends HttpTestTarget {
        AuthInjectingTestTarget(String host, int port) {
            super(host, port, "/", () -> (IHttpClientFactory) new HttpClientFactory());
        }

        @Override
        public Pair<Object, Object> prepareRequest(Pact pact, Interaction interaction, Map<String, Object> context) {
            Pair<Object, Object> result = super.prepareRequest(pact, interaction, context);
            if (result != null && result.getFirst() instanceof HttpUriRequest httpRequest) {
                httpRequest.setHeader("Authorization", "Bearer " + generateTestJwt());
            }
            return result;
        }
    }

    private String generateTestJwt() {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
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
        try {
            // This state is shared by both "initiate" interactions, each of which places a real
            // order via PaymentService - return a unique razorpayOrderId per call so their
            // Transaction inserts don't collide on the unique razorpayOrderId index.
            when(razorpayService.createOrder(any(), anyString(), anyString()))
                    .thenAnswer(invocation -> new Order(new JSONObject()
                            .put("id", "order_pact_generated_" + java.util.UUID.randomUUID())));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // This state is shared by multiple Pact interactions, so the callback runs once per
        // interaction - guard the seed so repeat invocations don't violate the _id unique index.
        if (!transactionRepository.existsById("TXN-PACT-1")) {
            Transaction transaction = Transaction.builder()
                    .orderId("ORDER-PACT-STATUS")
                    .razorpayOrderId("order_razorpay_status")
                    .amount(java.math.BigDecimal.valueOf(450))
                    .status(Transaction.PaymentStatus.PENDING)
                    .currency("INR")
                    .build();
            transaction.setId("TXN-PACT-1");
            transactionRepository.save(transaction);
        }
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
                .orderId("ORDER-PACT-VERIFY")
                .razorpayOrderId("order_razorpay_1")
                .amount(java.math.BigDecimal.valueOf(450))
                .status(Transaction.PaymentStatus.PENDING)
                .currency("INR")
                .build();
        transactionRepository.save(transaction);
    }
}
