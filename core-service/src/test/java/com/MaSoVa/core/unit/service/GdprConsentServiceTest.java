package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.enums.ConsentStatus;
import com.MaSoVa.shared.enums.ConsentType;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.repository.GdprConsentRepository;
import com.MaSoVa.core.user.service.GdprConsentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GdprConsentService Unit Tests")
class GdprConsentServiceTest {

    @Mock private GdprConsentRepository consentRepository;
    @Mock private GdprAuditLogRepository auditLogRepository;

    @InjectMocks private GdprConsentService gdprConsentService;

    private GdprConsent buildConsent(String userId, ConsentType type, ConsentStatus status) {
        GdprConsent c = new GdprConsent(userId, type, status);
        c.setId("consent-1");
        c.setGrantedAt(LocalDateTime.now());
        return c;
    }

    // ===========================
    // grantConsent
    // ===========================

    @Nested
    @DisplayName("grantConsent")
    class GrantConsent {

        @Test
        @DisplayName("returns existing consent when already GRANTED")
        void returnsExistingWhenAlreadyGranted() {
            GdprConsent existing = buildConsent("user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED);
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED))
                    .thenReturn(Optional.of(existing));

            GdprConsent result = gdprConsentService.grantConsent(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, "v1", "1.2.3.4", "Mozilla", "I agree");

            assertThat(result.getId()).isEqualTo("consent-1");
            verify(consentRepository, never()).save(any());
        }

        @Test
        @DisplayName("creates new consent when none exists")
        void createsNewConsent() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.empty());
            GdprConsent saved = buildConsent("user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED);
            when(consentRepository.save(any())).thenReturn(saved);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprConsent result = gdprConsentService.grantConsent(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, "v1", "1.2.3.4", "Mozilla", "I agree");

            assertThat(result).isNotNull();
            verify(consentRepository).save(any());
            verify(auditLogRepository).save(any());
        }

        @Test
        @DisplayName("sets expiry for MARKETING_COMMUNICATIONS consent")
        void setsExpiryForMarketing() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(consentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            gdprConsentService.grantConsent(
                    "user-1", ConsentType.MARKETING_COMMUNICATIONS, "v1", null, null, "Opt in");

            verify(consentRepository).save(argThat(c -> c.getExpiresAt() != null));
        }

        @Test
        @DisplayName("sets expiry for ANALYTICS_TRACKING consent")
        void setsExpiryForAnalytics() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(consentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            gdprConsentService.grantConsent(
                    "user-1", ConsentType.ANALYTICS_TRACKING, "v1", null, null, "Agree");

            verify(consentRepository).save(argThat(c -> c.getExpiresAt() != null));
        }

        @Test
        @DisplayName("does not set expiry for TERMS_OF_SERVICE consent")
        void noExpiryForTerms() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(consentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            gdprConsentService.grantConsent(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, "v1", null, null, "Agree");

            verify(consentRepository).save(argThat(c -> c.getExpiresAt() == null));
        }
    }

    // ===========================
    // revokeConsent
    // ===========================

    @Nested
    @DisplayName("revokeConsent")
    class RevokeConsent {

        @Test
        @DisplayName("throws when no active consent to revoke")
        void throwsWhenNoActiveConsent() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprConsentService.revokeConsent(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, null, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("No active consent");
        }

        @Test
        @DisplayName("sets status to REVOKED and records audit log")
        void setsRevoked() {
            GdprConsent existing = buildConsent("user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED);
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED))
                    .thenReturn(Optional.of(existing));
            when(consentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprConsent result = gdprConsentService.revokeConsent(
                    "user-1", ConsentType.TERMS_AND_CONDITIONS, null, null);

            assertThat(result.getStatus()).isEqualTo(ConsentStatus.REVOKED);
            assertThat(result.getRevokedAt()).isNotNull();
            verify(auditLogRepository).save(any());
        }
    }

    // ===========================
    // hasActiveConsent
    // ===========================

    @Nested
    @DisplayName("hasActiveConsent")
    class HasActiveConsent {

        @Test
        @DisplayName("returns false when no consent record")
        void returnsFalseWhenNoConsent() {
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.empty());

            assertThat(gdprConsentService.hasActiveConsent("user-1", ConsentType.TERMS_AND_CONDITIONS))
                    .isFalse();
        }

        @Test
        @DisplayName("returns true when active consent exists")
        void returnsTrueWhenActive() {
            GdprConsent consent = buildConsent("user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED);
            when(consentRepository.findByUserIdAndConsentTypeAndStatus(any(), any(), any()))
                    .thenReturn(Optional.of(consent));

            assertThat(gdprConsentService.hasActiveConsent("user-1", ConsentType.TERMS_AND_CONDITIONS))
                    .isTrue();
        }
    }

    // ===========================
    // expireOldConsents
    // ===========================

    @Nested
    @DisplayName("expireOldConsents")
    class ExpireOldConsents {

        @Test
        @DisplayName("expires GRANTED consents past expiry date")
        void expiresGrantedConsents() {
            GdprConsent expired = buildConsent("user-1", ConsentType.MARKETING_COMMUNICATIONS, ConsentStatus.GRANTED);
            when(consentRepository.findByExpiresAtBefore(any())).thenReturn(List.of(expired));
            when(consentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            gdprConsentService.expireOldConsents();

            verify(consentRepository).save(argThat(c -> c.getStatus() == ConsentStatus.EXPIRED));
        }

        @Test
        @DisplayName("does nothing when no expired consents")
        void noopWhenNoneExpired() {
            when(consentRepository.findByExpiresAtBefore(any())).thenReturn(List.of());

            gdprConsentService.expireOldConsents();

            verify(consentRepository, never()).save(any());
        }
    }

    // ===========================
    // getUserConsents
    // ===========================

    @Nested
    @DisplayName("getUserConsents")
    class GetUserConsents {

        @Test
        @DisplayName("returns consents for user")
        void returnsConsents() {
            GdprConsent c = buildConsent("user-1", ConsentType.TERMS_AND_CONDITIONS, ConsentStatus.GRANTED);
            when(consentRepository.findByUserId("user-1")).thenReturn(List.of(c));

            List<GdprConsent> result = gdprConsentService.getUserConsents("user-1");

            assertThat(result).hasSize(1);
        }
    }
}
