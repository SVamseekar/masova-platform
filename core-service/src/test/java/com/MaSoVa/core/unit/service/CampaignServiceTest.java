package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.entity.Campaign;
import com.MaSoVa.core.notification.repository.CampaignRepository;
import com.MaSoVa.core.notification.repository.UserPreferencesRepository;
import com.MaSoVa.core.notification.service.CampaignService;
import com.MaSoVa.core.notification.service.EmailService;
import com.MaSoVa.core.notification.service.NotificationService;
import com.MaSoVa.core.notification.service.SmsService;
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
@DisplayName("CampaignService Unit Tests")
class CampaignServiceTest {

    @Mock private CampaignRepository campaignRepository;
    @Mock private UserPreferencesRepository userPreferencesRepository;
    @Mock private NotificationService notificationService;
    @Mock private SmsService smsService;
    @Mock private EmailService emailService;

    @InjectMocks private CampaignService campaignService;

    private Campaign buildCampaign(String id) {
        Campaign c = new Campaign();
        c.setId(id);
        c.setName("Test Campaign");
        c.setMessage("Hello!");
        c.setSubject("Subject");
        c.setChannel(com.MaSoVa.core.notification.entity.Notification.NotificationChannel.EMAIL);
        c.setStatus(Campaign.CampaignStatus.DRAFT);
        return c;
    }

    // ===========================
    // createCampaign
    // ===========================

    @Nested
    @DisplayName("createCampaign")
    class CreateCampaign {

        @Test
        @DisplayName("sets DRAFT status on creation")
        void setsDraftStatus() {
            Campaign c = buildCampaign(null);
            when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Campaign result = campaignService.createCampaign(c);

            assertThat(result.getStatus()).isEqualTo(Campaign.CampaignStatus.DRAFT);
        }
    }

    // ===========================
    // updateCampaign
    // ===========================

    @Nested
    @DisplayName("updateCampaign")
    class UpdateCampaign {

        @Test
        @DisplayName("throws when campaign not found")
        void throwsWhenNotFound() {
            when(campaignRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignService.updateCampaign("missing", buildCampaign("missing")))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("updates name and message on existing campaign")
        void updatesFields() {
            Campaign existing = buildCampaign("c1");
            when(campaignRepository.findById("c1")).thenReturn(Optional.of(existing));
            when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Campaign update = buildCampaign("c1");
            update.setName("Updated Name");
            update.setMessage("New message");

            Campaign result = campaignService.updateCampaign("c1", update);

            assertThat(result.getName()).isEqualTo("Updated Name");
            assertThat(result.getMessage()).isEqualTo("New message");
        }
    }

    // ===========================
    // scheduleCampaign
    // ===========================

    @Nested
    @DisplayName("scheduleCampaign")
    class ScheduleCampaign {

        @Test
        @DisplayName("throws when campaign not found")
        void throwsWhenNotFound() {
            when(campaignRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignService.scheduleCampaign("missing", LocalDateTime.now().plusDays(1)))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("sets status to SCHEDULED with scheduled time")
        void setsScheduledStatus() {
            Campaign c = buildCampaign("c1");
            LocalDateTime scheduledFor = LocalDateTime.now().plusDays(1);
            when(campaignRepository.findById("c1")).thenReturn(Optional.of(c));
            when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            campaignService.scheduleCampaign("c1", scheduledFor);

            verify(campaignRepository).save(argThat(saved ->
                    saved.getStatus() == Campaign.CampaignStatus.SCHEDULED &&
                    scheduledFor.equals(saved.getScheduledFor())));
        }
    }

    // ===========================
    // cancelCampaign
    // ===========================

    @Nested
    @DisplayName("cancelCampaign")
    class CancelCampaign {

        @Test
        @DisplayName("throws when campaign not found")
        void throwsWhenNotFound() {
            when(campaignRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignService.cancelCampaign("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("sets status to CANCELLED")
        void setsCancelled() {
            Campaign c = buildCampaign("c1");
            when(campaignRepository.findById("c1")).thenReturn(Optional.of(c));
            when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            campaignService.cancelCampaign("c1");

            verify(campaignRepository).save(argThat(saved ->
                    saved.getStatus() == Campaign.CampaignStatus.CANCELLED));
        }
    }

    // ===========================
    // deleteCampaign
    // ===========================

    @Nested
    @DisplayName("deleteCampaign")
    class DeleteCampaign {

        @Test
        @DisplayName("calls deleteById on repository")
        void deletesById() {
            campaignService.deleteCampaign("c1");
            verify(campaignRepository).deleteById("c1");
        }
    }

    // ===========================
    // getCampaignById
    // ===========================

    @Nested
    @DisplayName("getCampaignById")
    class GetCampaignById {

        @Test
        @DisplayName("returns campaign when found")
        void returnsCampaign() {
            Campaign c = buildCampaign("c1");
            when(campaignRepository.findById("c1")).thenReturn(Optional.of(c));

            assertThat(campaignService.getCampaignById("c1")).isPresent();
        }

        @Test
        @DisplayName("returns empty when not found")
        void returnsEmpty() {
            when(campaignRepository.findById("missing")).thenReturn(Optional.empty());

            assertThat(campaignService.getCampaignById("missing")).isEmpty();
        }
    }

    // ===========================
    // executeCampaign — no targetUserIds, uses preferences
    // ===========================

    @Nested
    @DisplayName("executeCampaign")
    class ExecuteCampaign {

        @Test
        @DisplayName("does not throw when campaign not found")
        void doesNotThrowWhenNotFound() {
            when(campaignRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatCode(() -> campaignService.executeCampaign("missing"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("sets SENDING status and saves at start")
        void setsSendingStatusAtStart() {
            Campaign c = buildCampaign("c1");
            c.setTargetUserIds(List.of());
            when(campaignRepository.findById("c1")).thenReturn(Optional.of(c));
            when(userPreferencesRepository.findByPromotionalEnabledTrue()).thenReturn(List.of());
            when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            campaignService.executeCampaign("c1");

            verify(campaignRepository, atLeastOnce()).save(argThat(saved ->
                    saved.getStatus() == Campaign.CampaignStatus.SENDING ||
                    saved.getStatus() == Campaign.CampaignStatus.SENT));
        }
    }
}
