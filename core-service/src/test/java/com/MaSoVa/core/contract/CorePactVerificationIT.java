package com.MaSoVa.core.contract;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.IgnoreNoPactsToVerify;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.StateChangeAction;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.spring6.PactVerificationSpring6Provider;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("core-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class CorePactVerificationIT extends BaseFullIntegrationTest {

    @LocalServerPort
    int port;

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

    @State("user exists with id USER-PACT-1")
    void userExists() {
    }

    @State(value = "user exists with id USER-PACT-1", action = StateChangeAction.TEARDOWN)
    void cleanupUser() {
    }

    @State("store exists with id STORE-PACT-1")
    void storeExists() {
    }

    @State(value = "store exists with id STORE-PACT-1", action = StateChangeAction.TEARDOWN)
    void cleanupStore() {
    }

    @State("no data")
    void noData() {
    }
}
