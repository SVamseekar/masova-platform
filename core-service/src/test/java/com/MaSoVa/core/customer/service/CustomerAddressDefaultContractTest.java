package com.MaSoVa.core.customer.service;

import com.MaSoVa.core.customer.dto.request.AddAddressRequest;
import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.entity.Customer.CustomerAddress;
import com.MaSoVa.core.customer.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerAddressDefaultContractTest {
    CustomerRepository repository;
    CustomerService service;
    Customer customer;

    @BeforeEach
    void setup() {
        repository = mock(CustomerRepository.class);
        service = new CustomerService(repository, mock(CustomerAuditService.class));
        customer = new Customer(); customer.setId("profile-own"); customer.setUserId("signed-user-own");
        customer.getAddresses().add(address("addr-1", true));
        customer.getAddresses().add(address("addr-2", false));
        customer.setDefaultAddressId("addr-1");
        when(repository.findById("profile-own")).thenReturn(Optional.of(customer));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private CustomerAddress address(String id, boolean defaultAddress) {
        CustomerAddress result = new CustomerAddress(); result.setId(id); result.setDefault(defaultAddress);
        result.setAddressLine1("Existing synthetic street"); return result;
    }

    @Test
    void fullAddressEditCanChangeDefaultWithoutDuplicatingFlags() {
        AddAddressRequest request = new AddAddressRequest(); request.setAddressLine1("Updated synthetic street"); request.setDefault(true);
        Customer result = service.updateAddress("profile-own", "addr-2", request);
        assertThat(result.getDefaultAddressId()).isEqualTo("addr-2");
        assertThat(result.getAddresses()).filteredOn(CustomerAddress::isDefault).extracting(CustomerAddress::getId).containsExactly("addr-2");
        assertThat(result.getAddresses().get(1).getAddressLine1()).isEqualTo("Updated synthetic street");
    }

    @Test
    void explicitlyUnsettingDefaultOnFullEditSelectsAnotherSavedAddress() {
        AddAddressRequest request = new AddAddressRequest(); request.setDefault(false);
        Customer result = service.updateAddress("profile-own", "addr-1", request);
        assertThat(result.getDefaultAddressId()).isEqualTo("addr-2");
        assertThat(result.getAddresses()).filteredOn(CustomerAddress::isDefault).extracting(CustomerAddress::getId).containsExactly("addr-2");
    }

    @Test
    void removingMissingAddressDoesNotSaveOrChangeDefaults() {
        assertThatThrownBy(() -> service.removeAddress("profile-own", "missing"))
                .isInstanceOf(NoSuchElementException.class);
        assertThat(customer.getDefaultAddressId()).isEqualTo("addr-1");
        verify(repository, never()).save(any());
    }

    @Test
    void selectingMissingDefaultDoesNotClearExistingDefault() {
        assertThatThrownBy(() -> service.setDefaultAddress("profile-own", "missing"))
                .isInstanceOf(NoSuchElementException.class);
        assertThat(customer.getDefaultAddressId()).isEqualTo("addr-1");
        assertThat(customer.getAddresses()).filteredOn(CustomerAddress::isDefault).extracting(CustomerAddress::getId).containsExactly("addr-1");
        verify(repository, never()).save(any());
    }

    @Test
    void defaultOnlySelectionPreservesSavedStreetAndHasExactlyOneDefault() {
        Customer result = service.setDefaultAddress("profile-own", "addr-2");
        assertThat(result.getAddresses().get(1).getAddressLine1()).isEqualTo("Existing synthetic street");
        assertThat(result.getDefaultAddressId()).isEqualTo("addr-2");
        assertThat(result.getAddresses()).filteredOn(CustomerAddress::isDefault).extracting(CustomerAddress::getId).containsExactly("addr-2");
    }
}
