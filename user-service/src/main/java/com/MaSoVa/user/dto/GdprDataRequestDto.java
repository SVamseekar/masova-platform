package com.MaSoVa.user.dto;

import com.MaSoVa.shared.enums.GdprRequestType;
import jakarta.validation.constraints.NotNull;

public class GdprDataRequestDto {

    @NotNull
    private String userId;

    @NotNull
    private GdprRequestType requestType;

    private String reason;

    public GdprDataRequestDto() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public GdprRequestType getRequestType() { return requestType; }
    public void setRequestType(GdprRequestType requestType) { this.requestType = requestType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
