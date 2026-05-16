package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.user.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private static final String VALID_SECRET =
            "this-is-a-very-long-test-secret-key-at-least-64-chars-for-hs512-ok!";

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", VALID_SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 3600000L);
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpiration", 604800000L);
        ReflectionTestUtils.setField(jwtService, "kioskAccessTokenExpiration", 2592000000L);
        ReflectionTestUtils.setField(jwtService, "kioskRefreshTokenExpiration", 7776000000L);
        ReflectionTestUtils.setField(jwtService, "redisTemplate", redisTemplate);
        jwtService.validateSecretKey();
    }

    // ===========================
    // validateSecretKey @PostConstruct
    // ===========================

    @Nested
    @DisplayName("validateSecretKey")
    class ValidateSecretKey {

        @Test
        @DisplayName("throws when secret is null")
        void throwsWhenNull() {
            JwtService svc = new JwtService();
            ReflectionTestUtils.setField(svc, "secretKey", null);
            ReflectionTestUtils.setField(svc, "redisTemplate", redisTemplate);
            assertThatThrownBy(svc::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("not configured");
        }

        @Test
        @DisplayName("throws when secret is empty")
        void throwsWhenEmpty() {
            JwtService svc = new JwtService();
            ReflectionTestUtils.setField(svc, "secretKey", "");
            ReflectionTestUtils.setField(svc, "redisTemplate", redisTemplate);
            assertThatThrownBy(svc::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("throws when secret is shorter than 64 chars")
        void throwsWhenTooShort() {
            JwtService svc = new JwtService();
            ReflectionTestUtils.setField(svc, "secretKey", "short-key");
            ReflectionTestUtils.setField(svc, "redisTemplate", redisTemplate);
            assertThatThrownBy(svc::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("too short");
        }

        @Test
        @DisplayName("succeeds with valid 64+ char secret")
        void succeedsWithValidSecret() {
            assertThatCode(() -> jwtService.validateSecretKey()).doesNotThrowAnyException();
        }
    }

    // ===========================
    // Token generation
    // ===========================

    @Nested
    @DisplayName("generateAccessToken")
    class GenerateAccessToken {

        @Test
        @DisplayName("generates token with userId as subject")
        void setsSubject() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThat(jwtService.extractUserId(token)).isEqualTo("user-1");
        }

        @Test
        @DisplayName("embeds userType and storeId claims")
        void embedsClaims() {
            String token = jwtService.generateAccessToken("user-1", "MANAGER", "store-42");
            assertThat(jwtService.extractUserType(token)).isEqualTo("MANAGER");
            assertThat(jwtService.extractStoreId(token)).isEqualTo("store-42");
        }

        @Test
        @DisplayName("omits storeId claim when null")
        void omitsStoreIdWhenNull() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", null);
            assertThat(jwtService.extractStoreId(token)).isNull();
        }

        @Test
        @DisplayName("token is not expired immediately after creation")
        void notExpiredImmediately() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThat(jwtService.isTokenExpired(token)).isFalse();
        }
    }

    @Nested
    @DisplayName("generateRefreshToken")
    class GenerateRefreshToken {

        @Test
        @DisplayName("generates token with userId as subject")
        void setsSubject() {
            String token = jwtService.generateRefreshToken("user-1");
            assertThat(jwtService.extractUserId(token)).isEqualTo("user-1");
        }

        @Test
        @DisplayName("refresh token is not a kiosk token")
        void notKioskToken() {
            String token = jwtService.generateRefreshToken("user-1");
            assertThat(jwtService.isKioskToken(token)).isFalse();
        }
    }

    @Nested
    @DisplayName("generateKioskAccessToken")
    class GenerateKioskAccessToken {

        @Test
        @DisplayName("sets isKiosk claim to true")
        void setsIsKioskTrue() {
            String token = jwtService.generateKioskAccessToken("kiosk-1", "store-1", "POS-01");
            assertThat(jwtService.isKioskToken(token)).isTrue();
        }

        @Test
        @DisplayName("embeds terminalId claim")
        void embedsTerminalId() {
            String token = jwtService.generateKioskAccessToken("kiosk-1", "store-1", "POS-01");
            assertThat(jwtService.extractTerminalId(token)).isEqualTo("POS-01");
        }

        @Test
        @DisplayName("embeds storeId claim")
        void embedsStoreId() {
            String token = jwtService.generateKioskAccessToken("kiosk-1", "store-1", "POS-01");
            assertThat(jwtService.extractStoreId(token)).isEqualTo("store-1");
        }
    }

    @Nested
    @DisplayName("generateKioskRefreshToken")
    class GenerateKioskRefreshToken {

        @Test
        @DisplayName("kiosk refresh token is recognized as kiosk")
        void isKioskToken() {
            String token = jwtService.generateKioskRefreshToken("kiosk-1");
            assertThat(jwtService.isKioskToken(token)).isTrue();
        }
    }

    // ===========================
    // Token validation
    // ===========================

    @Nested
    @DisplayName("validateToken")
    class ValidateToken {

        @Test
        @DisplayName("returns true for matching userId and non-expired token")
        void returnsTrueForValidToken() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThat(jwtService.validateToken(token, "user-1")).isTrue();
        }

        @Test
        @DisplayName("returns false when userId does not match token subject")
        void returnsFalseForWrongUser() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThat(jwtService.validateToken(token, "user-2")).isFalse();
        }
    }

    @Nested
    @DisplayName("extractExpiration")
    class ExtractExpiration {

        @Test
        @DisplayName("expiration is in the future for fresh token")
        void expirationInFuture() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            Date expiration = jwtService.extractExpiration(token);
            assertThat(expiration).isAfter(new Date());
        }
    }

    // ===========================
    // Redis blacklist
    // ===========================

    @Nested
    @DisplayName("invalidateToken")
    class InvalidateToken {

        @Test
        @DisplayName("writes token to Redis blacklist with remaining TTL")
        void writesToRedis() {
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            jwtService.invalidateToken(token);
            verify(valueOps).set(
                    startsWith("jwt:blacklist:"),
                    eq("1"),
                    anyLong(),
                    eq(TimeUnit.MILLISECONDS)
            );
        }

        @Test
        @DisplayName("does not throw when Redis is down — fail-open")
        void failsOpenWhenRedisDown() {
            when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("Redis down"));
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThatCode(() -> jwtService.invalidateToken(token)).doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("isBlacklisted")
    class IsBlacklisted {

        @Test
        @DisplayName("returns true when token is in Redis blacklist")
        void returnsTrueWhenBlacklisted() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            when(redisTemplate.hasKey("jwt:blacklist:" + token)).thenReturn(true);
            assertThat(jwtService.isBlacklisted(token)).isTrue();
        }

        @Test
        @DisplayName("returns false when token is not blacklisted")
        void returnsFalseWhenNotBlacklisted() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            when(redisTemplate.hasKey("jwt:blacklist:" + token)).thenReturn(false);
            assertThat(jwtService.isBlacklisted(token)).isFalse();
        }

        @Test
        @DisplayName("returns false when Redis is down — fail-open prevents lockout")
        void failsOpenWhenRedisDown() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            when(redisTemplate.hasKey(anyString())).thenThrow(new RuntimeException("Redis down"));
            assertThat(jwtService.isBlacklisted(token)).isFalse();
        }
    }

    // ===========================
    // isKioskToken edge cases
    // ===========================

    @Nested
    @DisplayName("isKioskToken")
    class IsKioskToken {

        @Test
        @DisplayName("returns false for regular access token")
        void falseForRegularToken() {
            String token = jwtService.generateAccessToken("user-1", "STAFF", "store-1");
            assertThat(jwtService.isKioskToken(token)).isFalse();
        }

        @Test
        @DisplayName("returns false for malformed token — no exception")
        void falseForMalformedToken() {
            assertThat(jwtService.isKioskToken("not.a.valid.jwt")).isFalse();
        }
    }
}
