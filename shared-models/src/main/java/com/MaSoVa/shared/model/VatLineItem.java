package com.MaSoVa.shared.model;

import java.math.BigDecimal;

/**
 * VAT breakdown for a single order line item.
 * Stored in VatBreakdown.lines — required for fiscal compliance (Global-2).
 */
public class VatLineItem {

    private String menuItemId;
    private String itemName;
    private double vatRate;
    private BigDecimal netAmount;
    private BigDecimal vatAmount;
    private BigDecimal grossAmount;

    public VatLineItem() {}

    public VatLineItem(String menuItemId, String itemName, double vatRate,
                       BigDecimal netAmount, BigDecimal vatAmount, BigDecimal grossAmount) {
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.vatRate = vatRate;
        this.netAmount = netAmount;
        this.vatAmount = vatAmount;
        this.grossAmount = grossAmount;
    }

    public String getMenuItemId() { return menuItemId; }
    public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public double getVatRate() { return vatRate; }
    public void setVatRate(double vatRate) { this.vatRate = vatRate; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
}
