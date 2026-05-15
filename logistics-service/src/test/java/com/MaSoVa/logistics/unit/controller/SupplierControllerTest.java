package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.SupplierController;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.service.SupplierService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupplierController Unit Tests")
class SupplierControllerTest extends BaseServiceTest {

    @Mock private SupplierService supplierService;
    @InjectMocks private SupplierController supplierController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(supplierController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Supplier buildSupplier(String id) {
        Supplier s = new Supplier();
        s.setId(id);
        s.setSupplierName("Fresh Farms");
        return s;
    }

    @Test
    @DisplayName("GET /api/suppliers returns 200 with list")
    void getSuppliers_returns200() throws Exception {
        when(supplierService.getAllSuppliers()).thenReturn(List.of(buildSupplier("sup-1")));

        mockMvc.perform(get("/api/suppliers"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/suppliers returns 201")
    void createSupplier_returns201() throws Exception {
        when(supplierService.createSupplier(any())).thenReturn(buildSupplier("sup-new"));

        mockMvc.perform(post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Fresh Farms\",\"category\":\"PRODUCE\",\"contactEmail\":\"farm@example.com\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/suppliers/{id} returns 200")
    void getSupplierById_returns200() throws Exception {
        when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));

        mockMvc.perform(get("/api/suppliers/sup-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/suppliers/{id} returns 200 with supplier")
    void getSupplierById_returns200Again() throws Exception {
        when(supplierService.getSupplierById("sup-2")).thenReturn(buildSupplier("sup-2"));

        mockMvc.perform(get("/api/suppliers/sup-2"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/suppliers/compare returns 200")
    void compareSuppliers_returns200() throws Exception {
        when(supplierService.compareSuppliersByCategory("PRODUCE")).thenReturn(List.of(buildSupplier("sup-1")));

        mockMvc.perform(get("/api/suppliers/compare").param("category", "PRODUCE"))
            .andExpect(status().isOk());
    }
}
