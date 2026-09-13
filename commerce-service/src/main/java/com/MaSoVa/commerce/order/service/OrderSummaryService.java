package com.MaSoVa.commerce.order.service;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.FacetOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Store-level KPI / chart aggregates computed in MongoDB.
 * Cards and charts must call this instead of downloading order documents.
 */
@Service
public class OrderSummaryService {

    private static final Logger log = LoggerFactory.getLogger(OrderSummaryService.class);
    static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Berlin");
    private static final List<String> SALE_STATUSES = List.of("COMPLETED", "DELIVERED", "SERVED");
    private static final List<String> TERMINAL_STATUSES = List.of("COMPLETED", "DELIVERED", "SERVED", "CANCELLED");
    private static final int MAX_DAYS = 180;
    private static final int DEFAULT_DAYS = 30;

    private final MongoTemplate mongoTemplate;

    public OrderSummaryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public Map<String, Object> summarizeStore(String storeId, Integer daysParam) {
        int days = daysParam == null ? DEFAULT_DAYS : Math.max(1, Math.min(daysParam, MAX_DAYS));
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate rangeStartDate = today.minusDays(days - 1L);
        LocalDateTime startUtc = toUtcStart(rangeStartDate);
        LocalDateTime endUtc = toUtcEnd(today);

        AggregationOperation matchRange = Aggregation.match(
                Criteria.where("storeId").is(storeId)
                        .and("createdAt").gte(startUtc).lte(endUtc));

        AggregationOperation addKeys = context -> new Document("$addFields", new Document()
                .append("dayKey", dateToString("%Y-%m-%d"))
                .append("hourKey", dateToString("%H")));

        FacetOperation facet = Aggregation.facet(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)),
                        addKeys,
                        Aggregation.group("dayKey")
                                .sum("total").as("sales")
                                .count().as("orderCount"))
                .as("byDay")
                .and(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)),
                        addKeys,
                        Aggregation.group("hourKey")
                                .sum("total").as("sales")
                                .count().as("orderCount"))
                .as("byHour")
                .and(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)),
                        Aggregation.group("orderType")
                                .sum("total").as("sales")
                                .count().as("orderCount"))
                .as("byType")
                .and(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)),
                        Aggregation.group("orderSource")
                                .sum("total").as("sales")
                                .sum("aggregatorCommission").as("commission")
                                .sum("aggregatorNetPayout").as("netPayout")
                                .count().as("orderCount"))
                .as("bySource")
                .and(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)),
                        Aggregation.unwind("items"),
                        Aggregation.group("items.menuItemId")
                                .first("items.name").as("itemName")
                                .sum("items.quantity").as("quantitySold")
                                .sum(org.springframework.data.mongodb.core.aggregation.ArithmeticOperators.Multiply
                                        .valueOf("items.price").multiplyBy("items.quantity")).as("revenue"),
                        Aggregation.sort(Sort.Direction.DESC, "revenue"),
                        Aggregation.limit(10))
                .as("topProducts")
                .and(
                        Aggregation.match(Criteria.where("status").in(SALE_STATUSES)
                                .and("createdByStaffId").exists(true).nin(List.of("", null))),
                        Aggregation.group("createdByStaffId")
                                .first("createdByStaffName").as("staffName")
                                .sum("total").as("salesGenerated")
                                .count().as("ordersProcessed"),
                        Aggregation.sort(Sort.Direction.DESC, "salesGenerated"),
                        Aggregation.limit(12))
                .as("staff")
                .and(
                        Aggregation.match(Criteria.where("status").nin(TERMINAL_STATUSES)),
                        Aggregation.count().as("count"))
                .as("live")
                .and(
                        Aggregation.match(Criteria.where("paymentStatus").is("PENDING")
                                .and("status").ne("CANCELLED")),
                        Aggregation.count().as("count"))
                .as("pendingPayments");

        Document raw = mongoTemplate.aggregate(
                Aggregation.newAggregation(matchRange, facet),
                "orders",
                Document.class).getUniqueMappedResult();

        if (raw == null) {
            raw = new Document();
        }

        List<Map<String, Object>> byDay = mapBucketList(raw.get("byDay"), "date");
        fillMissingDays(byDay, rangeStartDate, today);

        double todaySales = 0;
        int todayOrders = 0;
        double weekSales = 0;
        int weekOrders = 0;
        double rangeSales = 0;
        int rangeOrders = 0;
        LocalDate weekStart = today.minusDays(6);
        for (Map<String, Object> row : byDay) {
            String date = String.valueOf(row.get("date"));
            double sales = toDouble(row.get("sales"));
            int count = toInt(row.get("orderCount"));
            rangeSales += sales;
            rangeOrders += count;
            if (today.toString().equals(date)) {
                todaySales = sales;
                todayOrders = count;
            }
            LocalDate parsed;
            try {
                parsed = LocalDate.parse(date);
            } catch (Exception e) {
                continue;
            }
            if (!parsed.isBefore(weekStart) && !parsed.isAfter(today)) {
                weekSales += sales;
                weekOrders += count;
            }
        }

        List<Map<String, Object>> byHour = mapHourList(raw.get("byHour"));
        List<Map<String, Object>> byType = mapTypeList(raw.get("byType"), rangeSales);
        List<Map<String, Object>> topProducts = mapProductList(raw.get("topProducts"), rangeSales);
        List<Map<String, Object>> staff = mapStaffList(raw.get("staff"), rangeSales);
        List<Map<String, Object>> bySource = mapSourceList(raw.get("bySource"));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("storeId", storeId);
        out.put("timeZone", BUSINESS_ZONE.getId());
        out.put("today", today.toString());
        out.put("days", days);
        out.put("todaySales", roundMoney(todaySales));
        out.put("todayOrderCount", todayOrders);
        out.put("weekSales", roundMoney(weekSales));
        out.put("weekOrderCount", weekOrders);
        out.put("rangeSales", roundMoney(rangeSales));
        out.put("rangeOrderCount", rangeOrders);
        out.put("liveOrderCount", firstCount(raw.get("live")));
        out.put("pendingPaymentCount", firstCount(raw.get("pendingPayments")));
        out.put("daily", byDay);
        out.put("hours", byHour);
        out.put("orderTypes", byType);
        out.put("topProducts", topProducts);
        out.put("staff", staff);
        out.put("sources", bySource);
        log.info("Store summary {} days={} todaySales={} weekSales={} live={}",
                storeId, days, todaySales, weekSales, out.get("liveOrderCount"));
        return out;
    }

    public static LocalDateTime toUtcStart(LocalDate date) {
        ZonedDateTime zoned = date.atStartOfDay(BUSINESS_ZONE);
        return zoned.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    public static LocalDateTime toUtcEnd(LocalDate date) {
        ZonedDateTime zoned = date.plusDays(1).atStartOfDay(BUSINESS_ZONE).minusNanos(1);
        return zoned.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private static Document dateToString(String format) {
        return new Document("$dateToString", new Document("format", format)
                .append("date", "$createdAt")
                .append("timezone", BUSINESS_ZONE.getId()));
    }

    private static int firstCount(Object facet) {
        if (!(facet instanceof List<?> list) || list.isEmpty()) {
            return 0;
        }
        Object first = list.get(0);
        if (first instanceof Document doc) {
            return toInt(doc.get("count"));
        }
        if (first instanceof Map<?, ?> map) {
            return toInt(map.get("count"));
        }
        return 0;
    }

    private static List<Map<String, Object>> mapBucketList(Object facet, String dateKey) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (!(facet instanceof List<?> list)) {
            return rows;
        }
        for (Object item : list) {
            Document doc = asDocument(item);
            if (doc == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put(dateKey, String.valueOf(doc.get("_id")));
            row.put("sales", roundMoney(toDouble(doc.get("sales"))));
            row.put("orderCount", toInt(doc.get("orderCount")));
            rows.add(row);
        }
        rows.sort(Comparator.comparing(r -> String.valueOf(r.get(dateKey))));
        return rows;
    }

    private static void fillMissingDays(List<Map<String, Object>> byDay, LocalDate start, LocalDate end) {
        Map<String, Map<String, Object>> index = new LinkedHashMap<>();
        for (Map<String, Object> row : byDay) {
            index.put(String.valueOf(row.get("date")), row);
        }
        byDay.clear();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Map<String, Object> existing = index.get(d.toString());
            if (existing != null) {
                byDay.add(existing);
            } else {
                Map<String, Object> empty = new LinkedHashMap<>();
                empty.put("date", d.toString());
                empty.put("sales", 0);
                empty.put("orderCount", 0);
                byDay.add(empty);
            }
        }
    }

    private static List<Map<String, Object>> mapHourList(Object facet) {
        Map<Integer, Map<String, Object>> byHour = new LinkedHashMap<>();
        if (facet instanceof List<?> list) {
            for (Object item : list) {
                Document doc = asDocument(item);
                if (doc == null) {
                    continue;
                }
                int hour = parseHour(doc.get("_id"));
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("hour", hour);
                row.put("label", String.format("%02d:00", hour));
                row.put("sales", roundMoney(toDouble(doc.get("sales"))));
                row.put("orderCount", toInt(doc.get("orderCount")));
                byHour.put(hour, row);
            }
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            if (byHour.containsKey(h)) {
                rows.add(byHour.get(h));
            } else {
                Map<String, Object> empty = new LinkedHashMap<>();
                empty.put("hour", h);
                empty.put("label", String.format("%02d:00", h));
                empty.put("sales", 0);
                empty.put("orderCount", 0);
                rows.add(empty);
            }
        }
        return rows;
    }

    private static List<Map<String, Object>> mapTypeList(Object facet, double totalSales) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (!(facet instanceof List<?> list)) {
            return rows;
        }
        for (Object item : list) {
            Document doc = asDocument(item);
            if (doc == null) {
                continue;
            }
            int count = toInt(doc.get("orderCount"));
            double sales = toDouble(doc.get("sales"));
            Map<String, Object> row = new LinkedHashMap<>();
            Object id = doc.get("_id");
            row.put("orderType", id == null ? "UNKNOWN" : String.valueOf(id));
            row.put("count", count);
            row.put("sales", roundMoney(sales));
            row.put("percentage", totalSales > 0 ? roundMoney(sales * 100.0 / totalSales) : 0);
            row.put("averageOrderValue", count > 0 ? roundMoney(sales / count) : 0);
            rows.add(row);
        }
        rows.sort((a, b) -> Integer.compare(toInt(b.get("count")), toInt(a.get("count"))));
        return rows;
    }

    private static List<Map<String, Object>> mapSourceList(Object facet) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (!(facet instanceof List<?> list)) {
            return rows;
        }
        for (Object item : list) {
            Document doc = asDocument(item);
            if (doc == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            Object id = doc.get("_id");
            row.put("orderSource", id == null ? "MASOVA" : String.valueOf(id));
            row.put("sales", roundMoney(toDouble(doc.get("sales"))));
            row.put("commission", roundMoney(toDouble(doc.get("commission"))));
            row.put("netPayout", roundMoney(toDouble(doc.get("netPayout"))));
            row.put("orderCount", toInt(doc.get("orderCount")));
            rows.add(row);
        }
        return rows;
    }

    private static List<Map<String, Object>> mapProductList(Object facet, double totalSales) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (!(facet instanceof List<?> list)) {
            return rows;
        }
        int rank = 1;
        for (Object item : list) {
            Document doc = asDocument(item);
            if (doc == null) {
                continue;
            }
            int qty = toInt(doc.get("quantitySold"));
            double revenue = toDouble(doc.get("revenue"));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", rank++);
            Object id = doc.get("_id");
            row.put("itemId", id == null ? "" : String.valueOf(id));
            Object name = doc.get("itemName");
            row.put("itemName", name == null ? "Item" : String.valueOf(name));
            row.put("quantitySold", qty);
            row.put("revenue", roundMoney(revenue));
            row.put("unitPrice", qty > 0 ? roundMoney(revenue / qty) : 0);
            row.put("percentOfTotalRevenue", totalSales > 0 ? roundMoney(revenue * 100.0 / totalSales) : 0);
            row.put("category", "FOOD");
            row.put("trend", "UP");
            rows.add(row);
        }
        return rows;
    }

    private static List<Map<String, Object>> mapStaffList(Object facet, double totalSales) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (!(facet instanceof List<?> list)) {
            return rows;
        }
        int rank = 1;
        for (Object item : list) {
            Document doc = asDocument(item);
            if (doc == null) {
                continue;
            }
            int orders = toInt(doc.get("ordersProcessed"));
            double sales = toDouble(doc.get("salesGenerated"));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", rank++);
            Object id = doc.get("_id");
            row.put("staffId", id == null ? "" : String.valueOf(id));
            Object name = doc.get("staffName");
            row.put("staffName", name == null || String.valueOf(name).isBlank() ? "Staff" : String.valueOf(name));
            row.put("ordersProcessed", orders);
            row.put("salesGenerated", roundMoney(sales));
            row.put("averageOrderValue", orders > 0 ? roundMoney(sales / orders) : 0);
            row.put("percentOfTotalSales", totalSales > 0 ? roundMoney(sales * 100.0 / totalSales) : 0);
            row.put("performanceLevel", orders >= 20 ? "EXCELLENT" : orders >= 8 ? "GOOD" : "AVERAGE");
            rows.add(row);
        }
        return rows;
    }

    private static Document asDocument(Object item) {
        if (item instanceof Document doc) {
            return doc;
        }
        if (item instanceof Map<?, ?> map) {
            Document doc = new Document();
            map.forEach((k, v) -> doc.put(String.valueOf(k), v));
            return doc;
        }
        return null;
    }

    private static int parseHour(Object id) {
        if (id == null) {
            return 0;
        }
        try {
            return Integer.parseInt(String.valueOf(id));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static double toDouble(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value instanceof String s) {
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private static int toInt(Object value) {
        if (value instanceof Number n) {
            return n.intValue();
        }
        return 0;
    }

    private static double roundMoney(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
