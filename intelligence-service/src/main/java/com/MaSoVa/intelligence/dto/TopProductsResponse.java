package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.util.List;

public class TopProductsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<ProductData> topProducts;
    private String period; // "TODAY", "WEEK", "MONTH"
    private String sortBy; // "QUANTITY" or "REVENUE"

    // Constructors
    public TopProductsResponse() {}

    // Getters and Setters
    public List<ProductData> getTopProducts() { return topProducts; }
    public void setTopProducts(List<ProductData> topProducts) { this.topProducts = topProducts; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TopProductsResponse response = new TopProductsResponse();

        public Builder topProducts(List<ProductData> topProducts) { response.topProducts = topProducts; return this; }
        public Builder period(String period) { response.period = period; return this; }
        public Builder sortBy(String sortBy) { response.sortBy = sortBy; return this; }

        public TopProductsResponse build() { return response; }
    }

    public static class ProductData implements Serializable {
        private static final long serialVersionUID = 1L;

        private int rank;
        private String itemId;
        private String itemName;
        private String category;
        private int quantitySold;
        private BigDecimal revenue;
        private BigDecimal unitPrice;
        private BigDecimal percentOfTotalRevenue;
        private String trend; // "UP", "DOWN", "STABLE", "NEW"

        // Constructors
        public ProductData() {}

        // Getters and Setters
        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }

        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }

        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getQuantitySold() { return quantitySold; }
        public void setQuantitySold(int quantitySold) { this.quantitySold = quantitySold; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

        public BigDecimal getPercentOfTotalRevenue() { return percentOfTotalRevenue; }
        public void setPercentOfTotalRevenue(BigDecimal percentOfTotalRevenue) { this.percentOfTotalRevenue = percentOfTotalRevenue; }

        public String getTrend() { return trend; }
        public void setTrend(String trend) { this.trend = trend; }

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final ProductData data = new ProductData();

            public Builder rank(int rank) { data.rank = rank; return this; }
            public Builder itemId(String itemId) { data.itemId = itemId; return this; }
            public Builder itemName(String itemName) { data.itemName = itemName; return this; }
            public Builder category(String category) { data.category = category; return this; }
            public Builder quantitySold(int quantitySold) { data.quantitySold = quantitySold; return this; }
            public Builder revenue(BigDecimal revenue) { data.revenue = revenue; return this; }
            public Builder unitPrice(BigDecimal unitPrice) { data.unitPrice = unitPrice; return this; }
            public Builder percentOfTotalRevenue(BigDecimal percentOfTotalRevenue) { data.percentOfTotalRevenue = percentOfTotalRevenue; return this; }
            public Builder trend(String trend) { data.trend = trend; return this; }

            public ProductData build() { return data; }
        }
    }
}
