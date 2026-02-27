package com.MaSoVa.shared.test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Base class for service unit tests.
 *
 * Provides common setup and utilities for testing service classes.
 * All service test classes should extend this base class.
 *
 * Features:
 * - MockitoExtension for mocking dependencies
 * - Common test utilities and helpers
 * - Consistent test structure across all services
 *
 * @example
 * <pre>
 * {@code
 * @ExtendWith(MockitoExtension.class)
 * class OrderServiceTest extends BaseServiceTest {
 *     @Mock
 *     private OrderRepository orderRepository;
 *
 *     @InjectMocks
 *     private OrderService orderService;
 *
 *     @Test
 *     @DisplayName("Should create order successfully")
 *     void testCreateOrder() {
 *         // Arrange
 *         OrderRequest request = TestDataBuilder.buildOrderRequest();
 *         when(orderRepository.save(any())).thenReturn(new Order());
 *
 *         // Act
 *         Order result = orderService.createOrder(request);
 *
 *         // Assert
 *         assertNotNull(result);
 *         verify(orderRepository).save(any(Order.class));
 *     }
 * }
 * }
 * </pre>
 */
@ExtendWith(MockitoExtension.class)
public abstract class BaseServiceTest {

    /**
     * Asserts that an exception is thrown with the expected message
     */
    protected void assertExceptionMessage(Exception exception, String expectedMessage) {
        if (exception == null) {
            throw new AssertionError("Expected exception but none was thrown");
        }
        if (!exception.getMessage().contains(expectedMessage)) {
            throw new AssertionError(
                String.format("Expected exception message to contain '%s' but was '%s'",
                    expectedMessage, exception.getMessage())
            );
        }
    }

    /**
     * Sleep for a short duration to allow async operations to complete
     * Use sparingly - prefer proper async testing utilities when possible
     */
    protected void waitForAsync() throws InterruptedException {
        Thread.sleep(100);
    }

    /**
     * Sleep for a specified duration
     */
    protected void waitFor(long milliseconds) throws InterruptedException {
        Thread.sleep(milliseconds);
    }
}
