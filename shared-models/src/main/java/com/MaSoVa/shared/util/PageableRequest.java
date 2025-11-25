package com.MaSoVa.shared.util;

/**
 * Standardized pagination request model
 * Phase 13: Performance Optimization - API Pagination
 */
public class PageableRequest {
    private int page = 0;
    private int size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";

    public PageableRequest() {
    }

    public PageableRequest(int page, int size) {
        this.page = page;
        this.size = size;
    }

    public PageableRequest(int page, int size, String sortBy, String sortDirection) {
        this.page = page;
        this.size = size;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = Math.max(0, page);
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = Math.min(Math.max(1, size), 100); // Max 100 items per page
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy != null ? sortBy : "createdAt";
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection != null && sortDirection.equalsIgnoreCase("ASC") ? "ASC" : "DESC";
    }

    public int getOffset() {
        return page * size;
    }
}
