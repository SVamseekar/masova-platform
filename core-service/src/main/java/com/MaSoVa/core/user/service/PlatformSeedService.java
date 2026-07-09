package com.MaSoVa.core.user.service;

import com.MaSoVa.core.customer.entity.Customer;
import com.MaSoVa.core.customer.repository.CustomerRepository;
import com.MaSoVa.core.notification.entity.Campaign;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.repository.CampaignRepository;
import com.MaSoVa.core.user.entity.UserEntity;
import com.MaSoVa.core.user.repository.StoreRepository;
import com.MaSoVa.core.user.repository.UserJpaRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.model.Address;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dev/demo platform seed for core-service: Berlin stores, staff/customers, campaigns.
 * Active only when spring profiles include {@code dev} or {@code demo}.
 * Idempotent: upsert by store code / email / campaign name.
 */
@Service
public class PlatformSeedService {

    private static final Logger log = LoggerFactory.getLogger(PlatformSeedService.class);
    private static final String DEMO_PASSWORD = "Demo@1234";
    private static final String STORE_CODE = "DOM001";
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final StoreRepository storeRepository;
    private final StoreService storeService;
    private final UserRepository userRepository;
    private final UserJpaRepository userJpaRepository;
    private final CustomerRepository customerRepository;
    private final CampaignRepository campaignRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public PlatformSeedService(StoreRepository storeRepository,
                               StoreService storeService,
                               UserRepository userRepository,
                               UserJpaRepository userJpaRepository,
                               CustomerRepository customerRepository,
                               CampaignRepository campaignRepository,
                               PasswordEncoder passwordEncoder,
                               Environment environment) {
        this.storeRepository = storeRepository;
        this.storeService = storeService;
        this.userRepository = userRepository;
        this.userJpaRepository = userJpaRepository;
        this.customerRepository = customerRepository;
        this.campaignRepository = campaignRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Full core seed: Berlin stores + demo staff/customers + sample campaigns.
     * Safe to re-run: no duplicate-key explosions; password reset to Demo@1234 for known emails.
     */
    public Map<String, Object> seedDemo(String storeId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Platform seed is only available under dev/demo profiles");
        }
        String code = (storeId == null || storeId.isBlank()) ? STORE_CODE : storeId.trim();

        Map<String, Object> stores = seedStores();
        Map<String, String> userIds = seedUsers(code);
        Map<String, Object> customers = seedCustomers(code, userIds);
        Map<String, Object> campaigns = seedCampaigns(code, userIds.get("manager.berlin@gmail.com"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("storeId", code);
        result.put("stores", stores);
        result.put("userIds", userIds);
        result.put("customers", customers);
        result.put("campaigns", campaigns);
        result.put("password", DEMO_PASSWORD);
        result.put("message", "Core platform seed complete (idempotent)");
        log.info("Platform seed-demo storeId={} users={} customers={}",
                code, userIds.size(), customers.get("createdCount"));
        return result;
    }

    private Map<String, Object> seedStores() {
        List<String> created = new ArrayList<>();
        List<String> updated = new ArrayList<>();

        upsertBerlinStore("DOM001", "MaSoVa Berlin Mitte", "Berlin", "10115",
                52.5200, 13.4050, "03012345670", created, updated);
        upsertBerlinStore("DOM002", "MaSoVa Berlin Prenzlauer Berg", "Berlin", "10405",
                52.5388, 13.4244, "03012345671", created, updated);
        upsertBerlinStore("DOM003", "MaSoVa Berlin Kreuzberg", "Berlin", "10999",
                52.4980, 13.4030, "03012345672", created, updated);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("created", created);
        out.put("updated", updated);
        out.put("codes", List.of("DOM001", "DOM002", "DOM003"));
        return out;
    }

    private void upsertBerlinStore(String code, String name, String city, String pincode,
                                   double lat, double lng, String phone,
                                   List<String> created, List<String> updated) {
        Optional<Store> existing = storeRepository.findByCode(code);
        if (existing.isPresent()) {
            Store s = existing.get();
            // Ensure EU fields for payment routing (DE → Stripe)
            if (s.getCountryCode() == null || s.getCountryCode().isBlank()) {
                s.setCountryCode("DE");
            }
            if (s.getCurrency() == null || s.getCurrency().isBlank()) {
                s.setCurrency("EUR");
            }
            if (s.getLocale() == null || s.getLocale().isBlank()) {
                s.setLocale("de-DE");
            }
            if (s.getStatus() == null) {
                s.setStatus(StoreStatus.ACTIVE);
            }
            storeService.saveStore(s);
            updated.add(code);
            return;
        }

        Store store = new Store();
        store.setName(name);
        store.setCode(code);
        store.setPhoneNumber(phone);
        store.setRegionId("EU-DE");
        store.setStatus(StoreStatus.ACTIVE);
        store.setOpeningDate(LocalDateTime.now().minusYears(1));
        store.setCountryCode("DE");
        store.setCurrency("EUR");
        store.setLocale("de-DE");

        Address address = new Address();
        address.setStreet("Demo Street 1");
        address.setCity(city);
        address.setState("Berlin");
        address.setPincode(pincode);
        address.setLatitude(lat);
        address.setLongitude(lng);
        store.setAddress(address);

        Store.StoreConfiguration config = new Store.StoreConfiguration();
        config.setDeliveryRadiusKm(5.0);
        config.setMaxConcurrentOrders(50);
        config.setEstimatedPrepTimeMinutes(25);
        config.setAcceptsOnlineOrders(true);
        config.setAcceptsCashPayments(true);
        config.setMaxDeliveryTimeMinutes(35);
        config.setMinimumOrderValueINR(9.0);
        store.setConfiguration(config);

        storeService.saveStore(store);
        created.add(code);
    }

    private Map<String, String> seedUsers(String storeCode) {
        Map<String, String> ids = new LinkedHashMap<>();
        // Staff (phones satisfy Indian-format entity validation used historically)
        ids.put("manager.berlin@gmail.com",
                upsertUser("Manager Berlin", "manager.berlin@gmail.com", "9876543201",
                        UserType.MANAGER, storeCode, "MANAGER", null, null));
        ids.put("assistant.berlin@gmail.com",
                upsertUser("Assistant Berlin", "assistant.berlin@gmail.com", "9876543202",
                        UserType.ASSISTANT_MANAGER, storeCode, "ASSISTANT_MANAGER", null, null));
        ids.put("kitchen.berlin@gmail.com",
                upsertUser("Kitchen Berlin", "kitchen.berlin@gmail.com", "9876543203",
                        UserType.STAFF, storeCode, "KITCHEN", null, null));
        ids.put("cashier.berlin@gmail.com",
                upsertUser("Cashier Berlin", "cashier.berlin@gmail.com", "9876543204",
                        UserType.STAFF, storeCode, "CASHIER", null, null));
        ids.put("driver.berlin@gmail.com",
                upsertUser("Driver Berlin", "driver.berlin@gmail.com", "9876543205",
                        UserType.DRIVER, storeCode, "DRIVER", "Scooter", "DE-B-SEED-001"));

        // Customers
        ids.put("anna.mueller@gmail.com",
                upsertUser("Anna Mueller", "anna.mueller@gmail.com", "9876543211",
                        UserType.CUSTOMER, null, null, null, null));
        ids.put("max.schmidt@gmail.com",
                upsertUser("Max Schmidt", "max.schmidt@gmail.com", "9876543212",
                        UserType.CUSTOMER, null, null, null, null));
        ids.put("lisa.weber@gmail.com",
                upsertUser("Lisa Weber", "lisa.weber@gmail.com", "9876543213",
                        UserType.CUSTOMER, null, null, null, null));
        ids.put("thomas.becker@gmail.com",
                upsertUser("Thomas Becker", "thomas.becker@gmail.com", "9876543214",
                        UserType.CUSTOMER, null, null, null, null));
        ids.put("sophie.klein@gmail.com",
                upsertUser("Sophie Klein", "sophie.klein@gmail.com", "9876543215",
                        UserType.CUSTOMER, null, null, null, null));
        return ids;
    }

    private String upsertUser(String name, String email, String phone, UserType type,
                              String storeId, String role, String vehicleType, String licenseNumber) {
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        Optional<User> existing = userRepository.findByPersonalInfoEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            u.setType(type);
            u.setActive(true);
            if (u.getPersonalInfo() == null) {
                u.setPersonalInfo(new User.PersonalInfo());
            }
            u.getPersonalInfo().setName(name);
            u.getPersonalInfo().setEmail(email);
            u.getPersonalInfo().setPhone(phone);
            u.getPersonalInfo().setPasswordHash(hash);
            if (type != UserType.CUSTOMER) {
                User.EmployeeDetails emp = u.getEmployeeDetails() != null
                        ? u.getEmployeeDetails() : new User.EmployeeDetails();
                emp.setStoreId(storeId);
                emp.setRole(role);
                emp.setStatus("AVAILABLE");
                if (vehicleType != null) {
                    emp.setVehicleType(vehicleType);
                }
                if (licenseNumber != null) {
                    emp.setLicenseNumber(licenseNumber);
                }
                u.setEmployeeDetails(emp);
            }
            User saved = userRepository.save(u);
            dualWriteUser(saved);
            return saved.getId();
        }

        User user = new User();
        user.setType(type);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        User.PersonalInfo pi = new User.PersonalInfo();
        pi.setName(name);
        pi.setEmail(email);
        pi.setPhone(phone);
        pi.setPasswordHash(hash);
        user.setPersonalInfo(pi);
        if (type != UserType.CUSTOMER) {
            User.EmployeeDetails emp = new User.EmployeeDetails();
            emp.setStoreId(storeId);
            emp.setRole(role);
            emp.setStatus("AVAILABLE");
            emp.setVehicleType(vehicleType);
            emp.setLicenseNumber(licenseNumber);
            emp.setActiveDeliveryCount(0);
            emp.setRating(5.0);
            user.setEmployeeDetails(emp);
        }
        User saved = userRepository.save(user);
        dualWriteUser(saved);
        return saved.getId();
    }

    private void dualWriteUser(User user) {
        try {
            Optional<UserEntity> pg = userJpaRepository.findByMongoId(user.getId());
            if (pg.isPresent()) {
                UserEntity entity = pg.get();
                if (user.getPersonalInfo() != null) {
                    entity.setName(user.getPersonalInfo().getName());
                    entity.setEmail(user.getPersonalInfo().getEmail());
                    entity.setPhone(user.getPersonalInfo().getPhone());
                    entity.setPasswordHash(user.getPersonalInfo().getPasswordHash());
                }
                entity.setUserType(user.getType() != null ? user.getType().name() : null);
                entity.setActive(user.isActive());
                if (user.getEmployeeDetails() != null) {
                    entity.setStoreId(user.getEmployeeDetails().getStoreId());
                    entity.setEmployeeRole(user.getEmployeeDetails().getRole());
                    entity.setEmployeeStatus(user.getEmployeeDetails().getStatus());
                }
                userJpaRepository.save(entity);
            } else {
                OffsetDateTime now = OffsetDateTime.now(IST);
                UserEntity.UserEntityBuilder builder = UserEntity.builder()
                        .mongoId(user.getId())
                        .userType(user.getType() != null ? user.getType().name() : null)
                        .isActive(user.isActive())
                        .createdAt(now)
                        .name(user.getPersonalInfo().getName())
                        .email(user.getPersonalInfo().getEmail())
                        .phone(user.getPersonalInfo().getPhone())
                        .passwordHash(user.getPersonalInfo().getPasswordHash());
                if (user.getEmployeeDetails() != null) {
                    builder.storeId(user.getEmployeeDetails().getStoreId())
                            .employeeRole(user.getEmployeeDetails().getRole())
                            .employeeStatus(user.getEmployeeDetails().getStatus());
                }
                userJpaRepository.save(builder.build());
            }
        } catch (Exception e) {
            log.warn("PG dual-write failed for seed user {}: {}", user.getId(), e.getMessage());
        }
    }

    private Map<String, Object> seedCustomers(String storeCode, Map<String, String> userIds) {
        List<String> customerEmails = List.of(
                "anna.mueller@gmail.com",
                "max.schmidt@gmail.com",
                "lisa.weber@gmail.com",
                "thomas.becker@gmail.com",
                "sophie.klein@gmail.com"
        );
        List<String> createdIds = new ArrayList<>();
        List<String> existingIds = new ArrayList<>();
        Map<String, String> emailToUserId = new LinkedHashMap<>();
        Map<String, String> emailToCustomerId = new LinkedHashMap<>();

        for (String email : customerEmails) {
            String userId = userIds.get(email);
            if (userId == null) {
                continue;
            }
            emailToUserId.put(email, userId);
            Optional<Customer> byUser = customerRepository.findByUserId(userId);
            if (byUser.isPresent()) {
                Customer c = byUser.get();
                c.addStoreId(storeCode);
                c.setActive(true);
                Customer saved = customerRepository.save(c);
                existingIds.add(saved.getId());
                emailToCustomerId.put(email, saved.getId());
                continue;
            }
            Optional<Customer> byEmail = customerRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                Customer c = byEmail.get();
                c.setUserId(userId);
                c.addStoreId(storeCode);
                c.setActive(true);
                Customer saved = customerRepository.save(c);
                existingIds.add(saved.getId());
                emailToCustomerId.put(email, saved.getId());
                continue;
            }

            Customer c = new Customer();
            c.setUserId(userId);
            c.setName(email.split("@")[0].replace('.', ' '));
            c.setEmail(email);
            c.setPhone(userRepository.findById(userId)
                    .map(u -> u.getPersonalInfo() != null ? u.getPersonalInfo().getPhone() : "9876543210")
                    .orElse("9876543210"));
            c.addStoreId(storeCode);
            c.setActive(true);
            c.setEmailVerified(true);
            Customer saved = customerRepository.save(c);
            createdIds.add(saved.getId());
            emailToCustomerId.put(email, saved.getId());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("createdIds", createdIds);
        out.put("existingIds", existingIds);
        out.put("createdCount", createdIds.size());
        out.put("total", createdIds.size() + existingIds.size());
        out.put("emailToUserId", emailToUserId);
        out.put("emailToCustomerId", emailToCustomerId);
        // Ownership invariant helper: primary customer userId for order seeding
        out.put("primaryCustomerUserId", userIds.get("anna.mueller@gmail.com"));
        return out;
    }

    private Map<String, Object> seedCampaigns(String storeCode, String managerUserId) {
        List<String> created = new ArrayList<>();
        List<String> existing = new ArrayList<>();

        List<CampaignSpec> specs = List.of(
                new CampaignSpec("SEED-Welcome Berlin", "Welcome offer for Berlin customers",
                        Campaign.CampaignStatus.DRAFT, Notification.NotificationChannel.IN_APP),
                new CampaignSpec("SEED-Weekend Pizza", "Weekend pizza promo — 15% off",
                        Campaign.CampaignStatus.SCHEDULED, Notification.NotificationChannel.EMAIL),
                new CampaignSpec("SEED-Loyalty Push", "Loyalty tier upgrade reminder",
                        Campaign.CampaignStatus.SENT, Notification.NotificationChannel.PUSH)
        );

        List<Campaign> storeCampaigns = campaignRepository.findByStoreId(storeCode);
        for (CampaignSpec spec : specs) {
            Optional<Campaign> match = storeCampaigns.stream()
                    .filter(c -> spec.name().equals(c.getName()))
                    .findFirst();
            if (match.isPresent()) {
                existing.add(match.get().getId());
                continue;
            }
            Campaign campaign = new Campaign();
            campaign.setStoreId(storeCode);
            campaign.setName(spec.name());
            campaign.setDescription(spec.description());
            campaign.setStatus(spec.status());
            campaign.setChannel(spec.channel());
            campaign.setSubject(spec.name());
            campaign.setMessage(spec.description());
            campaign.setCreatedBy(managerUserId != null ? managerUserId : "seed");
            campaign.setCreatedAt(LocalDateTime.now());
            campaign.setUpdatedAt(LocalDateTime.now());
            Campaign.CustomerSegment segment = new Campaign.CustomerSegment();
            segment.setType(Campaign.CustomerSegment.SegmentType.ALL_CUSTOMERS);
            campaign.setSegment(segment);
            if (spec.status() == Campaign.CampaignStatus.SCHEDULED) {
                campaign.setScheduledFor(LocalDateTime.now().plusDays(2));
            }
            if (spec.status() == Campaign.CampaignStatus.SENT) {
                campaign.setSent(25);
                campaign.setDelivered(24);
                campaign.setTotalRecipients(25);
                campaign.setSentAt(LocalDateTime.now().minusDays(3));
            }
            Campaign saved = campaignRepository.save(campaign);
            created.add(saved.getId());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("createdIds", created);
        out.put("existingIds", existing);
        out.put("createdCount", created.size());
        out.put("totalForStore", campaignRepository.findByStoreId(storeCode).size());
        return out;
    }

    private record CampaignSpec(
            String name,
            String description,
            Campaign.CampaignStatus status,
            Notification.NotificationChannel channel) {}
}
