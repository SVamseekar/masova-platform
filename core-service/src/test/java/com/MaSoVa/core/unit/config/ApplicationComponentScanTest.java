package com.MaSoVa.core.unit.config;

import com.MaSoVa.core.CoreServiceApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.TypeExcludeFilter;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.annotation.AnnotatedElementUtils;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A bare @ComponentScan on the application class replaces the one inside
 * @SpringBootApplication and drops TypeExcludeFilter. Test @Configuration
 * classes then leak into @SpringBootTest contexts.
 */
class ApplicationComponentScanTest {

    @Test
    void scanKeepsTypeExcludeFilter() {
        ComponentScan scan = AnnotatedElementUtils.findMergedAnnotation(
                CoreServiceApplication.class, ComponentScan.class);

        assertThat(scan).isNotNull();
        assertThat(scan.basePackages()).containsExactlyInAnyOrder("com.MaSoVa.core", "com.MaSoVa.shared");
        assertThat(Arrays.stream(scan.excludeFilters()).flatMap(f -> Arrays.stream(f.classes())))
                .contains(TypeExcludeFilter.class);
    }
}
