package com.MaSoVa.commerce.order.client;

import com.MaSoVa.shared.entity.Store;
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
     * Fetches Store from core-service. Returns an empty Store (null countryCode) on error so
     * order placement is not blocked — India GST fallback will apply.
     */
    public Store getStore(String storeId) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(coreServiceUrl)
                .pathSegment("api", "stores", storeId)
                .build()
                .toUriString();
            Store store = restTemplate.getForObject(url, Store.class);
            return store != null ? store : new Store();
        } catch (Exception e) {
            log.warn("getStore failed for store {} — falling back to India GST: {}", storeId, e.getMessage());
            return new Store();
        }
    }

    /**
     * Returns true if the coordinates are within the store's delivery radius.
     * Fail-open: returns true on any error so order placement is not blocked by network issues.
     */
    @SuppressWarnings("unchecked")
    public boolean isWithinDeliveryRadius(String storeId, double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(coreServiceUrl)
                .pathSegment("api", "stores", storeId, "delivery-radius-check")
                .queryParam("latitude", latitude)
                .queryParam("longitude", longitude)
                .build()
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
