package com.MaSoVa.gateway.handler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.reactive.function.server.MockServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SystemInfoHandler")
class SystemInfoHandlerTest {

    private SystemInfoHandler handler;

    @BeforeEach
    void setUp() throws Exception {
        handler = new SystemInfoHandler();
        setField(handler, "applicationName", "MaSoVa API Gateway");
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Nested
    @DisplayName("GET /api/system/version")
    class GetVersion {

        @Test
        @DisplayName("Should return 200 OK with version information")
        void shouldReturnVersionInfo() {
            MockServerRequest request = MockServerRequest.builder().build();
            Mono<ServerResponse> response = handler.getVersion(request);

            StepVerifier.create(response)
                    .assertNext(serverResponse -> {
                        assertThat(serverResponse.statusCode().value()).isEqualTo(200);
                    })
                    .verifyComplete();
        }
    }

    @Nested
    @DisplayName("GET /api/system/health")
    class GetHealth {

        @Test
        @DisplayName("Should return 200 OK with health status UP")
        void shouldReturnHealthStatusUp() {
            MockServerRequest request = MockServerRequest.builder().build();
            Mono<ServerResponse> response = handler.getHealth(request);

            StepVerifier.create(response)
                    .assertNext(serverResponse -> {
                        assertThat(serverResponse.statusCode().value()).isEqualTo(200);
                    })
                    .verifyComplete();
        }
    }

    @Nested
    @DisplayName("GET /api/system/info")
    class GetInfo {

        @Test
        @DisplayName("Should return 200 OK with system information")
        void shouldReturnSystemInfo() {
            MockServerRequest request = MockServerRequest.builder().build();
            Mono<ServerResponse> response = handler.getInfo(request);

            StepVerifier.create(response)
                    .assertNext(serverResponse -> {
                        assertThat(serverResponse.statusCode().value()).isEqualTo(200);
                    })
                    .verifyComplete();
        }
    }

    // ---- DTO tests ----

    @Nested
    @DisplayName("VersionInfo DTO")
    class VersionInfoDto {

        @Test
        @DisplayName("Should populate all fields via constructor")
        void shouldPopulateFields_viaConstructor() {
            var now = java.time.LocalDateTime.now();
            SystemInfoHandler.VersionInfo info = new SystemInfoHandler.VersionInfo(
                    "2.1.0", now, "MaSoVa", "Production");

            assertThat(info.getVersion()).isEqualTo("2.1.0");
            assertThat(info.getBuildDate()).isEqualTo(now);
            assertThat(info.getApplicationName()).isEqualTo("MaSoVa");
            assertThat(info.getEnvironment()).isEqualTo("Production");
        }

        @Test
        @DisplayName("Should populate fields via setters")
        void shouldPopulateFields_viaSetters() {
            var now = java.time.LocalDateTime.now();
            SystemInfoHandler.VersionInfo info = new SystemInfoHandler.VersionInfo();
            info.setVersion("1.0.0");
            info.setBuildDate(now);
            info.setApplicationName("Test");
            info.setEnvironment("Dev");

            assertThat(info.getVersion()).isEqualTo("1.0.0");
            assertThat(info.getBuildDate()).isEqualTo(now);
            assertThat(info.getApplicationName()).isEqualTo("Test");
            assertThat(info.getEnvironment()).isEqualTo("Dev");
        }
    }

    @Nested
    @DisplayName("HealthStatus DTO")
    class HealthStatusDto {

        @Test
        @DisplayName("Should store and retrieve all health properties")
        void shouldStoreAllProperties() {
            var now = java.time.LocalDateTime.now();
            SystemInfoHandler.HealthStatus health = new SystemInfoHandler.HealthStatus();
            health.setStatus("UP");
            health.setTimestamp(now);
            health.setVersion("2.1.0");
            health.setComponents(java.util.Map.of("api-gateway", "UP"));

            assertThat(health.getStatus()).isEqualTo("UP");
            assertThat(health.getTimestamp()).isEqualTo(now);
            assertThat(health.getVersion()).isEqualTo("2.1.0");
            assertThat(health.getComponents()).containsEntry("api-gateway", "UP");
        }
    }

    @Nested
    @DisplayName("SystemInfo DTO")
    class SystemInfoDto {

        @Test
        @DisplayName("Should store and retrieve all system info properties")
        void shouldStoreAllProperties() {
            SystemInfoHandler.SystemInfo info = new SystemInfoHandler.SystemInfo();
            info.setVersion("2.1.0");
            info.setApplicationName("MaSoVa");
            info.setTotalMemory("512 MB");
            info.setFreeMemory("256 MB");
            info.setMaxMemory("1024 MB");
            info.setProcessors(4);
            info.setJavaVersion("21");
            info.setJavaVendor("Eclipse");

            assertThat(info.getVersion()).isEqualTo("2.1.0");
            assertThat(info.getApplicationName()).isEqualTo("MaSoVa");
            assertThat(info.getTotalMemory()).isEqualTo("512 MB");
            assertThat(info.getFreeMemory()).isEqualTo("256 MB");
            assertThat(info.getMaxMemory()).isEqualTo("1024 MB");
            assertThat(info.getProcessors()).isEqualTo(4);
            assertThat(info.getJavaVersion()).isEqualTo("21");
            assertThat(info.getJavaVendor()).isEqualTo("Eclipse");
        }
    }
}
