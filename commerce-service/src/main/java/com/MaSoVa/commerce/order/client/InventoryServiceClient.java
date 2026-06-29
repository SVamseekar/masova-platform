package com.MaSoVa.commerce.order.client;

import com.MaSoVa.shared.http.HttpMethods;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;

import java.util.Map;

@Service
public class InventoryServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.logistics.url:http://localhost:8086}")
    private String logisticsServiceUrl;

    public InventoryServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void adjustStock(String menuItemId, Map<String, Object> body) {
        String url = logisticsServiceUrl + "/api/inventory/items/" + menuItemId + "/adjust";
        restTemplate.exchange(url, HttpMethods.PATCH, new HttpEntity<>(body), Void.class);
    }
}
