package com.MaSoVa.commerce.config;

import com.MaSoVa.shared.entity.MenuItem;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class MongoConfigMappingTest {
    @Test
    void auditingContextMapsMenuDatesWithoutReflectingIntoJdkTypes() throws Exception {
        var context = new MongoConfig().mongoMappingContext();
        context.afterPropertiesSet();
        assertThatCode(() -> context.getRequiredPersistentEntity(MenuItem.class))
                .doesNotThrowAnyException();
        assertThat(context.getRequiredPersistentEntity(MenuItem.class)
                .getRequiredPersistentProperty("createdAt").isEntity()).isFalse();
    }
}
