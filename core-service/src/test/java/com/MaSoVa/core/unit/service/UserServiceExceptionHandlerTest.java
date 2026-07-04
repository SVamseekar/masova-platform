package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.user.exception.ShiftViolationException;
import com.MaSoVa.core.user.exception.StoreOperationException;
import com.MaSoVa.core.user.exception.UserServiceExceptionHandler;
import com.MaSoVa.core.user.exception.UserServiceExceptionHandler.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.*;

@DisplayName("UserServiceExceptionHandler Unit Tests")
class UserServiceExceptionHandlerTest {

    private final UserServiceExceptionHandler handler = new UserServiceExceptionHandler();

    @Nested
    @DisplayName("handleRuntimeException")
    class HandleRuntimeException {

        @Test
        @DisplayName("returns 500 with exception message")
        void returns500() {
            RuntimeException ex = new RuntimeException("Something went wrong");

            ResponseEntity<ErrorResponse> response = handler.handleRuntimeException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(500);
            assertThat(response.getBody().getMessage()).isEqualTo("Something went wrong");
            assertThat(response.getBody().getTimestamp()).isNotNull();
        }
    }

    @Nested
    @DisplayName("handleIllegalArgumentException")
    class HandleIllegalArgumentException {

        @Test
        @DisplayName("returns 400 with exception message")
        void returns400() {
            IllegalArgumentException ex = new IllegalArgumentException("Invalid input");

            ResponseEntity<ErrorResponse> response = handler.handleIllegalArgumentException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(400);
            assertThat(response.getBody().getMessage()).isEqualTo("Invalid input");
        }
    }

    @Nested
    @DisplayName("handleStoreOperationException")
    class HandleStoreOperationException {

        @Test
        @DisplayName("returns 400 with store details in response")
        void returns400WithDetails() {
            StoreOperationException ex = new StoreOperationException(
                    "Store operation failed", "store-1", "OPEN_STORE", "STORE_001");

            ResponseEntity<ErrorResponse> response = handler.handleStoreOperationException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getValidationErrors()).containsKey("storeId");
            assertThat(response.getBody().getValidationErrors()).containsKey("operationType");
        }

        @Test
        @DisplayName("handles null storeId and operationType gracefully")
        void handlesNullFields() {
            StoreOperationException ex = new StoreOperationException("Failed");

            ResponseEntity<ErrorResponse> response = handler.handleStoreOperationException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    @Nested
    @DisplayName("handleShiftViolationException")
    class HandleShiftViolationException {

        @Test
        @DisplayName("returns 409 CONFLICT with shift violation message")
        void returns409() {
            ShiftViolationException ex = new ShiftViolationException("Too late to start");

            ResponseEntity<ErrorResponse> response = handler.handleShiftViolationException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).contains("Too late to start");
        }
    }

    @Nested
    @DisplayName("handleNoResourceFound")
    class HandleNoResourceFound {

        @Test
        @DisplayName("returns 404 not 500 for a genuinely missing route")
        void noResourceFoundException_returnsNotFound_notInternalServerError() {
            NoResourceFoundException ex = new NoResourceFoundException(
                    HttpMethod.GET, "api/test-data/create-default-store");

            ResponseEntity<ErrorResponse> response = handler.handleNoResourceFound(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(404);
        }
    }

    @Nested
    @DisplayName("handleGenericException")
    class HandleGenericException {

        @Test
        @DisplayName("returns 500 with generic message for unexpected exceptions")
        void returns500Generic() {
            Exception ex = new Exception("Unexpected DB error");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody().getMessage()).contains("unexpected error");
        }
    }

    @Nested
    @DisplayName("ErrorResponse inner class")
    class ErrorResponseTests {

        @Test
        @DisplayName("constructor with 3 args sets fields correctly")
        void threeArgConstructor() {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            ErrorResponse response = new ErrorResponse(400, "Bad request", now);

            assertThat(response.getStatus()).isEqualTo(400);
            assertThat(response.getMessage()).isEqualTo("Bad request");
            assertThat(response.getTimestamp()).isEqualTo(now);
            assertThat(response.getValidationErrors()).isNull();
        }

        @Test
        @DisplayName("setters update fields correctly")
        void settersWork() {
            ErrorResponse response = new ErrorResponse(200, "OK", java.time.LocalDateTime.now());
            response.setStatus(201);
            response.setMessage("Created");

            assertThat(response.getStatus()).isEqualTo(201);
            assertThat(response.getMessage()).isEqualTo("Created");
        }
    }
}
