package com.MaSoVa.shared.model;

import java.time.Instant;
import java.util.Map;

/**
 * Fiscal signature stored on an Order after terminal-status signing.
 * isRequired=false: passthrough or not-applicable signers.
 * signingFailed=true: signing was attempted but failed (alert manager).
 */
public class FiscalSignature {

    private String signerCountry;       // ISO 3166-1 alpha-2
    private String signerSystem;        // "TSE", "NF525", "RT", "FDM", "NTCA", "MTD", "STRIPE_TAX", "PASSTHROUGH"
    private String transactionId;       // Fiscal system transaction ID
    private String signatureValue;      // Actual signature / hash / QR seed
    private String qrCodeData;          // For printed QR (AT, DE, IT, BE)
    private Instant signedAt;           // From signing system clock, never LocalDateTime.now()
    private String signingDeviceId;     // Hardware device serial (DE/IT/BE)
    private boolean required;           // false = passthrough countries
    private boolean signingFailed;      // true = signing was attempted but failed
    private String signingError;        // Error message if signingFailed
    private Map<String, String> extras; // Country-specific extra fields

    public FiscalSignature() {}

    public FiscalSignature(String signerCountry, String signerSystem,
                           String transactionId, String signatureValue,
                           String qrCodeData, Instant signedAt,
                           String signingDeviceId, boolean required) {
        this.signerCountry = signerCountry;
        this.signerSystem = signerSystem;
        this.transactionId = transactionId;
        this.signatureValue = signatureValue;
        this.qrCodeData = qrCodeData;
        this.signedAt = signedAt;
        this.signingDeviceId = signingDeviceId;
        this.required = required;
    }

    /** Factory for passthrough (no signing required) countries. */
    public static FiscalSignature passthrough(String countryCode) {
        FiscalSignature sig = new FiscalSignature();
        sig.signerCountry = countryCode;
        sig.signerSystem = "PASSTHROUGH";
        sig.signedAt = Instant.now();
        sig.required = false;
        return sig;
    }

    /** Factory for signing failure — alert must be raised. */
    public static FiscalSignature failed(String countryCode, String signerSystem, String error) {
        FiscalSignature sig = new FiscalSignature();
        sig.signerCountry = countryCode;
        sig.signerSystem = signerSystem;
        sig.signedAt = Instant.now();
        sig.required = true;
        sig.signingFailed = true;
        sig.signingError = error;
        return sig;
    }

    public String getSignerCountry() { return signerCountry; }
    public void setSignerCountry(String signerCountry) { this.signerCountry = signerCountry; }

    public String getSignerSystem() { return signerSystem; }
    public void setSignerSystem(String signerSystem) { this.signerSystem = signerSystem; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getSignatureValue() { return signatureValue; }
    public void setSignatureValue(String signatureValue) { this.signatureValue = signatureValue; }

    public String getQrCodeData() { return qrCodeData; }
    public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public String getSigningDeviceId() { return signingDeviceId; }
    public void setSigningDeviceId(String signingDeviceId) { this.signingDeviceId = signingDeviceId; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public boolean isSigningFailed() { return signingFailed; }
    public void setSigningFailed(boolean signingFailed) { this.signingFailed = signingFailed; }

    public String getSigningError() { return signingError; }
    public void setSigningError(String signingError) { this.signingError = signingError; }

    public Map<String, String> getExtras() { return extras; }
    public void setExtras(Map<String, String> extras) { this.extras = extras; }
}
