package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ChurnPredictionResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private int totalCustomersAnalyzed;
    private int highRiskCustomers;
    private int mediumRiskCustomers;
    private int lowRiskCustomers;
    private BigDecimal predictedChurnRate; // Percentage
    private List<ChurnRiskCustomer> atRiskCustomers;
    private List<ChurnFactor> churnFactors;

    public ChurnPredictionResponse() {}

    public int getTotalCustomersAnalyzed() {
        return totalCustomersAnalyzed;
    }

    public void setTotalCustomersAnalyzed(int totalCustomersAnalyzed) {
        this.totalCustomersAnalyzed = totalCustomersAnalyzed;
    }

    public int getHighRiskCustomers() {
        return highRiskCustomers;
    }

    public void setHighRiskCustomers(int highRiskCustomers) {
        this.highRiskCustomers = highRiskCustomers;
    }

    public int getMediumRiskCustomers() {
        return mediumRiskCustomers;
    }

    public void setMediumRiskCustomers(int mediumRiskCustomers) {
        this.mediumRiskCustomers = mediumRiskCustomers;
    }

    public int getLowRiskCustomers() {
        return lowRiskCustomers;
    }

    public void setLowRiskCustomers(int lowRiskCustomers) {
        this.lowRiskCustomers = lowRiskCustomers;
    }

    public BigDecimal getPredictedChurnRate() {
        return predictedChurnRate;
    }

    public void setPredictedChurnRate(BigDecimal predictedChurnRate) {
        this.predictedChurnRate = predictedChurnRate;
    }

    public List<ChurnRiskCustomer> getAtRiskCustomers() {
        return atRiskCustomers;
    }

    public void setAtRiskCustomers(List<ChurnRiskCustomer> atRiskCustomers) {
        this.atRiskCustomers = atRiskCustomers;
    }

    public List<ChurnFactor> getChurnFactors() {
        return churnFactors;
    }

    public void setChurnFactors(List<ChurnFactor> churnFactors) {
        this.churnFactors = churnFactors;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ChurnPredictionResponse obj = new ChurnPredictionResponse();

        public Builder totalCustomersAnalyzed(int totalCustomersAnalyzed) {
            obj.totalCustomersAnalyzed = totalCustomersAnalyzed;
            return this;
        }

        public Builder highRiskCustomers(int highRiskCustomers) {
            obj.highRiskCustomers = highRiskCustomers;
            return this;
        }

        public Builder mediumRiskCustomers(int mediumRiskCustomers) {
            obj.mediumRiskCustomers = mediumRiskCustomers;
            return this;
        }

        public Builder lowRiskCustomers(int lowRiskCustomers) {
            obj.lowRiskCustomers = lowRiskCustomers;
            return this;
        }

        public Builder predictedChurnRate(BigDecimal predictedChurnRate) {
            obj.predictedChurnRate = predictedChurnRate;
            return this;
        }

        public Builder atRiskCustomers(List<ChurnRiskCustomer> atRiskCustomers) {
            obj.atRiskCustomers = atRiskCustomers;
            return this;
        }

        public Builder churnFactors(List<ChurnFactor> churnFactors) {
            obj.churnFactors = churnFactors;
            return this;
        }

        public ChurnPredictionResponse build() {
            return obj;
        }
    }

    public static class ChurnRiskCustomer {
        private String customerId;
        private String customerName;
        private String email;
        private String riskLevel; // "HIGH", "MEDIUM", "LOW"
        private BigDecimal churnProbability; // 0-100
        private int daysSinceLastOrder;
        private BigDecimal lifetimeValue;
        private int totalOrders;
        private LocalDateTime lastOrderDate;
        private List<String> riskFactors;

        public ChurnRiskCustomer() {}

        public String getCustomerId() {
            return customerId;
        }

        public void setCustomerId(String customerId) {
            this.customerId = customerId;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public void setRiskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
        }

        public BigDecimal getChurnProbability() {
            return churnProbability;
        }

        public void setChurnProbability(BigDecimal churnProbability) {
            this.churnProbability = churnProbability;
        }

        public int getDaysSinceLastOrder() {
            return daysSinceLastOrder;
        }

        public void setDaysSinceLastOrder(int daysSinceLastOrder) {
            this.daysSinceLastOrder = daysSinceLastOrder;
        }

        public BigDecimal getLifetimeValue() {
            return lifetimeValue;
        }

        public void setLifetimeValue(BigDecimal lifetimeValue) {
            this.lifetimeValue = lifetimeValue;
        }

        public int getTotalOrders() {
            return totalOrders;
        }

        public void setTotalOrders(int totalOrders) {
            this.totalOrders = totalOrders;
        }

        public LocalDateTime getLastOrderDate() {
            return lastOrderDate;
        }

        public void setLastOrderDate(LocalDateTime lastOrderDate) {
            this.lastOrderDate = lastOrderDate;
        }

        public List<String> getRiskFactors() {
            return riskFactors;
        }

        public void setRiskFactors(List<String> riskFactors) {
            this.riskFactors = riskFactors;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final ChurnRiskCustomer obj = new ChurnRiskCustomer();

            public Builder customerId(String customerId) {
                obj.customerId = customerId;
                return this;
            }

            public Builder customerName(String customerName) {
                obj.customerName = customerName;
                return this;
            }

            public Builder email(String email) {
                obj.email = email;
                return this;
            }

            public Builder riskLevel(String riskLevel) {
                obj.riskLevel = riskLevel;
                return this;
            }

            public Builder churnProbability(BigDecimal churnProbability) {
                obj.churnProbability = churnProbability;
                return this;
            }

            public Builder daysSinceLastOrder(int daysSinceLastOrder) {
                obj.daysSinceLastOrder = daysSinceLastOrder;
                return this;
            }

            public Builder lifetimeValue(BigDecimal lifetimeValue) {
                obj.lifetimeValue = lifetimeValue;
                return this;
            }

            public Builder totalOrders(int totalOrders) {
                obj.totalOrders = totalOrders;
                return this;
            }

            public Builder lastOrderDate(LocalDateTime lastOrderDate) {
                obj.lastOrderDate = lastOrderDate;
                return this;
            }

            public Builder riskFactors(List<String> riskFactors) {
                obj.riskFactors = riskFactors;
                return this;
            }

            public ChurnRiskCustomer build() {
                return obj;
            }
        }
    }

    public static class ChurnFactor {
        private String factorName;
        private String description;
        private BigDecimal impactScore; // 0-100
        private int customersAffected;

        public ChurnFactor() {}

        public String getFactorName() {
            return factorName;
        }

        public void setFactorName(String factorName) {
            this.factorName = factorName;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public BigDecimal getImpactScore() {
            return impactScore;
        }

        public void setImpactScore(BigDecimal impactScore) {
            this.impactScore = impactScore;
        }

        public int getCustomersAffected() {
            return customersAffected;
        }

        public void setCustomersAffected(int customersAffected) {
            this.customersAffected = customersAffected;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final ChurnFactor obj = new ChurnFactor();

            public Builder factorName(String factorName) {
                obj.factorName = factorName;
                return this;
            }

            public Builder description(String description) {
                obj.description = description;
                return this;
            }

            public Builder impactScore(BigDecimal impactScore) {
                obj.impactScore = impactScore;
                return this;
            }

            public Builder customersAffected(int customersAffected) {
                obj.customersAffected = customersAffected;
                return this;
            }

            public ChurnFactor build() {
                return obj;
            }
        }
    }
}
