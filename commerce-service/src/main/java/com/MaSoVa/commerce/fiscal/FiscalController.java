package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.fiscal.dto.FiscalSummaryDto;
import com.MaSoVa.commerce.fiscal.dto.SigningFailureDto;
import com.MaSoVa.shared.util.StoreContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
@Tag(name = "Fiscal Compliance", description = "Fiscal signing summary and failure reporting")
@SecurityRequirement(name = "bearerAuth")
public class FiscalController {

    private static final Logger log = LoggerFactory.getLogger(FiscalController.class);

    private final FiscalComplianceService fiscalComplianceService;

    public FiscalController(FiscalComplianceService fiscalComplianceService) {
        this.fiscalComplianceService = fiscalComplianceService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Fiscal signing summary per country/signer for a store")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> getSummary(
            @RequestParam("storeId") String storeId,
            HttpServletRequest request) {
        try {
            String headerStoreId = StoreContextUtil.getStoreIdFromHeaders(request);
            if (headerStoreId != null && !headerStoreId.isEmpty() && !headerStoreId.equals(storeId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Cannot access fiscal data for a different store"));
            }
            List<FiscalSummaryDto> summary = fiscalComplianceService.getSummary(storeId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.warn("Error loading fiscal summary for store {}: {}", storeId, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load fiscal summary"));
        }
    }

    @GetMapping("/failures")
    @Operation(summary = "Fiscal signing failures in the last 7 days for a store")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> getFailures(
            @RequestParam("storeId") String storeId,
            HttpServletRequest request) {
        try {
            String headerStoreId = StoreContextUtil.getStoreIdFromHeaders(request);
            if (headerStoreId != null && !headerStoreId.isEmpty() && !headerStoreId.equals(storeId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Cannot access fiscal data for a different store"));
            }
            List<SigningFailureDto> failures = fiscalComplianceService.getFailures(storeId);
            return ResponseEntity.ok(failures);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.warn("Error loading fiscal failures for store {}: {}", storeId, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load fiscal failures"));
        }
    }
}