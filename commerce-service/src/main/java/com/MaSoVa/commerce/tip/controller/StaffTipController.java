package com.MaSoVa.commerce.tip.controller;

import com.MaSoVa.commerce.tip.dto.TipResponse;
import com.MaSoVa.commerce.tip.service.TipService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** GET /api/staff/tips/pending — undistributed direct tips for a staff member */
@RestController
@RequestMapping("/api/staff/tips")
@SecurityRequirement(name = "bearerAuth")
public class StaffTipController {

    private final TipService tipService;

    public StaffTipController(TipService tipService) {
        this.tipService = tipService;
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('STAFF') or hasRole('DRIVER') or hasRole('CASHIER') or hasRole('KITCHEN_STAFF') or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<TipResponse>> getPendingTips(@RequestParam String employeeId) {
        return ResponseEntity.ok(tipService.getUndistributedTipsForStaff(employeeId));
    }
}
