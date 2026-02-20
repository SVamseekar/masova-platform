package com.MaSoVa.commerce.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
public class StoreServiceClient {

    private static final Logger log = LoggerFactory.getLogger(StoreServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.core.url:http://localhost:8085}")
    private String coreServiceUrl;

    public StoreServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Returns true if the coordinates are within the store's delivery radius.
     * Fail-open: returns true on any error so order placement is not blocked by network issues.
     */
    @SuppressWarnings("unchecked")
    public boolean isWithinDeliveryRadius(String storeId, double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(coreServiceUrl + "/api/stores/{storeId}/delivery-radius-check")
                .queryParam("latitude", latitude)
                .queryParam("longitude", longitude)
                .buildAndExpand(storeId)
                .toUriString();

            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            if (result == null) return true;
            Boolean within = (Boolean) result.get("withinRadius");
            return within == null || within;
        } catch (Exception e) {
            log.warn("Delivery radius check failed for store {} — failing open: {}", storeId, e.getMessage());
            return true;
        }
    }
}
