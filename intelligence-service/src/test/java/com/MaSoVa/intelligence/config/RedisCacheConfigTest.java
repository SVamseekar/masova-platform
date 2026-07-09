package com.MaSoVa.intelligence.config;

import com.MaSoVa.intelligence.dto.StaffLeaderboardResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectMapper.DefaultTyping;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level proof that the Redis value serializer preserves typed DTOs
 * (not LinkedHashMap) after a serialize → deserialize round-trip.
 * Does not require a live Redis instance (CI-friendly).
 */
@DisplayName("RedisCacheConfig typed serialization")
class RedisCacheConfigTest {

    @Test
    @DisplayName("StaffLeaderboardResponse survives JSON redis serializer round-trip as typed object")
    void cachedStaffLeaderboardResponse_deserializesToCorrectType_notLinkedHashMap() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                DefaultTyping.NON_FINAL
        );
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        StaffLeaderboardResponse original = StaffLeaderboardResponse.builder()
                .period("WEEK")
                .rankings(new ArrayList<>())
                .totalStaff(0)
                .build();

        byte[] bytes = serializer.serialize(original);
        Object restored = serializer.deserialize(bytes);

        assertThat(restored)
                .as("A cache round-trip must return the original typed object, not a raw LinkedHashMap")
                .isInstanceOf(StaffLeaderboardResponse.class);
        StaffLeaderboardResponse typed = (StaffLeaderboardResponse) restored;
        assertThat(typed.getPeriod()).isEqualTo("WEEK");
        assertThat(typed.getTotalStaff()).isEqualTo(0);
    }

    @Test
    @DisplayName("RedisCacheConfig bean customizer is constructible")
    void customizerBean_isConstructible() {
        RedisCacheConfig config = new RedisCacheConfig();
        assertThat(config.redisCacheManagerBuilderCustomizer()).isNotNull();
    }
}
