package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.service.AggregatorService;
import com.MaSoVa.shared.dto.ApiResponse;
import com.MaSoVa.shared.enums.OrderSource;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/aggregators")
@Validated
public class AggregatorController {

    private final AggregatorService aggregatorService;

    public AggregatorController(AggregatorService aggregatorService) {
        this.aggregatorService = aggregatorService;
    }

    /** GET /api/aggregators/connections?storeId=xxx — list all configured platforms for a store */
    @GetMapping("/connections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AggregatorConnection>>> getConnections(
            @RequestParam String storeId) {
        List<AggregatorConnection> connections = aggregatorService.getConnectionsForStore(storeId);
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    /** PUT /api/aggregators/connections — upsert commission % for a platform at a store */
    @PutMapping("/connections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AggregatorConnection>> upsertConnection(
            @RequestParam String storeId,
            @RequestParam @NotNull OrderSource platform,
            @RequestParam @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal commissionPercent) {
        AggregatorConnection saved = aggregatorService.upsertConnection(storeId, platform, commissionPercent);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
