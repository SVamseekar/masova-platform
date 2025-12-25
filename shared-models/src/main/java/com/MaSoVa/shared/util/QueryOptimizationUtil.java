package com.MaSoVa.shared.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Utility for optimizing MongoDB queries
 * Phase 13: Performance Optimization - Database optimization
 */
public class QueryOptimizationUtil {

    private static final Logger logger = LoggerFactory.getLogger(QueryOptimizationUtil.class);
    private static final int SLOW_QUERY_THRESHOLD_MS = 100;

    /**
     * Apply pagination to a query
     */
    public static Query applyPagination(Query query, PageableRequest pageableRequest) {
        query.skip(pageableRequest.getOffset());
        query.limit(pageableRequest.getSize());

        // Apply sorting
        Sort.Direction direction = "ASC".equalsIgnoreCase(pageableRequest.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        query.with(Sort.by(direction, pageableRequest.getSortBy()));

        return query;
    }

    /**
     * Execute query with performance logging
     */
    @Nullable
    public static <T> T executeQueryWithLogging(@NonNull MongoTemplate mongoTemplate, @NonNull Query query,
                                                  @NonNull Class<T> entityClass, @NonNull String queryName) {
        Objects.requireNonNull(mongoTemplate, "mongoTemplate cannot be null");
        Objects.requireNonNull(query, "query cannot be null");
        Objects.requireNonNull(entityClass, "entityClass cannot be null");
        Objects.requireNonNull(queryName, "queryName cannot be null");

        long startTime = System.currentTimeMillis();

        T result = mongoTemplate.findOne(query, entityClass);

        long executionTime = System.currentTimeMillis() - startTime;
        if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
            logger.warn("Slow query detected: {} took {}ms", queryName, executionTime);
            logger.warn("Query details: {}", query);
        }

        return result;
    }

    /**
     * Add field inclusion to query (projection)
     */
    @NonNull
    public static Query addFieldInclusion(@NonNull Query query, @NonNull String... fields) {
        Objects.requireNonNull(query, "query cannot be null");
        Objects.requireNonNull(fields, "fields cannot be null");
        for (String field : fields) {
            if (field != null && !field.isEmpty()) {
                query.fields().include(field);
            }
        }
        return query;
    }

    /**
     * Add field exclusion to query
     */
    @NonNull
    public static Query addFieldExclusion(@NonNull Query query, @NonNull String... fields) {
        Objects.requireNonNull(query, "query cannot be null");
        Objects.requireNonNull(fields, "fields cannot be null");
        for (String field : fields) {
            if (field != null && !field.isEmpty()) {
                query.fields().exclude(field);
            }
        }
        return query;
    }

    /**
     * Create a query with date range optimization
     */
    @NonNull
    public static Query createDateRangeQuery(@Nullable LocalDateTime startDate, @Nullable LocalDateTime endDate, @NonNull String dateField) {
        Objects.requireNonNull(dateField, "dateField cannot be null");
        Query query = new Query();
        if (startDate != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where(dateField).gte(startDate));
        }
        if (endDate != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where(dateField).lte(endDate));
        }
        return query;
    }

    /**
     * Log query execution time
     */
    public static void logQueryExecution(String queryName, long executionTime) {
        if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
            logger.warn("Query '{}' took {}ms (threshold: {}ms)", queryName, executionTime, SLOW_QUERY_THRESHOLD_MS);
        } else {
            logger.debug("Query '{}' completed in {}ms", queryName, executionTime);
        }
    }
}
