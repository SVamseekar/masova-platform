package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.customer.controller.CustomerController;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CustomerController Unit Tests")
class CustomerControllerTest extends BaseServiceTest {

    @Mock private CustomerService customerService;
    @Mock private com.MaSoVa.core.user.service.UserService userService;
    @InjectMocks private CustomerController customerController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "manager-user", null, List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))));
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .setControllerAdvice(new com.MaSoVa.core.user.exception.UserServiceExceptionHandler())
            .defaultRequest(get("/").header("X-Selected-Store-Id", "store-1"))
            .build();
        when(customerService.getCustomerById("cust-1")).thenReturn(Optional.of(buildCustomer("cust-1")));
    }

    @AfterEach
    void clearAuthentication() { SecurityContextHolder.clearContext(); }

    private Customer buildCustomer(String id) {
        Customer c = new Customer();
        c.setId(id);
        c.setStoreIds(new java.util.HashSet<>(java.util.Set.of("store-1")));
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
                .content("{\"label\":\"Home\",\"addressLine1\":\"123 Main St\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"postalCode\":\"560001\"}"))
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

    @Test
    @DisplayName("POST /api/customers/{id}/tags with remove map removes tags")
    void manageTags_remove_returns200() throws Exception {
        Customer c = buildCustomer("cust-1");
        when(customerService.getCustomerById("cust-1")).thenReturn(Optional.of(c));
        when(customerService.removeTags(anyString(), any())).thenReturn(c);

        mockMvc.perform(post("/api/customers/cust-1/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"remove\":[\"VIP\"]}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/tags returns 404 when customer not found")
    void manageTags_notFound_returns404() throws Exception {
        when(customerService.getCustomerById("bad-id")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/customers/bad-id/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"add\":[\"VIP\"]}"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/customers/stats returns 200 with stats")
    void getStats_returns200() throws Exception {
        when(customerService.getCustomerStatsByStore(any()))
                .thenReturn(new com.MaSoVa.core.customer.dto.response.CustomerStatsResponse());

        mockMvc.perform(get("/api/customers/stats"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/customers/{id}/addresses/{addressId} updates address and returns 200")
    void updateAddress_returns200() throws Exception {
        when(customerService.updateAddress(anyString(), anyString(), any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(patch("/api/customers/cust-1/addresses/addr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"Work\",\"addressLine1\":\"456 MG Road\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"postalCode\":\"560001\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/customers/{id} anonymizes customer and returns 200")
    void gdprDelete_returns200() throws Exception {
        Customer anon = buildCustomer("cust-1");
        anon.setDeletedAt(java.time.LocalDateTime.now());
        when(customerService.anonymizeAndDeleteCustomer(anyString(), anyString())).thenReturn(anon);

        mockMvc.perform(delete("/api/customers/cust-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Customer data anonymized successfully per GDPR requirements"));
    }

    @Test
    @DisplayName("POST /api/customers/{id}/loyalty with REDEEMED type redeems points")
    void manageLoyalty_redeem_returns200() throws Exception {
        when(customerService.redeemLoyaltyPoints(anyString(), anyInt(), anyString())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/cust-1/loyalty")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"REDEEMED\",\"points\":50,\"orderId\":\"ord-1\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/customers/{id}/activate returns 404 when customer not found")
    void activate_notFound_returns404() throws Exception {
        when(customerService.activateCustomer("bad-id")).thenThrow(new java.util.NoSuchElementException("Not found"));

        mockMvc.perform(post("/api/customers/bad-id/activate"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/customers with email param returns matching customer")
    void getCustomers_byEmail_returns200() throws Exception {
        when(customerService.getCustomerByEmail("test@example.com")).thenReturn(Optional.of(buildCustomer("c1")));

        mockMvc.perform(get("/api/customers").param("email", "test@example.com"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers with phone param returns matching customer")
    void getCustomers_byPhone_returns200() throws Exception {
        when(customerService.getCustomerByPhone("9876543210")).thenReturn(Optional.of(buildCustomer("c1")));

        mockMvc.perform(get("/api/customers").param("phone", "9876543210"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers with userId param returns matching customer")
    void getCustomers_byUserId_returns200() throws Exception {
        when(customerService.getCustomerByUserId("user-1")).thenReturn(Optional.of(buildCustomer("c1")));

        mockMvc.perform(get("/api/customers").param("userId", "user-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers with tier param returns filtered list")
    void getCustomers_byTier_returns200() throws Exception {
        when(customerService.getCustomersByLoyaltyTierAndStore(any(), anyString())).thenReturn(List.of(buildCustomer("c1")));

        mockMvc.perform(get("/api/customers").param("tier", "GOLD"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers with tag param returns filtered list")
    void getCustomers_byTag_returns200() throws Exception {
        when(customerService.getCustomersByTagsAndStore(any(), any())).thenReturn(List.of(buildCustomer("c1")));

        mockMvc.perform(get("/api/customers").param("tag", "VIP"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/customers with search param returns search results")
    void getCustomers_bySearch_returns200() throws Exception {
        org.springframework.data.domain.Page<Customer> page = new org.springframework.data.domain.PageImpl<>(List.of(buildCustomer("c1")));
        when(customerService.searchCustomersByStoreId(any(), anyString(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/customers").param("search", "John"))
            .andExpect(status().isOk());
    }

    // ── Store scoping: managers only reach customers of their own store ──────────

    private Customer otherStoreCustomer() {
        Customer c = new Customer();
        c.setId("cust-other");
        c.setStoreIds(new java.util.HashSet<>(java.util.Set.of("store-2")));
        when(customerService.getCustomerById("cust-other")).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    @DisplayName("MANAGER cannot read a customer of another store")
    void managerCannotReadOtherStoreCustomer() throws Exception {
        otherStoreCustomer();
        mockMvc.perform(get("/api/customers/cust-other"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("MANAGER cannot patch, edit addresses of, tag, deactivate or anonymise another store's customer")
    void managerCannotChangeOtherStoreCustomer() throws Exception {
        otherStoreCustomer();
        mockMvc.perform(patch("/api/customers/cust-other")
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Updated Name\"}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/customers/cust-other/addresses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"Home\",\"addressLine1\":\"Street 1\",\"city\":\"Berlin\",\"state\":\"Berlin\",\"postalCode\":\"10115\",\"country\":\"Germany\"}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/customers/cust-other/addresses/addr-1"))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/customers/cust-other/tags")
                .contentType(MediaType.APPLICATION_JSON).content("{\"add\":[\"VIP\"]}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/customers/cust-other/deactivate"))
            .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/customers/cust-other"))
            .andExpect(status().isForbidden());

        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).updateCustomer(anyString(), any());
        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).addAddress(anyString(), any());
        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).removeAddress(anyString(), anyString());
        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).addTags(anyString(), any());
        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).deactivateCustomer(anyString());
        org.mockito.Mockito.verify(customerService, org.mockito.Mockito.never()).anonymizeAndDeleteCustomer(anyString(), any());
    }

    @Test
    @DisplayName("MANAGER email, phone and userId lookups do not return another store's customer")
    void managerLookupsAreStoreScoped() throws Exception {
        Customer other = otherStoreCustomer();
        when(customerService.getCustomerByEmail("x@example.com")).thenReturn(Optional.of(other));
        when(customerService.getCustomerByPhone("123")).thenReturn(Optional.of(other));
        when(customerService.getCustomerByUserId("user-x")).thenReturn(Optional.of(other));

        mockMvc.perform(get("/api/customers").param("email", "x@example.com"))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/customers").param("phone", "123"))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/customers").param("userId", "user-x"))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    // ── POST /api/customers/me: checkout profile for signed-in customers ─────────

    private void signInAsCustomer(String userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
    }

    @Test
    @DisplayName("POST /api/customers/me get-or-creates the caller's profile from their own account details")
    void ensureOwnProfileUsesServerSideIdentity() throws Exception {
        signInAsCustomer("user-1");
        com.MaSoVa.shared.entity.User user = new com.MaSoVa.shared.entity.User();
        user.setId("user-1");
        com.MaSoVa.shared.entity.User.PersonalInfo info = new com.MaSoVa.shared.entity.User.PersonalInfo();
        info.setName("Asha");
        info.setEmail("asha@example.com");
        info.setPhone("+919876543210");
        user.setPersonalInfo(info);
        when(userService.getUserByIdUncached("user-1")).thenReturn(user);
        when(customerService.getOrCreateCustomer(any())).thenReturn(buildCustomer("cust-1"));

        mockMvc.perform(post("/api/customers/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"storeId\":\"store-1\",\"userId\":\"victim\",\"email\":\"victim@example.com\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("cust-1"));

        org.mockito.ArgumentCaptor<com.MaSoVa.core.customer.dto.request.CreateCustomerRequest> captor =
                org.mockito.ArgumentCaptor.forClass(com.MaSoVa.core.customer.dto.request.CreateCustomerRequest.class);
        org.mockito.Mockito.verify(customerService).getOrCreateCustomer(captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getUserId()).isEqualTo("user-1");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getEmail()).isEqualTo("asha@example.com");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getName()).isEqualTo("Asha");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getStoreId()).isEqualTo("store-1");
    }

    @Test
    @DisplayName("POST /api/customers/me returns 409 without leaking the other profile when the phone is taken")
    void ensureOwnProfileConflictIsClear() throws Exception {
        signInAsCustomer("user-1");
        com.MaSoVa.shared.entity.User user = new com.MaSoVa.shared.entity.User();
        com.MaSoVa.shared.entity.User.PersonalInfo info = new com.MaSoVa.shared.entity.User.PersonalInfo();
        info.setName("Asha");
        info.setEmail("asha@example.com");
        info.setPhone("+919876543210");
        user.setPersonalInfo(info);
        when(userService.getUserByIdUncached("user-1")).thenReturn(user);
        when(customerService.getOrCreateCustomer(any()))
                .thenThrow(new IllegalArgumentException("Customer with phone +919876543210 already exists"));

        mockMvc.perform(post("/api/customers/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isConflict())
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("9876543210"))));
    }

    @Test
    @DisplayName("POST /api/customers/me returns the profile a concurrent request just created")
    void ensureOwnProfileRaceReturnsExisting() throws Exception {
        signInAsCustomer("user-1");
        com.MaSoVa.shared.entity.User user = new com.MaSoVa.shared.entity.User();
        com.MaSoVa.shared.entity.User.PersonalInfo info = new com.MaSoVa.shared.entity.User.PersonalInfo();
        info.setName("Asha");
        info.setEmail("asha@example.com");
        user.setPersonalInfo(info);
        when(userService.getUserByIdUncached("user-1")).thenReturn(user);
        when(customerService.getOrCreateCustomer(any()))
                .thenThrow(new IllegalArgumentException("Customer with userId user-1 already exists"));
        when(customerService.getCustomerByUserId("user-1")).thenReturn(Optional.of(buildCustomer("cust-1")));

        mockMvc.perform(post("/api/customers/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("cust-1"));
    }
}
