package com.MaSoVa.payment.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Converts money fields written as strings (the old Spring Data default) to Decimal128.
 * Idempotent: only documents whose field is still a string are touched.
 * Runs before the web server starts, so no request sees an unconverted value.
 */
@Component
public class MoneyFieldMigration implements SmartInitializingSingleton {

    private static final Logger log = LoggerFactory.getLogger(MoneyFieldMigration.class);

    private static final Map<String, List<String>> MONEY_FIELDS = Map.of(
            "transactions", List.of("amount", "refundClaimedAmount"),
            "refunds", List.of("amount"));

    private final MongoTemplate mongoTemplate;

    public MoneyFieldMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void afterSingletonsInstantiated() {
        migrate();
    }

    public void migrate() {
        MONEY_FIELDS.forEach((collection, fields) -> fields.forEach(field -> {
            // $convert with onError keeps an unparseable value as is, so one bad row cannot block startup.
            Document convert = new Document("$convert", new Document("input", "$" + field)
                    .append("to", "decimal")
                    .append("onError", "$" + field));
            long converted = mongoTemplate.getCollection(collection).updateMany(
                    new Document(field, new Document("$type", "string")),
                    List.of(new Document("$set", new Document(field, convert))))
                    .getModifiedCount();
            long unparseable = mongoTemplate.getCollection(collection)
                    .countDocuments(new Document(field, new Document("$type", "string")));
            if (converted > 0) {
                log.info("Converted {} {}.{} values from string to Decimal128", converted, collection, field);
            }
            if (unparseable > 0) {
                log.error("{} {}.{} values are not numbers and were left as strings; fix them by hand",
                        unparseable, collection, field);
            }
        }));
    }
}
