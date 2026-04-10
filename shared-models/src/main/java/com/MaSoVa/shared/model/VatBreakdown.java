package com.MaSoVa.shared.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full VAT breakdown for an order.
 * Stored on Order.vatBreakdown (MongoDB) and serialised to vat_breakdown JSONB (PostgreSQL).
 */
public class VatBreakdown {

    private String vatCountryCode;
    private String orderContext;
    private BigDecimal totalNetAmount;
    private BigDecimal totalVatAmount;
    private BigDecimal totalGrossAmount;
    private List<VatLineItem> lines;

    public VatBreakdown() {}

    public VatBreakdown(String vatCountryCode, String orderContext,
                        BigDecimal totalNetAmount, BigDecimal totalVatAmount,
                        BigDecimal totalGrossAmount, List<VatLineItem> lines) {
        this.vatCountryCode = vatCountryCode;
        this.orderContext = orderContext;
        this.totalNetAmount = totalNetAmount;
        this.totalVatAmount = totalVatAmount;
        this.totalGrossAmount = totalGrossAmount;
        this.lines = lines;
    }

    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public String getOrderContext() { return orderContext; }
    public void setOrderContext(String orderContext) { this.orderContext = orderContext; }

    public BigDecimal getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(BigDecimal totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }

    public BigDecimal getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(BigDecimal totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public List<VatLineItem> getLines() { return lines; }
    public void setLines(List<VatLineItem> lines) { this.lines = lines; }
}
