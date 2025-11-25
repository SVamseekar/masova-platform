package com.MaSoVa.user.dto;

import com.MaSoVa.shared.enums.ConsentType;
import jakarta.validation.constraints.NotNull;

public class GdprConsentRequest {

    @NotNull
    private String userId;

    @NotNull
    private ConsentType consentType;

    private String version;

    private String consentText;

    public GdprConsentRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ConsentType getConsentType() { return consentType; }
    public void setConsentType(ConsentType consentType) { this.consentType = consentType; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getConsentText() { return consentText; }
    public void setConsentText(String consentText) { this.consentText = consentText; }
}
