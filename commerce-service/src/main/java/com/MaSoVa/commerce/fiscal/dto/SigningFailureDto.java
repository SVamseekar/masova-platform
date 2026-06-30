package com.MaSoVa.commerce.fiscal.dto;

import java.time.OffsetDateTime;

public class SigningFailureDto {

    private String orderId;
    private String storeId;
    private String countryCode;
    private String signerSystem;
    private String signingError;
    private OffsetDateTime occurredAt;

    public SigningFailureDto() {}

    public SigningFailureDto(String orderId, String storeId, String countryCode,
                             String signerSystem, String signingError, OffsetDateTime occurredAt) {
        this.orderId = orderId;
        this.storeId = storeId;
        this.countryCode = countryCode;
        this.signerSystem = signerSystem;
        this.signingError = signingError;
        this.occurredAt = occurredAt;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getSignerSystem() { return signerSystem; }
    public void setSignerSystem(String signerSystem) { this.signerSystem = signerSystem; }

    public String getSigningError() { return signingError; }
    public void setSigningError(String signingError) { this.signingError = signingError; }

    public OffsetDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(OffsetDateTime occurredAt) { this.occurredAt = occurredAt; }
}