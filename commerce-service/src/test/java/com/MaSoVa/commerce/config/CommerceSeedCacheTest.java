package com.MaSoVa.commerce.config;

import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.CommerceSeedService;
import com.MaSoVa.commerce.order.service.KitchenEquipmentSeedService;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CommerceSeedCacheTest {
    @Test
    void successfulMenuSeedInvalidatesPreviouslyCachedEmptyBrowse() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().setActiveProfiles("dev");
            context.register(TestConfig.class);
            context.refresh();
            var cache = context.getBean(CacheManager.class).getCache("menuItems");
            cache.put("store-DOM001", List.of());
            context.getBean(CommerceSeedService.class).seedMenuOnly("DOM001");
            assertThat(cache.get("store-DOM001")).isNull();
        }
    }

    @Configuration
    @EnableCaching
    static class TestConfig {
        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("menuItems");
        }

        @Bean
        CommerceSeedService seedService(Environment environment) {
            var menu = mock(MenuItemRepository.class);
            when(menu.findByStoreId("DOM001")).thenReturn(List.of());
            when(menu.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
            return new CommerceSeedService(menu, mock(OrderRepository.class),
                    mock(KitchenEquipmentSeedService.class), environment, mock(MongoTemplate.class));
        }
    }
}
