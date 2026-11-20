package com.MaSoVa.core.customer.controller;

import com.MaSoVa.core.config.SecurityConfig;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.service.CustomerService;
import com.MaSoVa.core.user.exception.UserServiceExceptionHandler;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerController.class)
@ContextConfiguration(classes = {CustomerController.class, SecurityConfig.class, UserServiceExceptionHandler.class})
class CustomerAddressAccessContractTest {
    @Autowired MockMvc mvc;
    @MockBean CustomerService customers;
    @MockBean JwtTokenProvider tokens;
    private Customer own;
    private Customer other;
    private static final String ADDRESS = "{\"label\":\"Home\",\"addressLine1\":\"Synthetic street\",\"city\":\"Berlin\",\"state\":\"Berlin\",\"postalCode\":\"10115\",\"country\":\"Germany\"}";

    @BeforeEach
    void setup() {
        own = profile("profile-own", "signed-user-own");
        other = profile("profile-other", "signed-user-other");
        when(customers.getCustomerById("profile-own")).thenReturn(Optional.of(own));
        when(customers.getCustomerById("profile-other")).thenReturn(Optional.of(other));
        when(customers.getCustomerByUserId("signed-user-own")).thenReturn(Optional.of(own));
        when(customers.getCustomerByUserId("signed-user-other")).thenReturn(Optional.of(other));
        when(customers.updateCustomer(anyString(), any())).thenReturn(own);
        when(customers.addAddress(anyString(), any())).thenReturn(own);
        when(customers.updateAddress(anyString(), anyString(), any())).thenReturn(own);
        when(customers.setDefaultAddress(anyString(), anyString())).thenReturn(own);
        when(customers.removeAddress(anyString(), anyString())).thenReturn(own);
        when(customers.redeemLoyaltyPoints(anyString(), anyInt(), any())).thenReturn(own);
        when(customers.addLoyaltyPoints(anyString(), any())).thenReturn(own);
        when(customers.anonymizeAndDeleteCustomer(anyString(), any())).thenReturn(own);
    }

    private Customer profile(String id, String userId) {
        Customer result = new Customer(); result.setId(id); result.setUserId(userId);
        result.setName("Synthetic customer"); result.setDeletedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        return result;
    }

    @Test
    void ownProfileUpdateUsesUserReferenceRatherThanProfileId() throws Exception {
        mvc.perform(patch("/api/customers/profile-own").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Updated customer\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value("profile-own"));
    }

    @Test
    void addressResponseUsesCanonicalDefaultField() throws Exception {
        Customer.CustomerAddress address = new Customer.CustomerAddress();
        address.setId("addr-1"); address.setDefault(true); own.getAddresses().add(address);
        mvc.perform(get("/api/customers/profile-own").with(user("signed-user-own").roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.addresses[0].isDefault").value(true));
    }

    @Test
    void signedJwtSubjectOwnsProfileEvenWithSpoofedHeaders() throws Exception {
        when(tokens.validateToken("synthetic-valid-token")).thenReturn(true);
        when(tokens.getUserIdFromToken("synthetic-valid-token")).thenReturn("signed-user-own");
        when(tokens.getRolesFromToken("synthetic-valid-token")).thenReturn(List.of("CUSTOMER"));
        mvc.perform(get("/api/customers/profile-other").header("Authorization", "Bearer synthetic-valid-token")
                .header("X-User-Id", "signed-user-other").header("X-User-Type", "MANAGER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerLookupReturnsOwnRecordOnly() throws Exception {
        mvc.perform(get("/api/customers").param("userId", "signed-user-own")
                .with(user("signed-user-own").roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value("profile-own"));
        mvc.perform(get("/api/customers").param("userId", "signed-user-other")
                .with(user("signed-user-own").roles("CUSTOMER"))).andExpect(status().isForbidden());
        verify(customers, never()).getCustomerByUserId("signed-user-other");
    }

    @ParameterizedTest
    @ValueSource(strings = {"email", "phone", "search", "tag", "tier"})
    void customersCannotSearchOtherProfiles(String filter) throws Exception {
        mvc.perform(get("/api/customers").param(filter, "synthetic")
                .with(user("signed-user-own").roles("CUSTOMER"))).andExpect(status().isForbidden());
        verify(customers, never()).getAllCustomersByStoreId(any());
    }

    @Test
    void unfilteredCustomerLookupDoesNotListEveryone() throws Exception {
        when(customers.getAllCustomersByStoreId(any())).thenReturn(List.of(own, other));
        mvc.perform(get("/api/customers").with(user("signed-user-own").roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("profile-own"));
        verify(customers, never()).getAllCustomersByStoreId(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"default\":true}", "{\"isDefault\":true}"})
    void defaultOnlyPatchPreservesAddressUsingExistingService(String body) throws Exception {
        mvc.perform(patch("/api/customers/profile-own/addresses/addr-2")
                .with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        verify(customers).setDefaultAddress("profile-own", "addr-2");
        verify(customers, never()).updateAddress(anyString(), anyString(), any());
    }

    @Test
    void canonicalDefaultFieldAcceptedForAddressCreation() throws Exception {
        mvc.perform(post("/api/customers/profile-own/addresses").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(ADDRESS.replace("}", ",\"isDefault\":true}")))
                .andExpect(status().isOk());
        verify(customers).addAddress(eq("profile-own"), argThat(request -> request.isDefault()));
    }

    @Test
    void crossCustomerAddressMutationsAndDeletionNeverReachService() throws Exception {
        var identity = user("signed-user-own").roles("CUSTOMER");
        mvc.perform(post("/api/customers/profile-other/addresses").with(identity)
                .contentType(MediaType.APPLICATION_JSON).content(ADDRESS)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/customers/profile-other/addresses/addr-1").with(identity)
                .contentType(MediaType.APPLICATION_JSON).content(ADDRESS)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/customers/profile-other/addresses/addr-1").with(identity)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/customers/profile-other").with(identity)).andExpect(status().isForbidden());
        verify(customers, never()).addAddress(eq("profile-other"), any());
        verify(customers, never()).updateAddress(eq("profile-other"), anyString(), any());
        verify(customers, never()).removeAddress(eq("profile-other"), anyString());
        verify(customers, never()).anonymizeAndDeleteCustomer(eq("profile-other"), anyString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"emailVerified\":true}", "{\"phoneVerified\":true}", "{\"note\":{\"note\":\"arbitrary\"}}", "{\"orderStats\":{}}"})
    void selfProfileUpdateCannotWritePrivilegedFields(String body) throws Exception {
        mvc.perform(patch("/api/customers/profile-own").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        verify(customers, never()).updateCustomer(anyString(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"EARNED", "BONUS", "EXPIRED"})
    void customersCannotGrantTheirOwnLoyaltyPoints(String type) throws Exception {
        mvc.perform(post("/api/customers/profile-own/loyalty").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"" + type + "\",\"points\":20}"))
                .andExpect(status().isForbidden());
        verify(customers, never()).addLoyaltyPoints(anyString(), any());
    }

    @Test
    void ownRedemptionAllowsPositivePointsAndRejectsNegativePoints() throws Exception {
        mvc.perform(post("/api/customers/profile-own/loyalty").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"REDEEMED\",\"points\":20}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/customers/profile-own/loyalty").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"REDEEMED\",\"points\":-20}"))
                .andExpect(status().isBadRequest());
        verify(customers, never()).redeemLoyaltyPoints(anyString(), eq(-20), any());
    }

    @Test
    void customerTagsAndMissingAuthenticationAreDenied() throws Exception {
        mvc.perform(post("/api/customers/profile-own/tags").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"add\":[\"VIP\"]}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/customers/profile-own/addresses").header("X-User-Id", "signed-user-own")
                .header("X-User-Type", "MANAGER").contentType(MediaType.APPLICATION_JSON).content(ADDRESS))
                .andExpect(status().isForbidden());
        verify(customers, never()).addTags(anyString(), any());
        verify(customers, never()).addAddress(anyString(), any());
    }

    @Test
    void managerAddressAccessRemainsSupported() throws Exception {
        mvc.perform(post("/api/customers/profile-other/addresses").with(user("manager-user").roles("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(ADDRESS)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"city\":\"Berlin\"}", "{\"isDefault\":false}"})
    void incompleteAddressPatchRemainsInvalid(String body) throws Exception {
        mvc.perform(patch("/api/customers/profile-own/addresses/addr-1").with(user("signed-user-own").roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        verify(customers, never()).updateAddress(anyString(), anyString(), any());
    }
}
