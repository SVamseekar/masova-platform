package com.MaSoVa.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    private String menuItemId;
    private String name;
    private Integer quantity;
    private Double price;
    private String variant;
    private List<String> customizations;

    public Double getItemTotal() {
        return price * quantity;
    }
}
