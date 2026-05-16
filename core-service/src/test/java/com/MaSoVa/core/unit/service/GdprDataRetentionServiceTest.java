package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.GdprDataRetention;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.repository.GdprDataRetentionRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.service.GdprDataRetentionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GdprDataRetentionService Unit Tests")
class GdprDataRetentionServiceTest {

    @Mock private GdprDataRetentionRepository retentionRepository;
    @Mock private GdprAuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private GdprDataRetentionService gdprDataRetentionService;

    private GdprDataRetention buildPolicy(String id, String dataType) {
        GdprDataRetention p = new GdprDataRetention(dataType, 365, "LEGAL_OBLIGATION");
        p.setId(id);
        p.setActive(true);
        p.setAutoDeleteEnabled(true);
        return p;
    }

    @Nested
    @DisplayName("createRetentionPolicy")
    class CreateRetentionPolicy {

        @Test
        @DisplayName("throws when policy already exists for data type")
        void throwsOnDuplicate() {
            GdprDataRetention existing = buildPolicy("p1", "USER_DATA");
            when(retentionRepository.findByDataType("USER_DATA")).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> gdprDataRetentionService.createRetentionPolicy(
                    "USER_DATA", 365, "LEGAL_OBLIGATION", "User data"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("creates policy when none exists")
        void createsPolicy() {
            when(retentionRepository.findByDataType("AUDIT_LOGS")).thenReturn(Optional.empty());
            GdprDataRetention saved = buildPolicy("p1", "AUDIT_LOGS");
            when(retentionRepository.save(any())).thenReturn(saved);

            GdprDataRetention result = gdprDataRetentionService.createRetentionPolicy(
                    "AUDIT_LOGS", 90, "LEGAL_OBLIGATION", "Audit logs");

            assertThat(result.getId()).isEqualTo("p1");
        }
    }

    @Nested
    @DisplayName("updateRetentionPolicy")
    class UpdateRetentionPolicy {

        @Test
        @DisplayName("throws when policy not found")
        void throwsWhenNotFound() {
            when(retentionRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprDataRetentionService.updateRetentionPolicy(
                    "missing", 180, "CONSENT", "reviewer-1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("updates period and legal basis")
        void updatesFields() {
            GdprDataRetention policy = buildPolicy("p1", "USER_DATA");
            when(retentionRepository.findById("p1")).thenReturn(Optional.of(policy));
            when(retentionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            GdprDataRetention result = gdprDataRetentionService.updateRetentionPolicy(
                    "p1", 180, "CONSENT", "admin");

            assertThat(result.getRetentionPeriodDays()).isEqualTo(180);
            assertThat(result.getLegalBasis()).isEqualTo("CONSENT");
        }
    }

    @Nested
    @DisplayName("getRetentionPolicy")
    class GetRetentionPolicy {

        @Test
        @DisplayName("returns policy when found by dataType")
        void returnsPolicy() {
            GdprDataRetention policy = buildPolicy("p1", "USER_DATA");
            when(retentionRepository.findByDataType("USER_DATA")).thenReturn(Optional.of(policy));

            assertThat(gdprDataRetentionService.getRetentionPolicy("USER_DATA")).isPresent();
        }

        @Test
        @DisplayName("returns empty when not found")
        void returnsEmpty() {
            when(retentionRepository.findByDataType("UNKNOWN")).thenReturn(Optional.empty());

            assertThat(gdprDataRetentionService.getRetentionPolicy("UNKNOWN")).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllActiveRetentionPolicies")
    class GetAllActive {

        @Test
        @DisplayName("returns active policies from repository")
        void returnsActivePolicies() {
            GdprDataRetention policy = buildPolicy("p1", "USER_DATA");
            when(retentionRepository.findByIsActive(true)).thenReturn(List.of(policy));

            List<GdprDataRetention> result = gdprDataRetentionService.getAllActiveRetentionPolicies();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("applyRetentionPolicies")
    class ApplyRetentionPolicies {

        @Test
        @DisplayName("does not throw when no auto-delete policies")
        void doesNotThrowWhenNoPolicies() {
            when(retentionRepository.findByAutoDeleteEnabled(true)).thenReturn(List.of());

            assertThatCode(() -> gdprDataRetentionService.applyRetentionPolicies())
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("skips inactive policies")
        void skipsInactivePolicies() {
            GdprDataRetention inactive = buildPolicy("p1", "INACTIVE_USER_ACCOUNTS");
            inactive.setActive(false);
            when(retentionRepository.findByAutoDeleteEnabled(true)).thenReturn(List.of(inactive));

            gdprDataRetentionService.applyRetentionPolicies();

            verify(userRepository, never()).findAll();
        }
    }
}
