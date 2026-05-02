package com.MaSoVa.commerce.order.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

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
        restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(body), Void.class);
    }
}
