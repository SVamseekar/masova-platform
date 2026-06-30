package com.MaSoVa.commerce.fiscal.dto;

import java.time.OffsetDateTime;

public class FiscalSummaryDto {

    private String storeId;
    private String countryCode;
    private String signerSystem;
    private long totalSigned;
    private long failedLast7Days;
    private OffsetDateTime lastSignedAt;

    public FiscalSummaryDto() {}

    public FiscalSummaryDto(String storeId, String countryCode, String signerSystem,
                            long totalSigned, long failedLast7Days, OffsetDateTime lastSignedAt) {
        this.storeId = storeId;
        this.countryCode = countryCode;
        this.signerSystem = signerSystem;
        this.totalSigned = totalSigned;
        this.failedLast7Days = failedLast7Days;
        this.lastSignedAt = lastSignedAt;
    }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getSignerSystem() { return signerSystem; }
    public void setSignerSystem(String signerSystem) { this.signerSystem = signerSystem; }

    public long getTotalSigned() { return totalSigned; }
    public void setTotalSigned(long totalSigned) { this.totalSigned = totalSigned; }

    public long getFailedLast7Days() { return failedLast7Days; }
    public void setFailedLast7Days(long failedLast7Days) { this.failedLast7Days = failedLast7Days; }

    public OffsetDateTime getLastSignedAt() { return lastSignedAt; }
    public void setLastSignedAt(OffsetDateTime lastSignedAt) { this.lastSignedAt = lastSignedAt; }
}