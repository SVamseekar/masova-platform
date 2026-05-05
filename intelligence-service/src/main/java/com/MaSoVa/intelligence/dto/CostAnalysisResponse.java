package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CostAnalysisResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String period; // "TODAY", "WEEK", "MONTH"
    private BigDecimal totalRevenue; // INR
    private BigDecimal totalCosts; // INR
    private BigDecimal totalProfit; // INR
    private BigDecimal profitMargin; // Percentage
    private CostBreakdown costBreakdown;
    private List<IngredientCost> ingredientCosts;
    private List<WasteCost> wasteCosts;
    private List<OrderCostAnalysis> topCostOrders;
    private List<SupplierComparison> supplierComparisons;

    public CostAnalysisResponse() {}

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getTotalCosts() {
        return totalCosts;
    }

    public void setTotalCosts(BigDecimal totalCosts) {
        this.totalCosts = totalCosts;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }

    public BigDecimal getProfitMargin() {
        return profitMargin;
    }

    public void setProfitMargin(BigDecimal profitMargin) {
        this.profitMargin = profitMargin;
    }

    public CostBreakdown getCostBreakdown() {
        return costBreakdown;
    }

    public void setCostBreakdown(CostBreakdown costBreakdown) {
        this.costBreakdown = costBreakdown;
    }

    public List<IngredientCost> getIngredientCosts() {
        return ingredientCosts;
    }

    public void setIngredientCosts(List<IngredientCost> ingredientCosts) {
        this.ingredientCosts = ingredientCosts;
    }

    public List<WasteCost> getWasteCosts() {
        return wasteCosts;
    }

    public void setWasteCosts(List<WasteCost> wasteCosts) {
        this.wasteCosts = wasteCosts;
    }

    public List<OrderCostAnalysis> getTopCostOrders() {
        return topCostOrders;
    }

    public void setTopCostOrders(List<OrderCostAnalysis> topCostOrders) {
        this.topCostOrders = topCostOrders;
    }

    public List<SupplierComparison> getSupplierComparisons() {
        return supplierComparisons;
    }

    public void setSupplierComparisons(List<SupplierComparison> supplierComparisons) {
        this.supplierComparisons = supplierComparisons;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final CostAnalysisResponse obj = new CostAnalysisResponse();

        public Builder period(String period) {
            obj.period = period;
            return this;
        }

        public Builder totalRevenue(BigDecimal totalRevenue) {
            obj.totalRevenue = totalRevenue;
            return this;
        }

        public Builder totalCosts(BigDecimal totalCosts) {
            obj.totalCosts = totalCosts;
            return this;
        }

        public Builder totalProfit(BigDecimal totalProfit) {
            obj.totalProfit = totalProfit;
            return this;
        }

        public Builder profitMargin(BigDecimal profitMargin) {
            obj.profitMargin = profitMargin;
            return this;
        }

        public Builder costBreakdown(CostBreakdown costBreakdown) {
            obj.costBreakdown = costBreakdown;
            return this;
        }

        public Builder ingredientCosts(List<IngredientCost> ingredientCosts) {
            obj.ingredientCosts = ingredientCosts;
            return this;
        }

        public Builder wasteCosts(List<WasteCost> wasteCosts) {
            obj.wasteCosts = wasteCosts;
            return this;
        }

        public Builder topCostOrders(List<OrderCostAnalysis> topCostOrders) {
            obj.topCostOrders = topCostOrders;
            return this;
        }

        public Builder supplierComparisons(List<SupplierComparison> supplierComparisons) {
            obj.supplierComparisons = supplierComparisons;
            return this;
        }

        public CostAnalysisResponse build() {
            return obj;
        }
    }

    public static class CostBreakdown {
        private BigDecimal ingredientCosts; // INR
        private BigDecimal wasteCosts; // INR
        private BigDecimal laborCosts; // INR
        private BigDecimal overheadCosts; // INR
        private BigDecimal deliveryCosts; // INR
        private BigDecimal otherCosts; // INR

        public CostBreakdown() {}

        public BigDecimal getIngredientCosts() {
            return ingredientCosts;
        }

        public void setIngredientCosts(BigDecimal ingredientCosts) {
            this.ingredientCosts = ingredientCosts;
        }

        public BigDecimal getWasteCosts() {
            return wasteCosts;
        }

        public void setWasteCosts(BigDecimal wasteCosts) {
            this.wasteCosts = wasteCosts;
        }

        public BigDecimal getLaborCosts() {
            return laborCosts;
        }

        public void setLaborCosts(BigDecimal laborCosts) {
            this.laborCosts = laborCosts;
        }

        public BigDecimal getOverheadCosts() {
            return overheadCosts;
        }

        public void setOverheadCosts(BigDecimal overheadCosts) {
            this.overheadCosts = overheadCosts;
        }

        public BigDecimal getDeliveryCosts() {
            return deliveryCosts;
        }

        public void setDeliveryCosts(BigDecimal deliveryCosts) {
            this.deliveryCosts = deliveryCosts;
        }

        public BigDecimal getOtherCosts() {
            return otherCosts;
        }

        public void setOtherCosts(BigDecimal otherCosts) {
            this.otherCosts = otherCosts;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final CostBreakdown obj = new CostBreakdown();

            public Builder ingredientCosts(BigDecimal ingredientCosts) {
                obj.ingredientCosts = ingredientCosts;
                return this;
            }

            public Builder wasteCosts(BigDecimal wasteCosts) {
                obj.wasteCosts = wasteCosts;
                return this;
            }

            public Builder laborCosts(BigDecimal laborCosts) {
                obj.laborCosts = laborCosts;
                return this;
            }

            public Builder overheadCosts(BigDecimal overheadCosts) {
                obj.overheadCosts = overheadCosts;
                return this;
            }

            public Builder deliveryCosts(BigDecimal deliveryCosts) {
                obj.deliveryCosts = deliveryCosts;
                return this;
            }

            public Builder otherCosts(BigDecimal otherCosts) {
                obj.otherCosts = otherCosts;
                return this;
            }

            public CostBreakdown build() {
                return obj;
            }
        }
    }

    public static class IngredientCost {
        private String ingredientId;
        private String ingredientName;
        private BigDecimal quantityUsed;
        private String unit;
        private BigDecimal costPerUnit; // INR
        private BigDecimal totalCost; // INR
        private BigDecimal percentOfTotalCost;
        private String trend; // "UP", "DOWN", "STABLE"

        public IngredientCost() {}

        public String getIngredientId() {
            return ingredientId;
        }

        public void setIngredientId(String ingredientId) {
            this.ingredientId = ingredientId;
        }

        public String getIngredientName() {
            return ingredientName;
        }

        public void setIngredientName(String ingredientName) {
            this.ingredientName = ingredientName;
        }

        public BigDecimal getQuantityUsed() {
            return quantityUsed;
        }

        public void setQuantityUsed(BigDecimal quantityUsed) {
            this.quantityUsed = quantityUsed;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public BigDecimal getCostPerUnit() {
            return costPerUnit;
        }

        public void setCostPerUnit(BigDecimal costPerUnit) {
            this.costPerUnit = costPerUnit;
        }

        public BigDecimal getTotalCost() {
            return totalCost;
        }

        public void setTotalCost(BigDecimal totalCost) {
            this.totalCost = totalCost;
        }

        public BigDecimal getPercentOfTotalCost() {
            return percentOfTotalCost;
        }

        public void setPercentOfTotalCost(BigDecimal percentOfTotalCost) {
            this.percentOfTotalCost = percentOfTotalCost;
        }

        public String getTrend() {
            return trend;
        }

        public void setTrend(String trend) {
            this.trend = trend;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final IngredientCost obj = new IngredientCost();

            public Builder ingredientId(String ingredientId) {
                obj.ingredientId = ingredientId;
                return this;
            }

            public Builder ingredientName(String ingredientName) {
                obj.ingredientName = ingredientName;
                return this;
            }

            public Builder quantityUsed(BigDecimal quantityUsed) {
                obj.quantityUsed = quantityUsed;
                return this;
            }

            public Builder unit(String unit) {
                obj.unit = unit;
                return this;
            }

            public Builder costPerUnit(BigDecimal costPerUnit) {
                obj.costPerUnit = costPerUnit;
                return this;
            }

            public Builder totalCost(BigDecimal totalCost) {
                obj.totalCost = totalCost;
                return this;
            }

            public Builder percentOfTotalCost(BigDecimal percentOfTotalCost) {
                obj.percentOfTotalCost = percentOfTotalCost;
                return this;
            }

            public Builder trend(String trend) {
                obj.trend = trend;
                return this;
            }

            public IngredientCost build() {
                return obj;
            }
        }
    }

    public static class WasteCost {
        private String itemName;
        private BigDecimal quantityWasted;
        private String unit;
        private BigDecimal estimatedCost; // INR
        private String reason; // "Expired", "Spoiled", "Over-prepared", "Quality Issue"
        private LocalDate date;

        public WasteCost() {}

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public BigDecimal getQuantityWasted() {
            return quantityWasted;
        }

        public void setQuantityWasted(BigDecimal quantityWasted) {
            this.quantityWasted = quantityWasted;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public BigDecimal getEstimatedCost() {
            return estimatedCost;
        }

        public void setEstimatedCost(BigDecimal estimatedCost) {
            this.estimatedCost = estimatedCost;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final WasteCost obj = new WasteCost();

            public Builder itemName(String itemName) {
                obj.itemName = itemName;
                return this;
            }

            public Builder quantityWasted(BigDecimal quantityWasted) {
                obj.quantityWasted = quantityWasted;
                return this;
            }

            public Builder unit(String unit) {
                obj.unit = unit;
                return this;
            }

            public Builder estimatedCost(BigDecimal estimatedCost) {
                obj.estimatedCost = estimatedCost;
                return this;
            }

            public Builder reason(String reason) {
                obj.reason = reason;
                return this;
            }

            public Builder date(LocalDate date) {
                obj.date = date;
                return this;
            }

            public WasteCost build() {
                return obj;
            }
        }
    }

    public static class OrderCostAnalysis {
        private String orderId;
        private BigDecimal revenue; // INR
        private BigDecimal cost; // INR
        private BigDecimal profit; // INR
        private BigDecimal profitMargin; // Percentage
        private int itemCount;

        public OrderCostAnalysis() {}

        public String getOrderId() {
            return orderId;
        }

        public void setOrderId(String orderId) {
            this.orderId = orderId;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }

        public void setRevenue(BigDecimal revenue) {
            this.revenue = revenue;
        }

        public BigDecimal getCost() {
            return cost;
        }

        public void setCost(BigDecimal cost) {
            this.cost = cost;
        }

        public BigDecimal getProfit() {
            return profit;
        }

        public void setProfit(BigDecimal profit) {
            this.profit = profit;
        }

        public BigDecimal getProfitMargin() {
            return profitMargin;
        }

        public void setProfitMargin(BigDecimal profitMargin) {
            this.profitMargin = profitMargin;
        }

        public int getItemCount() {
            return itemCount;
        }

        public void setItemCount(int itemCount) {
            this.itemCount = itemCount;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final OrderCostAnalysis obj = new OrderCostAnalysis();

            public Builder orderId(String orderId) {
                obj.orderId = orderId;
                return this;
            }

            public Builder revenue(BigDecimal revenue) {
                obj.revenue = revenue;
                return this;
            }

            public Builder cost(BigDecimal cost) {
                obj.cost = cost;
                return this;
            }

            public Builder profit(BigDecimal profit) {
                obj.profit = profit;
                return this;
            }

            public Builder profitMargin(BigDecimal profitMargin) {
                obj.profitMargin = profitMargin;
                return this;
            }

            public Builder itemCount(int itemCount) {
                obj.itemCount = itemCount;
                return this;
            }

            public OrderCostAnalysis build() {
                return obj;
            }
        }
    }

    public static class SupplierComparison {
        private String ingredientName;
        private List<SupplierPrice> suppliers;
        private String recommendedSupplier;
        private BigDecimal potentialSavings; // INR per month

        public SupplierComparison() {}

        public String getIngredientName() {
            return ingredientName;
        }

        public void setIngredientName(String ingredientName) {
            this.ingredientName = ingredientName;
        }

        public List<SupplierPrice> getSuppliers() {
            return suppliers;
        }

        public void setSuppliers(List<SupplierPrice> suppliers) {
            this.suppliers = suppliers;
        }

        public String getRecommendedSupplier() {
            return recommendedSupplier;
        }

        public void setRecommendedSupplier(String recommendedSupplier) {
            this.recommendedSupplier = recommendedSupplier;
        }

        public BigDecimal getPotentialSavings() {
            return potentialSavings;
        }

        public void setPotentialSavings(BigDecimal potentialSavings) {
            this.potentialSavings = potentialSavings;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final SupplierComparison obj = new SupplierComparison();

            public Builder ingredientName(String ingredientName) {
                obj.ingredientName = ingredientName;
                return this;
            }

            public Builder suppliers(List<SupplierPrice> suppliers) {
                obj.suppliers = suppliers;
                return this;
            }

            public Builder recommendedSupplier(String recommendedSupplier) {
                obj.recommendedSupplier = recommendedSupplier;
                return this;
            }

            public Builder potentialSavings(BigDecimal potentialSavings) {
                obj.potentialSavings = potentialSavings;
                return this;
            }

            public SupplierComparison build() {
                return obj;
            }
        }
    }

    public static class SupplierPrice {
        private String supplierId;
        private String supplierName;
        private BigDecimal pricePerUnit; // INR
        private String unit;
        private String quality; // "Premium", "Standard", "Budget"
        private int deliveryDays;

        public SupplierPrice() {}

        public String getSupplierId() {
            return supplierId;
        }

        public void setSupplierId(String supplierId) {
            this.supplierId = supplierId;
        }

        public String getSupplierName() {
            return supplierName;
        }

        public void setSupplierName(String supplierName) {
            this.supplierName = supplierName;
        }

        public BigDecimal getPricePerUnit() {
            return pricePerUnit;
        }

        public void setPricePerUnit(BigDecimal pricePerUnit) {
            this.pricePerUnit = pricePerUnit;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public String getQuality() {
            return quality;
        }

        public void setQuality(String quality) {
            this.quality = quality;
        }

        public int getDeliveryDays() {
            return deliveryDays;
        }

        public void setDeliveryDays(int deliveryDays) {
            this.deliveryDays = deliveryDays;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final SupplierPrice obj = new SupplierPrice();

            public Builder supplierId(String supplierId) {
                obj.supplierId = supplierId;
                return this;
            }

            public Builder supplierName(String supplierName) {
                obj.supplierName = supplierName;
                return this;
            }

            public Builder pricePerUnit(BigDecimal pricePerUnit) {
                obj.pricePerUnit = pricePerUnit;
                return this;
            }

            public Builder unit(String unit) {
                obj.unit = unit;
                return this;
            }

            public Builder quality(String quality) {
                obj.quality = quality;
                return this;
            }

            public Builder deliveryDays(int deliveryDays) {
                obj.deliveryDays = deliveryDays;
                return this;
            }

            public SupplierPrice build() {
                return obj;
            }
        }
    }
}
