package com.MaSoVa.commerce.menu.controller;

import com.MaSoVa.commerce.menu.entity.StoreOffer;
import com.MaSoVa.commerce.menu.repository.StoreOfferRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Store offers — public, read-only list at /api/menu/offers.
 */
@RestController
@RequestMapping("/api/menu/offers")
@Tag(name = "Menu", description = "Public menu browsing and admin CRUD")
public class StoreOfferController {

    private final StoreOfferRepository storeOfferRepository;

    public StoreOfferController(StoreOfferRepository storeOfferRepository) {
        this.storeOfferRepository = storeOfferRepository;
    }

    /** GET /api/menu/offers?storeId= — public (no auth). */
    @GetMapping
    @Operation(summary = "List current offers for a store (query: storeId)")
    public ResponseEntity<List<StoreOffer>> getOffers(@RequestParam String storeId) {
        if (storeId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(storeOfferRepository.findCurrentByStoreId(storeId.trim(), LocalDate.now()));
    }
}
