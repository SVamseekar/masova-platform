package com.MaSoVa.notification.service;

import com.MaSoVa.notification.entity.UserPreferences;
import com.MaSoVa.notification.repository.UserPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserPreferencesService {
    private static final Logger logger = LoggerFactory.getLogger(UserPreferencesService.class);

    private final UserPreferencesRepository userPreferencesRepository;

    public UserPreferencesService(UserPreferencesRepository userPreferencesRepository) {
        this.userPreferencesRepository = userPreferencesRepository;
    }

    public UserPreferences getOrCreatePreferences(String userId) {
        Optional<UserPreferences> existingOpt = userPreferencesRepository.findByUserId(userId);
        if (existingOpt.isPresent()) {
            return existingOpt.get();
        }

        UserPreferences newPreferences = new UserPreferences(userId);
        return userPreferencesRepository.save(newPreferences);
    }

    public UserPreferences updatePreferences(String userId, UserPreferences preferences) {
        UserPreferences existing = getOrCreatePreferences(userId);

        existing.setEmail(preferences.getEmail());
        existing.setPhone(preferences.getPhone());
        existing.setDeviceToken(preferences.getDeviceToken());
        existing.setSmsEnabled(preferences.isSmsEnabled());
        existing.setEmailEnabled(preferences.isEmailEnabled());
        existing.setPushEnabled(preferences.isPushEnabled());
        existing.setInAppEnabled(preferences.isInAppEnabled());
        existing.setQuietHoursStart(preferences.getQuietHoursStart());
        existing.setQuietHoursEnd(preferences.getQuietHoursEnd());
        existing.setRespectQuietHours(preferences.isRespectQuietHours());
        existing.setMarketingEnabled(preferences.isMarketingEnabled());
        existing.setPromotionalEnabled(preferences.isPromotionalEnabled());

        if (preferences.getTypePreferences() != null) {
            existing.setTypePreferences(preferences.getTypePreferences());
        }

        return userPreferencesRepository.save(existing);
    }

    public UserPreferences updateChannelPreference(String userId, String channel, boolean enabled) {
        UserPreferences preferences = getOrCreatePreferences(userId);

        switch (channel.toUpperCase()) {
            case "SMS":
                preferences.setSmsEnabled(enabled);
                break;
            case "EMAIL":
                preferences.setEmailEnabled(enabled);
                break;
            case "PUSH":
                preferences.setPushEnabled(enabled);
                break;
            case "IN_APP":
                preferences.setInAppEnabled(enabled);
                break;
            default:
                throw new IllegalArgumentException("Invalid channel: " + channel);
        }

        return userPreferencesRepository.save(preferences);
    }

    public UserPreferences updateDeviceToken(String userId, String deviceToken) {
        UserPreferences preferences = getOrCreatePreferences(userId);
        preferences.setDeviceToken(deviceToken);
        return userPreferencesRepository.save(preferences);
    }

    public UserPreferences updateContactInfo(String userId, String email, String phone) {
        UserPreferences preferences = getOrCreatePreferences(userId);
        if (email != null) {
            preferences.setEmail(email);
        }
        if (phone != null) {
            preferences.setPhone(phone);
        }
        return userPreferencesRepository.save(preferences);
    }

    public void deletePreferences(String userId) {
        Optional<UserPreferences> preferencesOpt = userPreferencesRepository.findByUserId(userId);
        preferencesOpt.ifPresent(userPreferencesRepository::delete);
    }
}
