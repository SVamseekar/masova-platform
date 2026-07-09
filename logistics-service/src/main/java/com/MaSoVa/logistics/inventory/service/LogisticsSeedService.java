package com.MaSoVa.logistics.inventory.service;

import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.repository.InventoryItemRepository;
import com.MaSoVa.logistics.inventory.repository.PurchaseOrderRepository;
import com.MaSoVa.logistics.inventory.repository.SupplierRepository;
import com.MaSoVa.logistics.inventory.repository.WasteRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dev/demo seed for logistics: suppliers, inventory, POs, waste, delivery tracking.
 * Active only when spring profiles include {@code dev} or {@code demo}.
 */
@Service
public class LogisticsSeedService {

    private static final Logger log = LoggerFactory.getLogger(LogisticsSeedService.class);

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final WasteRecordRepository wasteRecordRepository;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final Environment environment;

    public LogisticsSeedService(SupplierRepository supplierRepository,
                                InventoryItemRepository inventoryItemRepository,
                                PurchaseOrderRepository purchaseOrderRepository,
                                WasteRecordRepository wasteRecordRepository,
                                DeliveryTrackingRepository deliveryTrackingRepository,
                                Environment environment) {
        this.supplierRepository = supplierRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.wasteRecordRepository = wasteRecordRepository;
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    public Map<String, Object> seedDemo(String storeId, String driverId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Logistics seed is only available under dev/demo profiles");
        }
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }
        String driver = (driverId == null || driverId.isBlank()) ? "seed-driver" : driverId;

        Map<String, Object> suppliers = seedSuppliers();
        @SuppressWarnings("unchecked")
        List<String> supplierIds = (List<String>) suppliers.get("supplierIds");
        String primarySupplierId = supplierIds != null && !supplierIds.isEmpty()
                ? supplierIds.get(0) : null;

        Map<String, Object> inventory = seedInventory(storeId, primarySupplierId);
        @SuppressWarnings("unchecked")
        List<String> inventoryIds = (List<String>) inventory.get("itemIds");
        String firstItemId = inventoryIds != null && !inventoryIds.isEmpty()
                ? inventoryIds.get(0) : null;

        Map<String, Object> pos = seedPurchaseOrders(storeId, primarySupplierId, firstItemId, suppliers);
        Map<String, Object> waste = seedWaste(storeId, firstItemId);
        Map<String, Object> delivery = seedDeliveryTracking(storeId, driver);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("storeId", storeId);
        result.put("suppliers", suppliers);
        result.put("inventory", inventory);
        result.put("purchaseOrders", pos);
        result.put("waste", waste);
        result.put("delivery", delivery);
        result.put("message", "Logistics seed complete (idempotent)");
        log.info("Logistics seed-demo storeId={} suppliers={} inventory={}",
                storeId, suppliers.get("total"), inventory.get("totalForStore"));
        return result;
    }

    private Map<String, Object> seedSuppliers() {
        List<SupplierSpec> specs = List.of(
                new SupplierSpec("SEED-SUP-MOZZ", "Berlin Molkerei GmbH", "Hans Mueller",
                        "+493012345601", "mozzarella@molkerei.example.de", List.of("DAIRY", "CHEESE")),
                new SupplierSpec("SEED-SUP-FLOUR", "Mühlenwerke Brandenburg", "Greta Schmidt",
                        "+493012345602", "flour@muehlen.example.de", List.of("DRY_GOODS", "FLOUR")),
                new SupplierSpec("SEED-SUP-VEG", "Frische Markt Berlin", "Lukas Weber",
                        "+493012345603", "veg@frische.example.de", List.of("PRODUCE", "VEGETABLES")),
                new SupplierSpec("SEED-SUP-MEAT", "Metzgerei Kreuzberg", "Thomas Becker",
                        "+493012345604", "meat@metzgerei.example.de", List.of("MEAT", "PROTEIN")),
                new SupplierSpec("SEED-SUP-BEV", "Getränke Express DE", "Sophie Klein",
                        "+493012345605", "bev@getraenke.example.de", List.of("BEVERAGE", "SOFT_DRINKS"))
        );

        List<String> ids = new ArrayList<>();
        int created = 0;
        for (SupplierSpec spec : specs) {
            Optional<Supplier> existing = supplierRepository.findBySupplierCode(spec.code());
            if (existing.isPresent()) {
                Supplier s = existing.get();
                s.setSupplierName(spec.name());
                s.setContactPerson(spec.contact());
                s.setPhoneNumber(spec.phone());
                s.setEmail(spec.email());
                s.setStatus("ACTIVE");
                s.setCategoriesSupplied(new ArrayList<>(spec.categories()));
                s.setCity("Berlin");
                s.setCountry("DE");
                s.setIsPreferred(true);
                Supplier saved = supplierRepository.save(s);
                ids.add(saved.getId());
                continue;
            }
            Supplier s = new Supplier();
            s.setSupplierCode(spec.code());
            s.setSupplierName(spec.name());
            s.setContactPerson(spec.contact());
            s.setPhoneNumber(spec.phone());
            s.setEmail(spec.email());
            s.setStatus("ACTIVE");
            s.setCategoriesSupplied(new ArrayList<>(spec.categories()));
            s.setAddressLine1("Supplier Str. 10");
            s.setCity("Berlin");
            s.setState("Berlin");
            s.setPincode("10115");
            s.setCountry("DE");
            s.setBusinessType("DISTRIBUTOR");
            s.setPaymentTerms("NET_30");
            s.setCreditDays(30);
            s.setCreditLimit(new BigDecimal("5000.00"));
            s.setIsPreferred(true);
            s.setAverageLeadTimeDays(3);
            s.setQualityRating(4.8);
            s.setCreatedBy("seed");
            s.setCreatedAt(LocalDateTime.now());
            s.setUpdatedAt(LocalDateTime.now());
            Supplier saved = supplierRepository.save(s);
            ids.add(saved.getId());
            created++;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("supplierIds", ids);
        out.put("createdCount", created);
        out.put("total", ids.size());
        return out;
    }

    private Map<String, Object> seedInventory(String storeId, String primarySupplierId) {
        List<InvSpec> specs = List.of(
                new InvSpec("SEED-INV-MOZZ", "Mozzarella Fior di Latte", "DAIRY", "kg", 25.0, 5.0, 50.0, 4.50),
                new InvSpec("SEED-INV-FLOUR", "Tipo 00 Flour", "DRY_GOODS", "kg", 40.0, 10.0, 80.0, 1.20),
                new InvSpec("SEED-INV-TOMATO", "San Marzano Tomatoes", "PRODUCE", "kg", 18.0, 4.0, 30.0, 2.80),
                new InvSpec("SEED-INV-PEPP", "Pepperoni", "MEAT", "kg", 8.0, 2.0, 15.0, 9.50),
                new InvSpec("SEED-INV-OIL", "Extra Virgin Olive Oil", "DRY_GOODS", "liters", 12.0, 3.0, 20.0, 6.00),
                new InvSpec("SEED-INV-BOX", "Pizza Boxes 32cm", "PACKAGING", "pieces", 200.0, 50.0, 500.0, 0.35),
                new InvSpec("SEED-INV-COLA", "Cola 0.33L cans", "BEVERAGE", "pieces", 96.0, 24.0, 200.0, 0.55),
                new InvSpec("SEED-INV-BASIL", "Fresh Basil", "PRODUCE", "bunches", 3.0, 5.0, 20.0, 1.10)
        );

        List<String> ids = new ArrayList<>();
        int created = 0;
        for (InvSpec spec : specs) {
            Optional<InventoryItem> existing =
                    inventoryItemRepository.findByStoreIdAndItemCode(storeId, spec.code());
            InventoryItem item = existing.orElseGet(InventoryItem::new);
            boolean isNew = existing.isEmpty();
            item.setStoreId(storeId);
            item.setItemCode(spec.code());
            item.setItemName(spec.name());
            item.setCategory(spec.category());
            item.setUnit(spec.unit());
            item.setCurrentStock(spec.stock());
            item.setMinimumStock(spec.min());
            item.setMaximumStock(spec.max());
            item.setReorderQuantity(spec.min() * 2);
            item.setUnitCost(BigDecimal.valueOf(spec.unitCost()));
            item.setAverageCost(BigDecimal.valueOf(spec.unitCost()));
            item.setLastPurchaseCost(BigDecimal.valueOf(spec.unitCost()));
            item.setPrimarySupplierId(primarySupplierId);
            item.setStatus(spec.stock() <= spec.min() ? "LOW_STOCK" : "AVAILABLE");
            item.setIsPerishable(List.of("DAIRY", "PRODUCE", "MEAT").contains(spec.category()));
            item.setAutoReorder(true);
            item.setDescription("Seed inventory item");
            item.setStorageLocation("Walk-in");
            item.setLastUpdatedBy("seed");
            if (item.getCreatedAt() == null) {
                item.setCreatedAt(LocalDateTime.now());
            }
            item.setUpdatedAt(LocalDateTime.now());
            InventoryItem saved = inventoryItemRepository.save(item);
            ids.add(saved.getId());
            if (isNew) {
                created++;
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("itemIds", ids);
        out.put("createdCount", created);
        out.put("totalForStore", inventoryItemRepository.findByStoreId(storeId).size());
        return out;
    }

    private Map<String, Object> seedPurchaseOrders(String storeId, String supplierId,
                                                   String inventoryItemId, Map<String, Object> suppliers) {
        String poNumber = "SEED-PO-DOM001-001";
        Optional<PurchaseOrder> existing = purchaseOrderRepository.findByOrderNumber(poNumber);
        List<String> ids = new ArrayList<>();
        int created = 0;

        PurchaseOrder po = existing.orElseGet(PurchaseOrder::new);
        boolean isNew = existing.isEmpty();
        po.setOrderNumber(poNumber);
        po.setStoreId(storeId);
        po.setSupplierId(supplierId);
        po.setSupplierName("Berlin Molkerei GmbH");
        po.setStatus("APPROVED");
        po.setPaymentStatus("PENDING");
        po.setOrderDate(LocalDate.now().minusDays(2));
        po.setExpectedDeliveryDate(LocalDate.now().plusDays(1));
        po.setRequestedBy("seed");
        po.setApprovedBy("seed-manager");
        po.setApprovedAt(LocalDateTime.now().minusDays(1));
        po.setNotes("seed:SEED-PO-DOM001-001");
        po.setAutoGenerated(false);

        PurchaseOrder.PurchaseOrderItem line = new PurchaseOrder.PurchaseOrderItem();
        line.setInventoryItemId(inventoryItemId);
        line.setItemName("Mozzarella Fior di Latte");
        line.setItemCode("SEED-INV-MOZZ");
        line.setQuantity(20.0);
        line.setUnit("kg");
        line.setUnitPrice(new BigDecimal("4.50"));
        line.setTotalPrice(new BigDecimal("90.00"));
        po.setItems(List.of(line));
        po.setSubtotal(new BigDecimal("90.00"));
        po.setTaxAmount(new BigDecimal("6.30"));
        po.setTotalAmount(new BigDecimal("96.30"));
        if (po.getCreatedAt() == null) {
            po.setCreatedAt(LocalDateTime.now().minusDays(2));
        }
        po.setUpdatedAt(LocalDateTime.now());
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        ids.add(saved.getId());
        if (isNew) {
            created++;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("poIds", ids);
        out.put("createdCount", created);
        out.put("total", ids.size());
        return out;
    }

    private Map<String, Object> seedWaste(String storeId, String inventoryItemId) {
        String seedKey = "seed:waste-basil-spoiled";
        List<WasteRecord> existing = wasteRecordRepository.findByStoreId(storeId);
        Optional<WasteRecord> match = existing.stream()
                .filter(w -> w.getNotes() != null && w.getNotes().contains(seedKey))
                .findFirst();

        List<String> ids = new ArrayList<>();
        int created = 0;
        if (match.isPresent()) {
            ids.add(match.get().getId());
        } else {
            WasteRecord w = new WasteRecord();
            w.setStoreId(storeId);
            w.setInventoryItemId(inventoryItemId);
            w.setItemName("Fresh Basil");
            w.setItemCode("SEED-INV-BASIL");
            w.setQuantity(2.0);
            w.setUnit("bunches");
            w.setUnitCost(new BigDecimal("1.10"));
            w.setTotalCost(new BigDecimal("2.20"));
            w.setWasteCategory("SPOILED");
            w.setWasteReason("Left unrefrigerated after prep");
            w.setWasteDate(LocalDate.now().minusDays(1));
            w.setReportedBy("seed");
            w.setPreventable(true);
            w.setPreventionNotes("Return herbs to fridge immediately after portioning");
            w.setNotes(seedKey);
            w.setCreatedAt(LocalDateTime.now().minusDays(1));
            WasteRecord saved = wasteRecordRepository.save(w);
            ids.add(saved.getId());
            created++;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("wasteIds", ids);
        out.put("createdCount", created);
        out.put("totalForStore", wasteRecordRepository.findByStoreId(storeId).size());
        return out;
    }

    private Map<String, Object> seedDeliveryTracking(String storeId, String driverId) {
        // Align with commerce seed order numbers that are DELIVERY terminal / in-flight
        List<DeliverySpec> specs = List.of(
                new DeliverySpec("SEED-ORD-OFD-1", "IN_TRANSIT"),
                new DeliverySpec("SEED-ORD-DLVR-1", "DELIVERED"),
                new DeliverySpec("SEED-ORD-DLVR-2", "DELIVERED"),
                new DeliverySpec("SEED-ORD-DISP-1", "ASSIGNED")
        );

        List<String> ids = new ArrayList<>();
        int created = 0;
        int updated = 0;
        LocalDateTime now = LocalDateTime.now();

        for (DeliverySpec spec : specs) {
            Optional<DeliveryTracking> existing = deliveryTrackingRepository.findByOrderId(spec.orderId());
            DeliveryTracking t = existing.orElseGet(DeliveryTracking::new);
            boolean isNew = existing.isEmpty();

            t.setOrderId(spec.orderId());
            t.setStoreId(storeId);
            t.setDriverId(driverId);
            t.setDriverName("Driver Berlin");
            t.setDriverPhone("+491511000005");
            t.setStatus(spec.status());
            t.setDispatchMethod("MANUAL");
            t.setPriorityLevel("MEDIUM");
            t.setDistanceKm(new BigDecimal("3.2"));
            t.setEstimatedDeliveryMinutes(25);
            t.setAssignedAt(now.minusHours(2));
            if ("IN_TRANSIT".equals(spec.status()) || "DELIVERED".equals(spec.status())) {
                t.setAcceptedAt(now.minusHours(1).minusMinutes(45));
                t.setPickedUpAt(now.minusHours(1).minusMinutes(30));
            }
            if ("DELIVERED".equals(spec.status())) {
                t.setDeliveredAt(now.minusHours(1));
                t.setActualDeliveryMinutes(22);
                t.setOnTime(true);
                t.setCustomerRating(5);
            }

            DeliveryTracking.DeliveryAddress pickup = new DeliveryTracking.DeliveryAddress();
            pickup.setStreet("Demo Street 1");
            pickup.setCity("Berlin");
            pickup.setState("Berlin");
            pickup.setZipCode("10115");
            pickup.setLatitude(52.5200);
            pickup.setLongitude(13.4050);
            t.setPickupAddress(pickup);

            DeliveryTracking.DeliveryAddress drop = new DeliveryTracking.DeliveryAddress();
            drop.setStreet("Alexanderplatz 1");
            drop.setCity("Berlin");
            drop.setState("Berlin");
            drop.setZipCode("10178");
            drop.setLatitude(52.5219);
            drop.setLongitude(13.4132);
            t.setDeliveryAddress(drop);

            if (t.getCreatedAt() == null) {
                t.setCreatedAt(now.minusHours(2));
            }
            t.setUpdatedAt(now);

            DeliveryTracking saved = deliveryTrackingRepository.save(t);
            ids.add(saved.getId());
            if (isNew) {
                created++;
            } else {
                updated++;
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("trackingIds", ids);
        out.put("createdCount", created);
        out.put("updatedCount", updated);
        out.put("totalSeedTrackings", ids.size());
        out.put("driverId", driverId);
        return out;
    }

    private record SupplierSpec(
            String code, String name, String contact, String phone, String email, List<String> categories) {}

    private record InvSpec(
            String code, String name, String category, String unit,
            double stock, double min, double max, double unitCost) {}

    private record DeliverySpec(String orderId, String status) {}
}
