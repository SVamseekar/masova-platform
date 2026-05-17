package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.repository.SupplierRepository;
import com.MaSoVa.logistics.inventory.service.SupplierService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupplierService Unit Tests")
class SupplierServiceTest {

    @Mock private SupplierRepository supplierRepository;
    @InjectMocks private SupplierService supplierService;

    private Supplier buildSupplier(String id, String code) {
        Supplier s = new Supplier();
        s.setId(id);
        s.setSupplierName("Fresh Farms");
        s.setSupplierCode(code);
        s.setStatus("ACTIVE");
        s.setTotalOrders(5);
        s.setCompletedOrders(4);
        s.setCancelledOrders(1);
        s.setOnTimeDeliveryRate(90.0);
        s.setQualityRating(4.5);
        s.setTotalPurchaseValue(BigDecimal.ZERO);
        return s;
    }

    @Nested
    @DisplayName("createSupplier")
    class CreateSupplier {

        @Test
        @DisplayName("creates supplier with generated code when code not provided")
        void createsWithGeneratedCode() {
            Supplier supplier = buildSupplier(null, null);
            supplier.setSupplierCode(null);
            when(supplierRepository.save(any())).thenAnswer(inv -> {
                Supplier s = inv.getArgument(0);
                s.setId("sup-new");
                return s;
            });

            Supplier result = supplierService.createSupplier(supplier);

            assertThat(result.getId()).isEqualTo("sup-new");
            assertThat(supplier.getSupplierCode()).isNotNull(); // generated
        }

        @Test
        @DisplayName("creates supplier when code provided and not duplicate")
        void createsWithProvidedCode() {
            Supplier supplier = buildSupplier(null, "FRE-001");
            when(supplierRepository.findBySupplierCode("FRE-001")).thenReturn(Optional.empty());
            when(supplierRepository.save(any())).thenAnswer(inv -> {
                Supplier s = inv.getArgument(0);
                s.setId("sup-new");
                return s;
            });

            Supplier result = supplierService.createSupplier(supplier);

            assertThat(result.getId()).isEqualTo("sup-new");
        }

        @Test
        @DisplayName("throws when supplier code already exists")
        void throwsOnDuplicateCode() {
            Supplier supplier = buildSupplier(null, "FRE-001");
            when(supplierRepository.findBySupplierCode("FRE-001"))
                .thenReturn(Optional.of(buildSupplier("sup-existing", "FRE-001")));

            assertThatThrownBy(() -> supplierService.createSupplier(supplier))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");
        }
    }

    @Nested
    @DisplayName("getSupplierById")
    class GetSupplierById {

        @Test
        @DisplayName("returns supplier when found")
        void returnsWhenFound() {
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(buildSupplier("sup-1", "FRE-001")));

            Supplier result = supplierService.getSupplierById("sup-1");

            assertThat(result.getId()).isEqualTo("sup-1");
        }

        @Test
        @DisplayName("throws when supplier not found")
        void throwsWhenNotFound() {
            when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> supplierService.getSupplierById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getSupplierByCode")
    class GetSupplierByCode {

        @Test
        @DisplayName("returns supplier when found by code")
        void returnsWhenFound() {
            when(supplierRepository.findBySupplierCode("FRE-001"))
                .thenReturn(Optional.of(buildSupplier("sup-1", "FRE-001")));

            Supplier result = supplierService.getSupplierByCode("FRE-001");

            assertThat(result.getSupplierCode()).isEqualTo("FRE-001");
        }

        @Test
        @DisplayName("throws when code not found")
        void throwsWhenNotFound() {
            when(supplierRepository.findBySupplierCode("MISSING"))
                .thenReturn(Optional.empty());

            assertThatThrownBy(() -> supplierService.getSupplierByCode("MISSING"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getAllSuppliers")
    class GetAllSuppliers {

        @Test
        @DisplayName("returns all suppliers")
        void returnsAll() {
            when(supplierRepository.findAll()).thenReturn(List.of(buildSupplier("sup-1", "FRE-001")));

            List<Supplier> result = supplierService.getAllSuppliers();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getActiveSuppliers")
    class GetActiveSuppliers {

        @Test
        @DisplayName("returns ACTIVE suppliers only")
        void returnsActiveOnly() {
            when(supplierRepository.findByStatus("ACTIVE"))
                .thenReturn(List.of(buildSupplier("sup-1", "FRE-001")));

            List<Supplier> result = supplierService.getActiveSuppliers();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateSupplier")
    class UpdateSupplier {

        @Test
        @DisplayName("updates supplier when code unchanged")
        void updatesWhenCodeUnchanged() {
            Supplier existing = buildSupplier("sup-1", "FRE-001");
            Supplier updated = buildSupplier("sup-1", "FRE-001");
            updated.setSupplierName("Fresh Farms Updated");

            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(existing));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.updateSupplier(updated);

            assertThat(result.getSupplierName()).isEqualTo("Fresh Farms Updated");
        }

        @Test
        @DisplayName("throws when updating to a code already used by another supplier")
        void throwsOnDuplicateCodeChange() {
            Supplier existing = buildSupplier("sup-1", "FRE-001");
            Supplier updated = buildSupplier("sup-1", "FRE-002");

            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(existing));
            when(supplierRepository.findBySupplierCode("FRE-002"))
                .thenReturn(Optional.of(buildSupplier("sup-2", "FRE-002")));

            assertThatThrownBy(() -> supplierService.updateSupplier(updated))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");
        }
    }

    @Nested
    @DisplayName("updateSupplierStatus")
    class UpdateSupplierStatus {

        @Test
        @DisplayName("updates status to INACTIVE")
        void updatesStatus() {
            Supplier supplier = buildSupplier("sup-1", "FRE-001");
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.updateSupplierStatus("sup-1", "INACTIVE");

            assertThat(result.getStatus()).isEqualTo("INACTIVE");
        }
    }

    @Nested
    @DisplayName("markAsPreferred")
    class MarkAsPreferred {

        @Test
        @DisplayName("sets isPreferred to true")
        void marksPreferred() {
            Supplier supplier = buildSupplier("sup-1", "FRE-001");
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.markAsPreferred("sup-1", true);

            assertThat(result.getIsPreferred()).isTrue();
        }

        @Test
        @DisplayName("sets isPreferred to false")
        void unmarksPreferred() {
            Supplier supplier = buildSupplier("sup-1", "FRE-001");
            supplier.setIsPreferred(true);
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.markAsPreferred("sup-1", false);

            assertThat(result.getIsPreferred()).isFalse();
        }
    }

    @Nested
    @DisplayName("updatePerformanceMetrics")
    class UpdatePerformanceMetrics {

        @Test
        @DisplayName("updates all performance fields when all provided")
        void updatesAllFields() {
            Supplier supplier = buildSupplier("sup-1", "FRE-001");
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.updatePerformanceMetrics("sup-1", 5, 1, 95.0, 4.8);

            assertThat(result.getCompletedOrders()).isEqualTo(9); // 4 + 5
            assertThat(result.getCancelledOrders()).isEqualTo(2); // 1 + 1
            assertThat(result.getOnTimeDeliveryRate()).isEqualTo(95.0);
            assertThat(result.getQualityRating()).isEqualTo(4.8);
        }

        @Test
        @DisplayName("skips null fields")
        void skipsNullFields() {
            Supplier supplier = buildSupplier("sup-1", "FRE-001");
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Supplier result = supplierService.updatePerformanceMetrics("sup-1", null, null, null, 4.9);

            // completedOrders and cancelledOrders unchanged
            assertThat(result.getCompletedOrders()).isEqualTo(4);
            assertThat(result.getCancelledOrders()).isEqualTo(1);
            assertThat(result.getQualityRating()).isEqualTo(4.9);
        }
    }

    @Nested
    @DisplayName("deleteSupplier")
    class DeleteSupplier {

        @Test
        @DisplayName("deletes supplier by id")
        void deletesSupplier() {
            doNothing().when(supplierRepository).deleteById("sup-1");

            supplierService.deleteSupplier("sup-1");

            verify(supplierRepository).deleteById("sup-1");
        }
    }

    @Nested
    @DisplayName("compareSuppliersByCategory")
    class CompareSuppliersByCategory {

        @Test
        @DisplayName("returns ACTIVE suppliers sorted by quality score descending")
        void returnsSortedActiveSuppliers() {
            Supplier sup1 = buildSupplier("sup-1", "FRE-001");
            sup1.setQualityRating(3.0);
            sup1.setOnTimeDeliveryRate(80.0);

            Supplier sup2 = buildSupplier("sup-2", "FRE-002");
            sup2.setQualityRating(4.5);
            sup2.setOnTimeDeliveryRate(95.0);

            when(supplierRepository.findByCategorySupplied("PRODUCE"))
                .thenReturn(List.of(sup1, sup2));

            List<Supplier> result = supplierService.compareSuppliersByCategory("PRODUCE");

            assertThat(result).hasSize(2);
            // sup2 has better score: (4.5*0.5 + 95*0.005) = 2.25 + 0.475 = 2.725
            // sup1 has: (3.0*0.5 + 80*0.005) = 1.5 + 0.4 = 1.9
            assertThat(result.get(0).getId()).isEqualTo("sup-2");
        }

        @Test
        @DisplayName("filters out INACTIVE suppliers")
        void filtersInactiveSuppliers() {
            Supplier active = buildSupplier("sup-1", "FRE-001");
            active.setStatus("ACTIVE");

            Supplier inactive = buildSupplier("sup-2", "FRE-002");
            inactive.setStatus("INACTIVE");

            when(supplierRepository.findByCategorySupplied("PRODUCE"))
                .thenReturn(List.of(active, inactive));

            List<Supplier> result = supplierService.compareSuppliersByCategory("PRODUCE");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("sup-1");
        }
    }

    @Nested
    @DisplayName("getSuppliersByCity")
    class GetSuppliersByCity {

        @Test
        @DisplayName("returns suppliers by city")
        void returnsByCity() {
            when(supplierRepository.findByCity("Mumbai"))
                .thenReturn(List.of(buildSupplier("sup-1", "FRE-001")));

            List<Supplier> result = supplierService.getSuppliersByCity("Mumbai");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getPreferredSuppliers")
    class GetPreferredSuppliers {

        @Test
        @DisplayName("returns ACTIVE preferred suppliers")
        void returnsPreferred() {
            Supplier preferred = buildSupplier("sup-1", "FRE-001");
            preferred.setIsPreferred(true);
            when(supplierRepository.findByStatusAndIsPreferred("ACTIVE", true))
                .thenReturn(List.of(preferred));

            List<Supplier> result = supplierService.getPreferredSuppliers();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsPreferred()).isTrue();
        }
    }

    @Nested
    @DisplayName("getReliableSuppliers")
    class GetReliableSuppliers {

        @Test
        @DisplayName("returns reliable suppliers from repository")
        void returnsReliable() {
            when(supplierRepository.findReliableSuppliers())
                .thenReturn(List.of(buildSupplier("sup-1", "FRE-001")));

            List<Supplier> result = supplierService.getReliableSuppliers();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("searchSuppliers")
    class SearchSuppliers {

        @Test
        @DisplayName("returns suppliers matching search term")
        void returnsMatchingSuppliers() {
            when(supplierRepository.searchByName("farm"))
                .thenReturn(List.of(buildSupplier("sup-1", "FRE-001")));

            List<Supplier> result = supplierService.searchSuppliers("farm");

            assertThat(result).hasSize(1);
        }
    }
}
