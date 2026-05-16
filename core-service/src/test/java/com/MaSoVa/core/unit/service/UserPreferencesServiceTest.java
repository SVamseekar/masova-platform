package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.repository.UserPreferencesRepository;
import com.MaSoVa.core.notification.service.UserPreferencesService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserPreferencesService Unit Tests")
class UserPreferencesServiceTest {

    @Mock private UserPreferencesRepository userPreferencesRepository;

    @InjectMocks private UserPreferencesService userPreferencesService;

    private UserPreferences buildPrefs(String userId) {
        UserPreferences p = new UserPreferences(userId);
        p.setSmsEnabled(true);
        p.setEmailEnabled(true);
        p.setPushEnabled(true);
        p.setInAppEnabled(true);
        return p;
    }

    @Nested
    @DisplayName("getOrCreatePreferences")
    class GetOrCreate {

        @Test
        @DisplayName("returns existing preferences when found")
        void returnsExisting() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));

            UserPreferences result = userPreferencesService.getOrCreatePreferences("user-1");

            assertThat(result).isEqualTo(prefs);
            verify(userPreferencesRepository, never()).save(any());
        }

        @Test
        @DisplayName("creates new preferences when none exist")
        void createsNew() {
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.getOrCreatePreferences("user-1");

            assertThat(result).isNotNull();
            verify(userPreferencesRepository).save(any());
        }
    }

    @Nested
    @DisplayName("updatePreferences")
    class UpdatePreferences {

        @Test
        @DisplayName("updates all fields from provided preferences")
        void updatesFields() {
            UserPreferences existing = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(existing));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences update = buildPrefs("user-1");
            update.setSmsEnabled(false);
            update.setEmail("test@example.com");

            UserPreferences result = userPreferencesService.updatePreferences("user-1", update);

            assertThat(result.isSmsEnabled()).isFalse();
            assertThat(result.getEmail()).isEqualTo("test@example.com");
            verify(userPreferencesRepository).save(any());
        }
    }

    @Nested
    @DisplayName("updateChannelPreference")
    class UpdateChannelPreference {

        @Test
        @DisplayName("throws for invalid channel name")
        void throwsForInvalidChannel() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));

            assertThatThrownBy(() -> userPreferencesService.updateChannelPreference("user-1", "CARRIER_PIGEON", true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid channel");
        }

        @Test
        @DisplayName("updates SMS preference")
        void updatesSms() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateChannelPreference("user-1", "SMS", false);

            assertThat(result.isSmsEnabled()).isFalse();
        }

        @Test
        @DisplayName("updates EMAIL preference")
        void updatesEmail() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateChannelPreference("user-1", "EMAIL", false);

            assertThat(result.isEmailEnabled()).isFalse();
        }

        @Test
        @DisplayName("updates PUSH preference")
        void updatesPush() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateChannelPreference("user-1", "PUSH", false);

            assertThat(result.isPushEnabled()).isFalse();
        }

        @Test
        @DisplayName("updates IN_APP preference")
        void updatesInApp() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateChannelPreference("user-1", "IN_APP", false);

            assertThat(result.isInAppEnabled()).isFalse();
        }
    }

    @Nested
    @DisplayName("updateDeviceToken")
    class UpdateDeviceToken {

        @Test
        @DisplayName("updates device token and saves")
        void updatesToken() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateDeviceToken("user-1", "device-token-123");

            assertThat(result.getDeviceToken()).isEqualTo("device-token-123");
        }
    }

    @Nested
    @DisplayName("updateContactInfo")
    class UpdateContactInfo {

        @Test
        @DisplayName("updates email when provided")
        void updatesEmail() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateContactInfo("user-1", "new@example.com", null);

            assertThat(result.getEmail()).isEqualTo("new@example.com");
        }

        @Test
        @DisplayName("updates phone when provided")
        void updatesPhone() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(userPreferencesRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UserPreferences result = userPreferencesService.updateContactInfo("user-1", null, "+911234567890");

            assertThat(result.getPhone()).isEqualTo("+911234567890");
        }
    }

    @Nested
    @DisplayName("deletePreferences")
    class DeletePreferences {

        @Test
        @DisplayName("deletes when preferences exist")
        void deletesWhenFound() {
            UserPreferences prefs = buildPrefs("user-1");
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));

            userPreferencesService.deletePreferences("user-1");

            verify(userPreferencesRepository).delete(prefs);
        }

        @Test
        @DisplayName("noop when preferences not found")
        void noopWhenNotFound() {
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());

            userPreferencesService.deletePreferences("user-1");

            verify(userPreferencesRepository, never()).delete(any());
        }
    }
}
