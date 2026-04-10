package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.shared.model.VatBreakdown;
import com.MaSoVa.shared.model.VatLineItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Calculates EU VAT breakdown for an order.
 * Called by OrderService when store.countryCode is non-null (EU/non-India store).
 * India stores continue to use TaxConfiguration (GST) — this service is not called for them.
 */
@Service
public class EuVatEngine {

    private final EuVatConfiguration euVatConfig;

    public EuVatEngine(EuVatConfiguration euVatConfig) {
        this.euVatConfig = euVatConfig;
    }

    /**
     * Calculates VAT breakdown for the given order items.
     *
     * @param countryCode  ISO country code, e.g. "DE"
     * @param orderContext "DINE_IN", "TAKEAWAY", or "DELIVERY"
     * @param items        list of order items (each may have a category field)
     * @return VatBreakdown with per-line items and order-level totals
     */
    public VatBreakdown calculate(String countryCode, String orderContext, List<OrderItem> items) {
        List<VatLineItem> lines = new ArrayList<>();
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (OrderItem item : items) {
            String category = item.getCategory() != null ? item.getCategory().toUpperCase() : "FOOD";
            double vatRatePct = euVatConfig.lookupRate(countryCode, orderContext, category);

            BigDecimal net = BigDecimal.valueOf(item.getPrice())
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal vat = net.multiply(BigDecimal.valueOf(vatRatePct / 100.0))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal gross = net.add(vat);

            lines.add(new VatLineItem(item.getMenuItemId(), item.getName(), vatRatePct, net, vat, gross));
            totalNet = totalNet.add(net);
            totalVat = totalVat.add(vat);
        }

        BigDecimal totalGross = totalNet.add(totalVat);
        return new VatBreakdown(countryCode, orderContext, totalNet, totalVat, totalGross, lines);
    }
}
