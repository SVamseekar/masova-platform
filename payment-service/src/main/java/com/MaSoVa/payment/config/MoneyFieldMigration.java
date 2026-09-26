package com.MaSoVa.payment.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Converts money fields written as strings (the old Spring Data default) to Decimal128.
 * Idempotent: only documents whose field is still a string are touched.
 */
@Component
public class MoneyFieldMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MoneyFieldMigration.class);

    private static final Map<String, List<String>> MONEY_FIELDS = Map.of(
            "transactions", List.of("amount", "refundClaimedAmount"),
            "refunds", List.of("amount"));

    private final MongoTemplate mongoTemplate;

    public MoneyFieldMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        MONEY_FIELDS.forEach((collection, fields) -> fields.forEach(field -> {
            long converted = mongoTemplate.getCollection(collection).updateMany(
                    new Document(field, new Document("$type", "string")),
                    List.of(new Document("$set", new Document(field, new Document("$toDecimal", "$" + field)))))
                    .getModifiedCount();
            if (converted > 0) {
                log.info("Converted {} {}.{} values from string to Decimal128", converted, collection, field);
            }
        }));
    }
}
