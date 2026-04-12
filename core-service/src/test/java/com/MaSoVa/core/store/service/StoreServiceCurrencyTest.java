package com.MaSoVa.core.store.service;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.core.user.repository.StoreRepository;
import com.MaSoVa.core.user.service.StoreService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceCurrencyTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private CountryProfileService countryProfileService;

    @InjectMocks
    private StoreService storeService;

    @Test
    void saveStore_deCountryCode_setsCurrencyAndLocale() {
        Store input = new Store();
        input.setCountryCode("DE");

        when(countryProfileService.resolveCurrency("DE")).thenReturn("EUR");
        when(countryProfileService.resolveLocale("DE")).thenReturn("de-DE");
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        storeService.saveStore(input);

        ArgumentCaptor<Store> captor = ArgumentCaptor.forClass(Store.class);
        verify(storeRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo("EUR");
        assertThat(captor.getValue().getLocale()).isEqualTo("de-DE");
    }

    @Test
    void saveStore_nullCountryCode_doesNotSetCurrencyOrLocale() {
        Store input = new Store();
        input.setCountryCode(null);

        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        storeService.saveStore(input);

        verify(countryProfileService, never()).resolveCurrency(any());
        verify(countryProfileService, never()).resolveLocale(any());

        ArgumentCaptor<Store> captor = ArgumentCaptor.forClass(Store.class);
        verify(storeRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isNull();
        assertThat(captor.getValue().getLocale()).isNull();
    }

    @Test
    void saveStore_gbCountryCode_setsCurrencyGBP() {
        Store input = new Store();
        input.setCountryCode("GB");

        when(countryProfileService.resolveCurrency("GB")).thenReturn("GBP");
        when(countryProfileService.resolveLocale("GB")).thenReturn("en-GB");
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        storeService.saveStore(input);

        ArgumentCaptor<Store> captor = ArgumentCaptor.forClass(Store.class);
        verify(storeRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo("GBP");
        assertThat(captor.getValue().getLocale()).isEqualTo("en-GB");
    }
}
