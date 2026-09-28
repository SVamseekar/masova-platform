package com.MaSoVa.payment.unit.config;

import com.MaSoVa.payment.config.TransactionIndexMigration;
import com.mongodb.MongoCommandException;
import com.mongodb.ServerAddress;
import com.mongodb.client.ListIndexesIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.IndexOptions;
import org.bson.BsonDocument;
import org.bson.BsonInt32;
import org.bson.BsonString;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransactionIndexMigrationTest {

    @Test
    @SuppressWarnings("unchecked")
    void indexAlreadyDroppedByAnotherInstanceDoesNotFailStartup() {
        MongoTemplate mongoTemplate = mock(MongoTemplate.class);
        MongoCollection<Document> collection = mock(MongoCollection.class);
        ListIndexesIterable<Document> indexes = mock(ListIndexesIterable.class);
        MongoCursor<Document> cursor = mock(MongoCursor.class);
        Document legacy = new Document("name", "razorpayOrderId").append("key", new Document("razorpayOrderId", 1));
        when(mongoTemplate.getCollection("transactions")).thenReturn(collection);
        when(collection.listIndexes()).thenReturn(indexes);
        when(indexes.iterator()).thenReturn(cursor);
        when(cursor.hasNext()).thenReturn(true, false);
        when(cursor.next()).thenReturn(legacy);
        BsonDocument notFound = new BsonDocument("ok", new BsonInt32(0))
                .append("code", new BsonInt32(27))
                .append("errmsg", new BsonString("index not found with name [razorpayOrderId]"));
        doThrow(new MongoCommandException(notFound, new ServerAddress()))
                .when(collection).dropIndex("razorpayOrderId");

        assertThatCode(() -> new TransactionIndexMigration(mongoTemplate).migrate()).doesNotThrowAnyException();
        verify(collection).createIndex(any(Document.class), any(IndexOptions.class));
    }
}
