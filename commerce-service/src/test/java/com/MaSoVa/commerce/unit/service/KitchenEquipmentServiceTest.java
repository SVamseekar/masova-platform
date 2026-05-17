package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.KitchenEquipment;
import com.MaSoVa.commerce.order.entity.KitchenEquipment.EquipmentStatus;
import com.MaSoVa.commerce.order.entity.KitchenEquipment.EquipmentType;
import com.MaSoVa.commerce.order.repository.KitchenEquipmentRepository;
import com.MaSoVa.commerce.order.service.KitchenEquipmentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KitchenEquipmentServiceTest {

    @Mock private KitchenEquipmentRepository equipmentRepository;
    @InjectMocks private KitchenEquipmentService equipmentService;

    private KitchenEquipment buildEquipment(String id, EquipmentStatus status, EquipmentType type) {
        KitchenEquipment eq = new KitchenEquipment();
        eq.setId(id);
        eq.setEquipmentName("Test Equipment");
        eq.setStoreId("store-1");
        eq.setType(type);
        eq.setStatus(status);
        eq.setIsOn(false);
        eq.setUsageCount(0);
        return eq;
    }

    @Test
    void createEquipment_sets_defaults_and_saves() {
        KitchenEquipment eq = new KitchenEquipment();
        eq.setEquipmentName("Oven");
        eq.setStoreId("store-1");
        eq.setType(EquipmentType.OVEN);
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.createEquipment(eq);

        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.AVAILABLE);
        assertThat(result.getIsOn()).isFalse();
        assertThat(result.getUsageCount()).isZero();
        assertThat(result.getCreatedAt()).isNotNull();
    }

    @Test
    void createEquipment_preserves_status_if_provided() {
        KitchenEquipment eq = new KitchenEquipment();
        eq.setEquipmentName("Broken Grill");
        eq.setStoreId("store-1");
        eq.setType(EquipmentType.GRILL);
        eq.setStatus(EquipmentStatus.BROKEN);
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.createEquipment(eq);

        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.BROKEN);
    }

    @Test
    void getEquipmentByStore_delegates_to_repository() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        when(equipmentRepository.findByStoreId("store-1")).thenReturn(List.of(eq));

        List<KitchenEquipment> result = equipmentService.getEquipmentByStore("store-1");

        assertThat(result).hasSize(1);
        verify(equipmentRepository).findByStoreId("store-1");
    }

    @Test
    void getEquipmentById_not_found_throws() {
        when(equipmentRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> equipmentService.getEquipmentById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Equipment not found");
    }

    @Test
    void updateEquipmentStatus_updates_status_and_notes() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateEquipmentStatus("eq-1", EquipmentStatus.MAINTENANCE, "staff-1", "Annual service");

        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.MAINTENANCE);
        assertThat(result.getStatusChangedBy()).isEqualTo("staff-1");
        assertThat(result.getStatusNotes()).isEqualTo("Annual service");
        assertThat(result.getLastStatusChange()).isNotNull();
    }

    @Test
    void updateEquipmentStatus_BROKEN_turns_off_equipment() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.OVEN);
        eq.setIsOn(true);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateEquipmentStatus("eq-1", EquipmentStatus.BROKEN, "staff-1", "Broke down");

        assertThat(result.getIsOn()).isFalse();
    }

    @Test
    void updateEquipmentStatus_MAINTENANCE_turns_off_equipment() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.GRILL);
        eq.setIsOn(true);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateEquipmentStatus("eq-1", EquipmentStatus.MAINTENANCE, "staff-1", "Scheduled");

        assertThat(result.getIsOn()).isFalse();
    }

    @Test
    void toggleEquipmentPower_on_sets_status_IN_USE_and_increments_usage() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.toggleEquipmentPower("eq-1", true, "staff-1");

        assertThat(result.getIsOn()).isTrue();
        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.IN_USE);
        assertThat(result.getUsageCount()).isEqualTo(1);
    }

    @Test
    void toggleEquipmentPower_off_sets_status_AVAILABLE() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.OVEN);
        eq.setIsOn(true);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.toggleEquipmentPower("eq-1", false, "staff-1");

        assertThat(result.getIsOn()).isFalse();
        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.AVAILABLE);
    }

    @Test
    void toggleEquipmentPower_on_when_BROKEN_throws() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.BROKEN, EquipmentType.OVEN);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));

        assertThatThrownBy(() -> equipmentService.toggleEquipmentPower("eq-1", true, "staff-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot turn on equipment");
    }

    @Test
    void updateTemperature_for_oven_succeeds() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.OVEN);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateTemperature("eq-1", 220);

        assertThat(result.getTemperature()).isEqualTo(220);
    }

    @Test
    void updateTemperature_for_grill_succeeds() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.GRILL);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateTemperature("eq-1", 180);

        assertThat(result.getTemperature()).isEqualTo(180);
    }

    @Test
    void updateTemperature_for_fryer_succeeds() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.IN_USE, EquipmentType.FRYER);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        KitchenEquipment result = equipmentService.updateTemperature("eq-1", 170);

        assertThat(result.getTemperature()).isEqualTo(170);
    }

    @Test
    void updateTemperature_for_refrigerator_throws() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.REFRIGERATOR);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));

        assertThatThrownBy(() -> equipmentService.updateTemperature("eq-1", 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Temperature tracking not supported");
    }

    @Test
    void recordMaintenance_sets_maintenance_fields_and_marks_available() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.MAINTENANCE, EquipmentType.OVEN);
        when(equipmentRepository.findById("eq-1")).thenReturn(Optional.of(eq));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LocalDateTime nextMaintenance = LocalDateTime.now().plusMonths(3);
        KitchenEquipment result = equipmentService.recordMaintenance("eq-1", nextMaintenance, "Filter replaced");

        assertThat(result.getLastMaintenanceDate()).isNotNull();
        assertThat(result.getNextMaintenanceDate()).isEqualTo(nextMaintenance);
        assertThat(result.getMaintenanceNotes()).isEqualTo("Filter replaced");
        assertThat(result.getStatus()).isEqualTo(EquipmentStatus.AVAILABLE);
    }

    @Test
    void getEquipmentNeedingMaintenance_returns_overdue_equipment() {
        KitchenEquipment overdue = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        overdue.setNextMaintenanceDate(LocalDateTime.now().minusDays(1));

        KitchenEquipment ok = buildEquipment("eq-2", EquipmentStatus.AVAILABLE, EquipmentType.GRILL);
        ok.setNextMaintenanceDate(LocalDateTime.now().plusDays(30));

        when(equipmentRepository.findByStoreId("store-1")).thenReturn(List.of(overdue, ok));

        List<KitchenEquipment> result = equipmentService.getEquipmentNeedingMaintenance("store-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("eq-1");
    }

    @Test
    void getEquipmentNeedingMaintenance_excludes_null_maintenance_date() {
        KitchenEquipment eq = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        eq.setNextMaintenanceDate(null);
        when(equipmentRepository.findByStoreId("store-1")).thenReturn(List.of(eq));

        List<KitchenEquipment> result = equipmentService.getEquipmentNeedingMaintenance("store-1");

        assertThat(result).isEmpty();
    }

    @Test
    void deleteEquipment_calls_repository_delete() {
        equipmentService.deleteEquipment("eq-1");
        verify(equipmentRepository).deleteById("eq-1");
    }

    @Test
    void resetDailyUsageCounts_zeroes_all_counts() {
        KitchenEquipment eq1 = buildEquipment("eq-1", EquipmentStatus.AVAILABLE, EquipmentType.OVEN);
        eq1.setUsageCount(10);
        KitchenEquipment eq2 = buildEquipment("eq-2", EquipmentStatus.IN_USE, EquipmentType.GRILL);
        eq2.setUsageCount(5);

        when(equipmentRepository.findByStoreId("store-1")).thenReturn(List.of(eq1, eq2));

        equipmentService.resetDailyUsageCounts("store-1");

        assertThat(eq1.getUsageCount()).isZero();
        assertThat(eq2.getUsageCount()).isZero();
        verify(equipmentRepository).saveAll(anyList());
    }
}
