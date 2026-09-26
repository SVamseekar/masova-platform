package com.MaSoVa.payment.config;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.IndexOptions;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Keeps razorpayOrderId unique only when it is set.
 * A full unique index lets only one Stripe transaction (null razorpayOrderId) exist.
 * Runs before the web server starts; replaces an old full index if one exists.
 */
@Component
public class TransactionIndexMigration implements SmartInitializingSingleton {

    private static final Logger log = LoggerFactory.getLogger(TransactionIndexMigration.class);

    static final String INDEX_NAME = "razorpayOrderId_unique_when_present";

    private final MongoTemplate mongoTemplate;

    public TransactionIndexMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void afterSingletonsInstantiated() {
        migrate();
    }

    public void migrate() {
        MongoCollection<Document> transactions = mongoTemplate.getCollection("transactions");
        for (Document index : transactions.listIndexes()) {
            Document key = (Document) index.get("key");
            boolean onRazorpayOrderIdOnly = key.size() == 1 && key.containsKey("razorpayOrderId");
            if (onRazorpayOrderIdOnly && !INDEX_NAME.equals(index.getString("name"))) {
                transactions.dropIndex(index.getString("name"));
                log.info("Dropped index {} on transactions.razorpayOrderId", index.getString("name"));
            }
        }
        transactions.createIndex(new Document("razorpayOrderId", 1), new IndexOptions()
                .name(INDEX_NAME)
                .unique(true)
                .partialFilterExpression(new Document("razorpayOrderId", new Document("$type", "string"))));
    }
}
