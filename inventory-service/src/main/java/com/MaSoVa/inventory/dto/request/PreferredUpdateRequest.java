package com.MaSoVa.inventory.dto.request;

/**
 * Request DTO for updating supplier preferred status
 */
public class PreferredUpdateRequest {
    private Boolean isPreferred;

    public Boolean getIsPreferred() { return isPreferred; }
    public void setIsPreferred(Boolean isPreferred) { this.isPreferred = isPreferred; }
}
