package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.menu.controller.StoreOfferController;
import com.MaSoVa.commerce.menu.entity.StoreOffer;
import com.MaSoVa.commerce.menu.repository.StoreOfferRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StoreOfferControllerTest {

    @Mock
    private StoreOfferRepository storeOfferRepository;

    @InjectMocks
    private StoreOfferController storeOfferController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(storeOfferController).build();
    }

    @Test
    @DisplayName("GET /api/menu/offers?storeId= returns the store's current offers")
    void getOffers_returnsCurrentOffersForStore() throws Exception {
        StoreOffer offer = new StoreOffer();
        offer.setId("offer-1");
        offer.setStoreId("DOM001");
        offer.setTitle("Pizza & drink combo");
        offer.setBadge("Meal deal");
        when(storeOfferRepository.findCurrentByStoreId(eq("DOM001"), any(LocalDate.class))).thenReturn(List.of(offer));

        mockMvc.perform(get("/api/menu/offers").param("storeId", " DOM001 "))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("offer-1"))
            .andExpect(jsonPath("$[0].title").value("Pizza & drink combo"))
            .andExpect(jsonPath("$[0].badge").value("Meal deal"));
    }

    @Test
    @DisplayName("GET /api/menu/offers rejects a missing or blank storeId")
    void getOffers_rejectsMissingStore() throws Exception {
        mockMvc.perform(get("/api/menu/offers")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/menu/offers").param("storeId", " ")).andExpect(status().isBadRequest());
        verifyNoInteractions(storeOfferRepository);
    }
}
