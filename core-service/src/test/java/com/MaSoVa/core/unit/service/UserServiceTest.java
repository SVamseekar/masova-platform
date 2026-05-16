package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.user.dto.LoginRequest;
import com.MaSoVa.core.user.dto.LoginResponse;
import com.MaSoVa.core.user.dto.UserCreateRequest;
import com.MaSoVa.core.user.dto.UserResponse;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.core.user.repository.UserJpaRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.repository.WorkingSessionRepository;
import com.MaSoVa.core.user.service.JwtService;
import com.MaSoVa.core.user.service.UserService;
import com.MaSoVa.core.user.service.WorkingSessionService;
import com.MaSoVa.shared.enums.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserJpaRepository userJpaRepository;
    @Mock private WorkingSessionRepository sessionRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private WorkingSessionService sessionService;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private UserService userService;

    private User buildUser(String id, String email) {
        User user = new User();
        user.setId(id);
        User.PersonalInfo info = new User.PersonalInfo();
        info.setEmail(email);
        info.setName("Test User");
        info.setPhone("9876543210");
        info.setPasswordHash("hashed");
        user.setPersonalInfo(info);
        user.setType(UserType.STAFF);
        user.setActive(true);
        return user;
    }

    @Test
    @DisplayName("getUserById returns user when found")
    void getUserById_returnsUser() {
        User user = buildUser("user-1", "test@masova.com");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        User result = userService.getUserById("user-1");

        assertThat(result.getId()).isEqualTo("user-1");
    }

    @Test
    @DisplayName("getUserById throws when not found")
    void getUserById_throwsWhenNotFound() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById("missing"))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("authenticate throws when user not found")
    void authenticate_throwsWhenUserNotFound() {
        when(userRepository.findByPersonalInfoEmail("notexist@masova.com"))
            .thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("notexist@masova.com");
        req.setPassword("password");

        assertThatThrownBy(() -> userService.authenticate(req))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("authenticate throws when password does not match")
    void authenticate_throwsWhenWrongPassword() {
        User user = buildUser("user-1", "test@masova.com");
        when(userRepository.findByPersonalInfoEmail("test@masova.com"))
            .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        LoginRequest req = new LoginRequest();
        req.setEmail("test@masova.com");
        req.setPassword("wrong");

        assertThatThrownBy(() -> userService.authenticate(req))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("getAllUsers returns list from repository")
    void getAllUsers_returnsList() {
        when(userRepository.findAllActiveEmployees())
            .thenReturn(List.of(buildUser("user-1", "a@masova.com")));

        List<UserResponse> result = userService.getAllUsers();

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("activateUser saves user with active=true")
    void activateUser_setsActiveTrue() {
        User user = buildUser("user-1", "test@masova.com");
        user.setActive(false);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userJpaRepository.findByMongoId(anyString())).thenReturn(Optional.empty());

        userService.activateUser("user-1");

        verify(userRepository).save(argThat(u -> u.isActive()));
    }

    @Test
    @DisplayName("deactivateUser saves user with active=false")
    void deactivateUser_setsActiveFalse() {
        User user = buildUser("user-1", "test@masova.com");
        user.setActive(true);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userJpaRepository.findByMongoId(anyString())).thenReturn(Optional.empty());

        userService.deactivateUser("user-1");

        verify(userRepository).save(argThat(u -> !u.isActive()));
    }

    @Test
    @DisplayName("refreshAccessToken throws when refresh token expired")
    void refreshAccessToken_throwsWhenTokenExpired() {
        when(jwtService.extractUserId("bad-token")).thenReturn("user-1");
        when(jwtService.isTokenExpired("bad-token")).thenReturn(true);

        assertThatThrownBy(() -> userService.refreshAccessToken("bad-token"))
            .isInstanceOf(RuntimeException.class);
    }
}
