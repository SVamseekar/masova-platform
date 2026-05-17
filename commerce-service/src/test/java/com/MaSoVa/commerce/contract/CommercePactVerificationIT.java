package com.MaSoVa.commerce.contract;

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
@Provider("commerce-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class CommercePactVerificationIT extends BaseFullIntegrationTest {

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

    @State("menu items exist")
    void menuItemsExist() {
    }

    @State(value = "menu items exist", action = StateChangeAction.TEARDOWN)
    void cleanupMenuItems() {
    }

    @State("order exists with id ORDER-PACT-1")
    void orderExists() {
    }

    @State(value = "order exists with id ORDER-PACT-1", action = StateChangeAction.TEARDOWN)
    void cleanupOrder() {
    }

    @State("no data")
    void noData() {
    }
}
