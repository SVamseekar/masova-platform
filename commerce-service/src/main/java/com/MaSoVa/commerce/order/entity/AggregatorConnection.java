package com.MaSoVa.commerce.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import com.MaSoVa.shared.enums.OrderSource;

@Document(collection = "aggregator_connections")
@CompoundIndex(def = "{'storeId': 1, 'platform': 1}", unique = true)
public class AggregatorConnection {

    @Id
    private String id;
    private String storeId;
    private OrderSource platform;       // WOLT | DELIVEROO | JUST_EAT | UBER_EATS
    private java.math.BigDecimal commissionPercent;
    private boolean active = true;

    public AggregatorConnection() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    public OrderSource getPlatform() { return platform; }
    public void setPlatform(OrderSource platform) { this.platform = platform; }
    public java.math.BigDecimal getCommissionPercent() { return commissionPercent; }
    public void setCommissionPercent(java.math.BigDecimal commissionPercent) { this.commissionPercent = commissionPercent; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
