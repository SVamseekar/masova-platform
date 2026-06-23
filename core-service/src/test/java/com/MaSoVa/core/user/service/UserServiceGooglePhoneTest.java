package com.MaSoVa.core.user.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserService Google registration phone (Task 16)")
class UserServiceGooglePhoneTest {

    @Test
    @DisplayName("generateGoogleRegistrationPhone passes Indian mobile regex")
    void phoneMatchesValidationPattern() {
        String phone = UserService.generateGoogleRegistrationPhone("sub-abc", "user@gmail.com");
        assertThat(phone).matches("^[6-9]\\d{9}$");
    }

    @Test
    @DisplayName("generateGoogleRegistrationPhone is unique per Google identity")
    void phoneIsUniquePerIdentity() {
        String phoneOne = UserService.generateGoogleRegistrationPhone("sub-one", "first@gmail.com");
        String phoneTwo = UserService.generateGoogleRegistrationPhone("sub-two", "second@gmail.com");
        assertThat(phoneOne).isNotEqualTo(phoneTwo);
    }
}