package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductsResponse {

    private List<ProductData> topProducts;
    private String period; // "TODAY", "WEEK", "MONTH"
    private String sortBy; // "QUANTITY" or "REVENUE"

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductData {
        private int rank;
        private String itemId;
        private String itemName;
        private String category;
        private int quantitySold;
        private BigDecimal revenue;
        private BigDecimal unitPrice;
        private BigDecimal percentOfTotalRevenue;
        private String trend; // "UP", "DOWN", "STABLE", "NEW"
    }
}
