package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.GdprDataBreach;
import com.MaSoVa.shared.enums.BreachSeverity;
import com.MaSoVa.shared.enums.BreachStatus;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.repository.GdprDataBreachRepository;
import com.MaSoVa.core.user.service.GdprBreachService;
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
@DisplayName("GdprBreachService Unit Tests")
class GdprBreachServiceTest {

    @Mock private GdprDataBreachRepository breachRepository;
    @Mock private GdprAuditLogRepository auditLogRepository;

    @InjectMocks private GdprBreachService gdprBreachService;

    private GdprDataBreach buildBreach(String id, BreachStatus status) {
        GdprDataBreach b = new GdprDataBreach("Test Breach", "Description", BreachSeverity.HIGH);
        b.setId(id);
        b.setStatus(status);
        return b;
    }

    @Nested
    @DisplayName("reportBreach")
    class ReportBreach {

        @Test
        @DisplayName("saves breach and creates audit log")
        void savesAndLogsAudit() {
            GdprDataBreach saved = buildBreach("b1", BreachStatus.DETECTED);
            when(breachRepository.save(any())).thenReturn(saved);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprDataBreach result = gdprBreachService.reportBreach(
                    "Data leak", "Description", BreachSeverity.HIGH,
                    "reporter@masova.com", List.of("user-1"), List.of("PII"));

            assertThat(result.getId()).isEqualTo("b1");
            verify(breachRepository).save(any());
            verify(auditLogRepository).save(any());
        }
    }

    @Nested
    @DisplayName("updateBreachStatus")
    class UpdateBreachStatus {

        @Test
        @DisplayName("throws when breach not found")
        void throwsWhenNotFound() {
            when(breachRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprBreachService.updateBreachStatus(
                    "missing", BreachStatus.INVESTIGATING, "notes"))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("updates status and saves")
        void updatesStatus() {
            GdprDataBreach breach = buildBreach("b1", BreachStatus.DETECTED);
            when(breachRepository.findById("b1")).thenReturn(Optional.of(breach));
            when(breachRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprDataBreach result = gdprBreachService.updateBreachStatus(
                    "b1", BreachStatus.INVESTIGATING, "Investigating");

            assertThat(result.getStatus()).isEqualTo(BreachStatus.INVESTIGATING);
        }
    }

    @Nested
    @DisplayName("notifyAuthority")
    class NotifyAuthority {

        @Test
        @DisplayName("throws when breach not found")
        void throwsWhenNotFound() {
            when(breachRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprBreachService.notifyAuthority("missing", "ICO-123"))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("sets authority reference and notification time")
        void setsAuthorityReference() {
            GdprDataBreach breach = buildBreach("b1", BreachStatus.DETECTED);
            when(breachRepository.findById("b1")).thenReturn(Optional.of(breach));
            when(breachRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprDataBreach result = gdprBreachService.notifyAuthority("b1", "ICO-123");

            assertThat(result.getAuthorityReference()).isEqualTo("ICO-123");
        }
    }

    @Nested
    @DisplayName("getBreachesByStatus")
    class GetBreachesByStatus {

        @Test
        @DisplayName("returns breaches for given status")
        void returnsBreaches() {
            GdprDataBreach breach = buildBreach("b1", BreachStatus.DETECTED);
            when(breachRepository.findByStatus(BreachStatus.DETECTED)).thenReturn(List.of(breach));

            List<GdprDataBreach> result = gdprBreachService.getBreachesByStatus(BreachStatus.DETECTED);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getBreachesForUser")
    class GetBreachesForUser {

        @Test
        @DisplayName("returns breaches affecting a user")
        void returnsBreachesForUser() {
            GdprDataBreach breach = buildBreach("b1", BreachStatus.DETECTED);
            when(breachRepository.findByAffectedUserIdsContaining("user-1")).thenReturn(List.of(breach));

            List<GdprDataBreach> result = gdprBreachService.getBreachesForUser("user-1");

            assertThat(result).hasSize(1);
        }
    }
}
