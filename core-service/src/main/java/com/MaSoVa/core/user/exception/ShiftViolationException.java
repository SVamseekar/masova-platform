package com.MaSoVa.core.user.exception;

public class ShiftViolationException extends RuntimeException {
    public ShiftViolationException(String message) {
        super(message);
    }
    
    public ShiftViolationException(String message, Throwable cause) {
        super(message, cause);
    }
}