package com.MaSoVa.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Standardized error response format for all MaSoVa services.
 * PROD-005: Consistent error handling across microservices
 *
 * Example usage:
 * <pre>
 * return ResponseEntity
 *     .status(HttpStatus.BAD_REQUEST)
 *     .body(ErrorResponse.builder()
 *         .error("INVALID_ORDER")
 *         .message("Order items cannot be empty")
 *         .path(request.getRequestURI())
 *         .build());
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String timestamp;           // ISO-8601 timestamp
    private int status;                 // HTTP status code
    private String error;               // Error code (e.g., "INVALID_ORDER", "RESOURCE_NOT_FOUND")
    private String message;             // Human-readable error message
    private String path;                // Request path that caused the error
    private String correlationId;       // Request correlation ID for tracing
    private List<ValidationError> validationErrors;  // Field-level validation errors
    private String debugMessage;        // Additional debug info (only in dev/test)

    public ErrorResponse() {
        this.timestamp = LocalDateTime.now().toString();
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ErrorResponse response = new ErrorResponse();

        public Builder status(int status) {
            response.status = status;
            return this;
        }

        public Builder error(String error) {
            response.error = error;
            return this;
        }

        public Builder message(String message) {
            response.message = message;
            return this;
        }

        public Builder path(String path) {
            response.path = path;
            return this;
        }

        public Builder correlationId(String correlationId) {
            response.correlationId = correlationId;
            return this;
        }

        public Builder addValidationError(String field, String message) {
            if (response.validationErrors == null) {
                response.validationErrors = new ArrayList<>();
            }
            response.validationErrors.add(new ValidationError(field, message));
            return this;
        }

        public Builder validationErrors(List<ValidationError> errors) {
            response.validationErrors = errors;
            return this;
        }

        public Builder debugMessage(String debugMessage) {
            response.debugMessage = debugMessage;
            return this;
        }

        public ErrorResponse build() {
            return response;
        }
    }

    /**
     * Field-level validation error
     */
    public static class ValidationError {
        private String field;
        private String message;

        public ValidationError() {}

        public ValidationError(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    // Getters and Setters
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public List<ValidationError> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<ValidationError> validationErrors) { this.validationErrors = validationErrors; }

    public String getDebugMessage() { return debugMessage; }
    public void setDebugMessage(String debugMessage) { this.debugMessage = debugMessage; }
}
