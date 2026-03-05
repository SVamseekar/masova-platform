package com.MaSoVa.commerce.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "inventory-service-client", url = "${services.logistics.url:http://localhost:8086}")
public interface InventoryServiceClient {

    @PatchMapping("/api/inventory/items/{menuItemId}/adjust")
    void adjustStock(@PathVariable String menuItemId, @RequestBody Map<String, Object> body);
}
