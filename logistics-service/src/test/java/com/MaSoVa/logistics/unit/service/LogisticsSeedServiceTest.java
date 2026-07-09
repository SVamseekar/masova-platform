package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.repository.InventoryItemRepository;
import com.MaSoVa.logistics.inventory.repository.PurchaseOrderRepository;
import com.MaSoVa.logistics.inventory.repository.SupplierRepository;
import com.MaSoVa.logistics.inventory.repository.WasteRecordRepository;
import com.MaSoVa.logistics.inventory.service.LogisticsSeedService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("LogisticsSeedService (Phase E)")
class LogisticsSeedServiceTest {

    @Mock SupplierRepository supplierRepository;
    @Mock InventoryItemRepository inventoryItemRepository;
    @Mock PurchaseOrderRepository purchaseOrderRepository;
    @Mock WasteRecordRepository wasteRecordRepository;
    @Mock DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock CacheManager cacheManager;
    @Mock Environment environment;

    LogisticsSeedService service;

    @BeforeEach
    void setUp() {
        service = new LogisticsSeedService(
                supplierRepository, inventoryItemRepository, purchaseOrderRepository,
                wasteRecordRepository, deliveryTrackingRepository, cacheManager, environment);
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(true);
        when(supplierRepository.findBySupplierCode(anyString())).thenReturn(Optional.empty());
        AtomicInteger seq = new AtomicInteger();
        when(supplierRepository.save(any())).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0);
            s.setId("sup-" + seq.incrementAndGet());
            return s;
        });
        when(inventoryItemRepository.findByStoreIdAndItemCode(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(inventoryItemRepository.save(any())).thenAnswer(inv -> {
            InventoryItem i = inv.getArgument(0);
            i.setId("inv-" + seq.incrementAndGet());
            return i;
        });
        when(inventoryItemRepository.findByStoreId(anyString())).thenReturn(Collections.emptyList());
        when(purchaseOrderRepository.findByOrderNumber(anyString())).thenReturn(Optional.empty());
        when(purchaseOrderRepository.save(any())).thenAnswer(inv -> {
            PurchaseOrder p = inv.getArgument(0);
            p.setId("po-1");
            return p;
        });
        when(wasteRecordRepository.findByStoreId(anyString())).thenReturn(Collections.emptyList());
        when(wasteRecordRepository.save(any())).thenAnswer(inv -> {
            WasteRecord w = inv.getArgument(0);
            w.setId("waste-1");
            return w;
        });
        when(deliveryTrackingRepository.findByOrderId(anyString())).thenReturn(Optional.empty());
        when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> {
            DeliveryTracking t = inv.getArgument(0);
            t.setId("trk-" + seq.incrementAndGet());
            return t;
        });
    }

    @Test
    @DisplayName("blocked outside dev/demo")
    void blockedOutsideDev() {
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(false);
        assertThatThrownBy(() -> service.seedDemo("DOM001", "driver-1"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("seeds suppliers with ACTIVE status and inventory for store")
    void seedsSuppliersAndInventory() {
        Map<String, Object> result = service.seedDemo("DOM001", "driver-user-1");

        assertThat(result.get("storeId")).isEqualTo("DOM001");
        @SuppressWarnings("unchecked")
        Map<String, Object> suppliers = (Map<String, Object>) result.get("suppliers");
        assertThat((Integer) suppliers.get("total")).isEqualTo(5);

        ArgumentCaptor<Supplier> supCap = ArgumentCaptor.forClass(Supplier.class);
        verify(supplierRepository, atLeastOnce()).save(supCap.capture());
        assertThat(supCap.getAllValues()).allMatch(s -> "ACTIVE".equals(s.getStatus()));
        assertThat(supCap.getAllValues()).extracting(Supplier::getSupplierName)
                .isNotEmpty();
        assertThat(supCap.getAllValues().get(0).getPhoneNumber()).isNotBlank();

        ArgumentCaptor<InventoryItem> invCap = ArgumentCaptor.forClass(InventoryItem.class);
        verify(inventoryItemRepository, atLeastOnce()).save(invCap.capture());
        assertThat(invCap.getAllValues()).allMatch(i -> "DOM001".equals(i.getStoreId()));

        ArgumentCaptor<DeliveryTracking> trkCap = ArgumentCaptor.forClass(DeliveryTracking.class);
        verify(deliveryTrackingRepository, atLeastOnce()).save(trkCap.capture());
        assertThat(trkCap.getAllValues()).allMatch(t -> "driver-user-1".equals(t.getDriverId()));
    }

    @Test
    @DisplayName("idempotent supplier upsert by code")
    void idempotentSupplier() {
        Supplier existing = new Supplier();
        existing.setId("sup-existing");
        existing.setSupplierCode("SEED-SUP-MOZZ");
        existing.setSupplierName("Old Name");
        when(supplierRepository.findBySupplierCode("SEED-SUP-MOZZ")).thenReturn(Optional.of(existing));
        when(supplierRepository.findBySupplierCode(anyString())).thenAnswer(inv -> {
            if ("SEED-SUP-MOZZ".equals(inv.getArgument(0))) return Optional.of(existing);
            return Optional.empty();
        });

        service.seedDemo("DOM001", "drv");
        verify(supplierRepository, atLeastOnce()).save(existing);
        assertThat(existing.getSupplierName()).isEqualTo("Berlin Molkerei GmbH");
        assertThat(existing.getStatus()).isEqualTo("ACTIVE");
    }
}
