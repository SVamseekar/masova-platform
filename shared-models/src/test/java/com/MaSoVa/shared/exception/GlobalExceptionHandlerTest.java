package com.MaSoVa.shared.exception;

import com.MaSoVa.shared.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalExceptionHandler")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    // ---- Validation exception ----

    @Nested
    @DisplayName("handleValidationException")
    class ValidationExceptionTests {

        @Test
        @DisplayName("Should return 400 BAD_REQUEST with validation error details")
        void shouldReturn400_withFieldErrors() {
            BindingResult bindingResult = mock(BindingResult.class);
            FieldError fieldError = new FieldError("order", "quantity", "must be positive");
            when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

            MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

            ResponseEntity<ErrorResponse> response = handler.handleValidationException(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("VALIDATION_FAILED");
            assertThat(response.getBody().getMessage()).isEqualTo("Request validation failed");
            assertThat(response.getBody().getPath()).isEqualTo("/api/test");
            assertThat(response.getBody().getValidationErrors()).hasSize(1);
            assertThat(response.getBody().getValidationErrors().get(0).getField()).isEqualTo("quantity");
            assertThat(response.getBody().getValidationErrors().get(0).getMessage()).isEqualTo("must be positive");
        }

        @Test
        @DisplayName("Should handle multiple validation errors")
        void shouldHandleMultipleFieldErrors() {
            BindingResult bindingResult = mock(BindingResult.class);
            when(bindingResult.getFieldErrors()).thenReturn(List.of(
                    new FieldError("order", "quantity", "must be positive"),
                    new FieldError("order", "itemId", "must not be null")
            ));

            MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);
            ResponseEntity<ErrorResponse> response = handler.handleValidationException(ex, request);

            assertThat(response.getBody().getValidationErrors()).hasSize(2);
        }
    }

    // ---- Type mismatch exception ----

    @Nested
    @DisplayName("handleTypeMismatch")
    class TypeMismatchTests {

        @Test
        @DisplayName("Should return 400 BAD_REQUEST with parameter type info")
        void shouldReturn400_withTypeInfo() {
            MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                    "abc", Integer.class, "page", null, null);

            ResponseEntity<ErrorResponse> response = handler.handleTypeMismatch(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("INVALID_PARAMETER_TYPE");
            assertThat(response.getBody().getMessage()).contains("page");
            assertThat(response.getBody().getMessage()).contains("Integer");
        }
    }

    // ---- Resource not found ----

    @Nested
    @DisplayName("handleResourceNotFound")
    class ResourceNotFoundTests {

        @Test
        @DisplayName("Should return 404 NOT_FOUND with resource details")
        void shouldReturn404_withResourceDetails() {
            ResourceNotFoundException ex = new ResourceNotFoundException("Order", "order-123");

            ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("RESOURCE_NOT_FOUND");
            assertThat(response.getBody().getMessage()).contains("Order");
            assertThat(response.getBody().getMessage()).contains("order-123");
        }

        @Test
        @DisplayName("Should return 404 with simple message constructor")
        void shouldReturn404_withSimpleMessage() {
            ResourceNotFoundException ex = new ResourceNotFoundException("Menu item not found");

            ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody().getMessage()).isEqualTo("Menu item not found");
        }
    }

    // ---- Access denied ----

    @Nested
    @DisplayName("handleAccessDenied")
    class AccessDeniedTests {

        @Test
        @DisplayName("Should return 403 FORBIDDEN")
        void shouldReturn403() {
            AccessDeniedException ex = new AccessDeniedException("Insufficient permissions");

            ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("ACCESS_DENIED");
            assertThat(response.getBody().getMessage()).isEqualTo("You do not have permission to access this resource");
        }
    }

    // ---- No handler found ----

    @Nested
    @DisplayName("handleNoHandlerFound")
    class NoHandlerFoundTests {

        @Test
        @DisplayName("Should return 404 with method and URL details")
        void shouldReturn404_withMethodAndUrl() {
            NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/api/unknown", null);

            ResponseEntity<ErrorResponse> response = handler.handleNoHandlerFound(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("ENDPOINT_NOT_FOUND");
            assertThat(response.getBody().getMessage()).contains("GET");
            assertThat(response.getBody().getMessage()).contains("/api/unknown");
        }
    }

    // ---- Business exception ----

    @Nested
    @DisplayName("handleBusinessException")
    class BusinessExceptionTests {

        @Test
        @DisplayName("Should return 400 with custom error code")
        void shouldReturn400_withCustomErrorCode() {
            BusinessException ex = new BusinessException("INVALID_ORDER", "Order items cannot be empty");

            ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("INVALID_ORDER");
            assertThat(response.getBody().getMessage()).isEqualTo("Order items cannot be empty");
        }

        @Test
        @DisplayName("Should use default BUSINESS_ERROR code when no code is provided")
        void shouldUseDefaultCode_whenNoCodeProvided() {
            BusinessException ex = new BusinessException("Something went wrong");

            ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex, request);

            assertThat(response.getBody().getError()).isEqualTo("BUSINESS_ERROR");
        }

        @Test
        @DisplayName("Should use default code when null error code is provided")
        void shouldUseDefaultCode_forNullErrorCode() {
            BusinessException ex = new BusinessException(null, "Some error");

            ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex, request);

            assertThat(response.getBody().getError()).isEqualTo("BUSINESS_ERROR");
        }
    }

    // ---- Optimistic locking failure ----

    @Nested
    @DisplayName("handleOptimisticLockingFailure")
    class OptimisticLockingTests {

        @Test
        @DisplayName("Should return 409 CONFLICT")
        void shouldReturn409() {
            OptimisticLockingFailureException ex = new OptimisticLockingFailureException("Version mismatch");

            ResponseEntity<ErrorResponse> response = handler.handleOptimisticLockingFailure(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("OPTIMISTIC_LOCK_FAILURE");
            assertThat(response.getBody().getMessage()).contains("modified by another user");
        }
    }

    // ---- Generic exception ----

    @Nested
    @DisplayName("handleGenericException")
    class GenericExceptionTests {

        @Test
        @DisplayName("Should return 500 INTERNAL_SERVER_ERROR for unexpected exceptions")
        void shouldReturn500() {
            Exception ex = new RuntimeException("NullPointerException in service layer");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getError()).isEqualTo("INTERNAL_SERVER_ERROR");
            assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred. Please try again later.");
            assertThat(response.getBody().getPath()).isEqualTo("/api/test");
        }

        @Test
        @DisplayName("Should include debug message from exception")
        void shouldIncludeDebugMessage() {
            Exception ex = new RuntimeException("detailed error info");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex, request);

            assertThat(response.getBody().getDebugMessage()).isEqualTo("detailed error info");
        }
    }

    // ---- ErrorResponse structure ----

    @Nested
    @DisplayName("ErrorResponse structure")
    class ErrorResponseStructure {

        @Test
        @DisplayName("Should always include a timestamp")
        void shouldAlwaysIncludeTimestamp() {
            Exception ex = new RuntimeException("test");
            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex, request);

            assertThat(response.getBody().getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("Should include the request path in all responses")
        void shouldIncludeRequestPath() {
            ResourceNotFoundException ex = new ResourceNotFoundException("Not found");
            ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex, request);

            assertThat(response.getBody().getPath()).isEqualTo("/api/test");
        }
    }
}
