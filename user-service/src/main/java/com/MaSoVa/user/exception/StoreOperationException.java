package com.MaSoVa.user.exception;

/**
 * Exception thrown when store operations fail or encounter business rule violations
 */
public class StoreOperationException extends RuntimeException {
    
    private final String storeId;
    private final String operationType;
    private final String errorCode;
    
    public StoreOperationException(String message) {
        super(message);
        this.storeId = null;
        this.operationType = "UNKNOWN";
        this.errorCode = "STORE_OPERATION_ERROR";
    }
    
    public StoreOperationException(String message, String storeId, String operationType) {
        super(message);
        this.storeId = storeId;
        this.operationType = operationType;
        this.errorCode = "STORE_OPERATION_ERROR";
    }
    
    public StoreOperationException(String message, String storeId, String operationType, String errorCode) {
        super(message);
        this.storeId = storeId;
        this.operationType = operationType;
        this.errorCode = errorCode;
    }
    
    public StoreOperationException(String message, Throwable cause) {
        super(message, cause);
        this.storeId = null;
        this.operationType = "UNKNOWN";
        this.errorCode = "STORE_OPERATION_ERROR";
    }
    
    public StoreOperationException(String message, Throwable cause, String storeId, String operationType) {
        super(message, cause);
        this.storeId = storeId;
        this.operationType = operationType;
        this.errorCode = "STORE_OPERATION_ERROR";
    }
    
    // Getters
    public String getStoreId() { 
        return storeId; 
    }
    
    public String getOperationType() { 
        return operationType; 
    }
    
    public String getErrorCode() { 
        return errorCode; 
    }
    
    // Utility methods for common store operation errors
    public static StoreOperationException storeNotFound(String storeId) {
        return new StoreOperationException(
            "Store not found: " + storeId, 
            storeId, 
            "FIND_STORE", 
            "STORE_NOT_FOUND"
        );
    }
    
    public static StoreOperationException storeNotOperational(String storeId) {
        return new StoreOperationException(
            "Store is not operational: " + storeId, 
            storeId, 
            "CHECK_OPERATIONAL", 
            "STORE_NOT_OPERATIONAL"
        );
    }
    
    public static StoreOperationException invalidStoreConfiguration(String storeId, String reason) {
        return new StoreOperationException(
            "Invalid store configuration: " + reason, 
            storeId, 
            "VALIDATE_CONFIG", 
            "INVALID_CONFIG"
        );
    }
    
    public static StoreOperationException accessDenied(String storeId, String userId) {
        return new StoreOperationException(
            "Access denied to store " + storeId + " for user " + userId, 
            storeId, 
            "ACCESS_CHECK", 
            "ACCESS_DENIED"
        );
    }
}
