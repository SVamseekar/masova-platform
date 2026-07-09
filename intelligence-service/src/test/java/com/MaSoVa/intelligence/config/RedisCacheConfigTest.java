package com.MaSoVa.intelligence.config;

import com.MaSoVa.intelligence.dto.StaffLeaderboardResponse;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectMapper.DefaultTyping;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Unit-level proof that the Redis value serializer preserves typed DTOs
 * (not LinkedHashMap) after a serialize → deserialize round-trip.
 * Does not require a live Redis instance (CI-friendly).
 */
@DisplayName("RedisCacheConfig typed serialization")
class RedisCacheConfigTest {

    private static GenericJackson2JsonRedisSerializer typedSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Test
    @DisplayName("StaffLeaderboardResponse survives JSON redis serializer round-trip as typed object")
    void cachedStaffLeaderboardResponse_deserializesToCorrectType_notLinkedHashMap() {
        GenericJackson2JsonRedisSerializer serializer = typedSerializer();

        StaffLeaderboardResponse original = StaffLeaderboardResponse.builder()
                .period("WEEK")
                .rankings(new ArrayList<>())
                .totalStaff(0)
                .build();

        byte[] bytes = serializer.serialize(original);
        String json = new String(bytes);
        assertThat(json)
                .as("typed JSON must embed Java type metadata")
                .contains("StaffLeaderboardResponse");

        Object restored = serializer.deserialize(bytes);

        assertThat(restored)
                .as("A cache round-trip must return the original typed object, not a raw LinkedHashMap")
                .isInstanceOf(StaffLeaderboardResponse.class)
                .isNotInstanceOf(LinkedHashMap.class);
        StaffLeaderboardResponse typed = (StaffLeaderboardResponse) restored;
        assertThat(typed.getPeriod()).isEqualTo("WEEK");
        assertThat(typed.getTotalStaff()).isEqualTo(0);
    }

    @Test
    @DisplayName("RedisCacheManager bean is constructible with connection factory")
    void cacheManagerBean_isConstructible() {
        RedisCacheConfig config = new RedisCacheConfig();
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        assertThat(config.cacheManager(factory)).isNotNull();
    }
}
