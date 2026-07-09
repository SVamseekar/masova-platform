package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.customer.repository.CustomerRepository;
import com.MaSoVa.core.notification.repository.CampaignRepository;
import com.MaSoVa.core.user.repository.StoreRepository;
import com.MaSoVa.core.user.repository.UserJpaRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.service.PlatformSeedService;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("PlatformSeedService (Phase E)")
class PlatformSeedServiceTest {

    @Mock StoreRepository storeRepository;
    @Mock StoreService storeService;
    @Mock UserRepository userRepository;
    @Mock UserJpaRepository userJpaRepository;
    @Mock CustomerRepository customerRepository;
    @Mock CampaignRepository campaignRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock Environment environment;

    PlatformSeedService service;

    @BeforeEach
    void setUp() {
        service = new PlatformSeedService(
                storeRepository, storeService, userRepository, userJpaRepository,
                customerRepository, campaignRepository, passwordEncoder, environment);
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(true);
        when(passwordEncoder.encode(any())).thenReturn("hash");
        when(storeRepository.findByCode(any())).thenReturn(Optional.empty());
        when(storeService.saveStore(any())).thenAnswer(inv -> {
            Store s = inv.getArgument(0);
            if (s.getId() == null) s.setId("store-" + s.getCode());
            return s;
        });
        when(userRepository.findByPersonalInfoEmail(any())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u != null && u.getId() == null && u.getPersonalInfo() != null) {
                u.setId("uid-" + Math.abs(u.getPersonalInfo().getEmail().hashCode()));
            }
            return u;
        });
        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(customerRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(customerRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(customerRepository.save(any())).thenAnswer(inv -> {
            com.MaSoVa.core.customer.entity.Customer c = inv.getArgument(0);
            if (c != null && c.getId() == null) {
                c.setId("cust-" + Math.abs((c.getEmail() != null ? c.getEmail() : "x").hashCode()));
            }
            return c;
        });
        when(campaignRepository.findByStoreId(any())).thenReturn(Collections.emptyList());
        when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());
        when(userJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("isSeedAllowed false outside dev/demo")
    void seedBlockedOutsideDev() {
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(false);
        assertThat(service.isSeedAllowed()).isFalse();
        assertThatThrownBy(() -> service.seedDemo("DOM001"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("seedDemo creates Berlin store with DE country and manager user")
    void seedDemoCreatesBerlinAndUsers() {
        Map<String, Object> result = service.seedDemo("DOM001");

        assertThat(result.get("storeId")).isEqualTo("DOM001");
        assertThat(result.get("password")).isEqualTo("Demo@1234");
        @SuppressWarnings("unchecked")
        Map<String, String> userIds = (Map<String, String>) result.get("userIds");
        assertThat(userIds).containsKey("manager.berlin@gmail.com");
        assertThat(userIds).containsKey("anna.mueller@gmail.com");
        assertThat(userIds).containsKey("driver.berlin@gmail.com");

        ArgumentCaptor<Store> storeCap = ArgumentCaptor.forClass(Store.class);
        verify(storeService, atLeastOnce()).saveStore(storeCap.capture());
        Store berlin = storeCap.getAllValues().stream()
                .filter(s -> "DOM001".equals(s.getCode()))
                .findFirst()
                .orElseThrow();
        assertThat(berlin.getCountryCode()).isEqualTo("DE");
        assertThat(berlin.getCurrency()).isEqualTo("EUR");

        ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(userCap.capture());
        User manager = userCap.getAllValues().stream()
                .filter(u -> u.getPersonalInfo() != null
                        && "manager.berlin@gmail.com".equals(u.getPersonalInfo().getEmail()))
                .findFirst()
                .orElseThrow();
        assertThat(manager.getType()).isEqualTo(UserType.MANAGER);
        assertThat(manager.getEmployeeDetails().getStoreId()).isEqualTo("DOM001");
    }

    @Test
    @DisplayName("second seed with existing email updates password hash (idempotent)")
    void idempotentUserUpsert() {
        User existing = new User();
        existing.setId("existing-mgr");
        existing.setType(UserType.MANAGER);
        User.PersonalInfo pi = new User.PersonalInfo();
        pi.setEmail("manager.berlin@gmail.com");
        pi.setName("Old");
        pi.setPhone("9876543201");
        pi.setPasswordHash("old-hash");
        existing.setPersonalInfo(pi);
        User.EmployeeDetails emp = new User.EmployeeDetails();
        emp.setStoreId("DOM001");
        emp.setRole("MANAGER");
        existing.setEmployeeDetails(emp);

        when(userRepository.findByPersonalInfoEmail(anyString())).thenAnswer(inv -> {
            String email = inv.getArgument(0);
            if ("manager.berlin@gmail.com".equals(email)) {
                return Optional.of(existing);
            }
            return Optional.empty();
        });

        Map<String, Object> result = service.seedDemo("DOM001");
        @SuppressWarnings("unchecked")
        Map<String, String> userIds = (Map<String, String>) result.get("userIds");
        assertThat(userIds.get("manager.berlin@gmail.com")).isEqualTo("existing-mgr");
        verify(passwordEncoder, atLeastOnce()).encode("Demo@1234");
    }
}
