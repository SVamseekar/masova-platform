package com.MaSoVa.core.user.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserService Google registration phone (Task 16)")
class UserServiceGooglePhoneTest {

    @Test
    @DisplayName("generateGoogleRegistrationPhone passes E.164 (EU) phone regex")
    void phoneMatchesValidationPattern() {
        String phone = UserService.generateGoogleRegistrationPhone("sub-abc", "user@gmail.com");
        assertThat(phone).matches("^\\+?[1-9]\\d{6,14}$");
        assertThat(phone).startsWith("+4915");
    }

    @Test
    @DisplayName("generateGoogleRegistrationPhone is unique per Google identity")
    void phoneIsUniquePerIdentity() {
        String phoneOne = UserService.generateGoogleRegistrationPhone("sub-one", "first@gmail.com");
        String phoneTwo = UserService.generateGoogleRegistrationPhone("sub-two", "second@gmail.com");
        assertThat(phoneOne).isNotEqualTo(phoneTwo);
    }
}