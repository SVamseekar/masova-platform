package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.customer.controller.CustomerController;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerController Unit Tests")
class CustomerControllerTest extends BaseServiceTest {

    @Mock private CustomerService customerService;
    @InjectMocks private CustomerController customerController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Customer buildCustomer(String id) {
        Customer c = new Customer();
        c.setId(id);
        return c;
    }

    @Test
    @DisplayName("GET /api/customers returns 200 with list")
    void getCustomers_returns200() throws Exception {
        when(customerService.getAllCustomersByStoreId(any())).thenReturn(List.of(buildCustomer("cust-1")));

        mockMvc.perform(get("/api/customers"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers/{id} returns 200 when customer exists")
    void getCustomer_returns200() throws Exception {
        when(customerService.getCustomerById("cust-1")).thenReturn(Optional.of(buildCustomer("cust-1")));

        mockMvc.perform(get("/api/customers/cust-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers/{id} returns 404 when not found")
    void getCustomer_returns404() throws Exception {
        when(customerService.getCustomerById("bad-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/customers/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/customers creates customer and returns 201")
    void createCustomer_returns201() throws Exception {
        when(customerService.createCustomer(any())).thenReturn(buildCustomer("cust-new"));

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-new\",\"email\":\"new@test.com\",\"name\":\"Test Customer\",\"phone\":\"9876543210\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/activate returns 200")
    void activate_returns200() throws Exception {
        when(customerService.activateCustomer("cust-1")).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/cust-1/activate"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/deactivate returns 200")
    void deactivate_returns200() throws Exception {
        when(customerService.deactivateCustomer("cust-1")).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/cust-1/deactivate"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/customers/{id} updates customer and returns 200")
    void updateCustomer_returns200() throws Exception {
        when(customerService.updateCustomer(anyString(), any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(patch("/api/customers/cust-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Updated Name\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/addresses adds address and returns 200")
    void addAddress_returns200() throws Exception {
        when(customerService.addAddress(anyString(), any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/cust-1/addresses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"Home\",\"addressLine1\":\"123 Main St\",\"city\":\"Bangalore\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/customers/{id}/addresses/{addressId} removes address and returns 200")
    void removeAddress_returns200() throws Exception {
        when(customerService.removeAddress("cust-1", "addr-1")).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(delete("/api/customers/cust-1/addresses/addr-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/get-or-create returns existing or new customer")
    void getOrCreate_returns200() throws Exception {
        when(customerService.getOrCreateCustomer(any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/get-or-create")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"email\":\"test@example.com\",\"name\":\"Test\",\"phone\":\"9876543210\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/loyalty with ADD action adds points")
    void manageLoyalty_add_returns200() throws Exception {
        when(customerService.addLoyaltyPoints(anyString(), any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/cust-1/loyalty")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"ADD\",\"points\":100,\"reason\":\"Purchase\",\"orderId\":\"ord-1\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/tags with add map adds tags")
    void manageTags_add_returns200() throws Exception {
        Customer c = buildCustomer("cust-1");
        when(customerService.getCustomerById("cust-1")).thenReturn(Optional.of(c));
        when(customerService.addTags(anyString(), any())).thenReturn(c);

        mockMvc.perform(post("/api/customers/cust-1/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"add\":[\"VIP\"]}"))
            .andExpect(status().isOk());
    }
}
