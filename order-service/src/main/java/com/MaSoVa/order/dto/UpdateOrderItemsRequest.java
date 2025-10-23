package com.MaSoVa.order.dto;

import com.MaSoVa.order.entity.OrderItem;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderItemsRequest {

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItem> items;

    private String modificationReason;
}
