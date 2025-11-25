package com.MaSoVa.inventory.dto.request;

/**
 * Request DTO for receiving purchase orders
 */
public class ReceiveRequest {
    private String receivedBy;
    private String notes;

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
