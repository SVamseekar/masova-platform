package com.MaSoVa.commerce.tip.controller;

import com.MaSoVa.commerce.tip.dto.TipRequest;
import com.MaSoVa.commerce.tip.dto.TipResponse;
import com.MaSoVa.commerce.tip.service.TipService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** POST /api/orders/{orderId}/tip — tip on a specific order */
@RestController
@RequestMapping("/api/orders")
@SecurityRequirement(name = "bearerAuth")
public class TipController {

    private final TipService tipService;

    public TipController(TipService tipService) {
        this.tipService = tipService;
    }

    @PostMapping("/{orderId}/tip")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('CASHIER') or hasRole('KIOSK') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<TipResponse> addTip(
            @PathVariable String orderId,
            @Valid @RequestBody TipRequest request) {
        return ResponseEntity.ok(tipService.addTipToOrder(orderId, request));
    }
}
