package com.MaSoVa.customer.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AddCustomerNoteRequest {

    @NotBlank(message = "Note is required")
    private String note;

    @NotBlank(message = "Added by is required")
    private String addedBy;

    @NotBlank(message = "Category is required")
    private String category; // GENERAL, COMPLAINT, PREFERENCE, OTHER

    public AddCustomerNoteRequest() {}

    public AddCustomerNoteRequest(String note, String addedBy, String category) {
        this.note = note;
        this.addedBy = addedBy;
        this.category = category;
    }

    // Getters and Setters
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
