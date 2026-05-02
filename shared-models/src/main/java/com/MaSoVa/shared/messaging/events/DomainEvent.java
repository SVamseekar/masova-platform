package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

public abstract class DomainEvent implements Serializable {
    private final String eventId;
    private final String eventType;
    private final Instant occurredAt;

    protected DomainEvent(String eventType) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.occurredAt = Instant.now();
    }

    @JsonCreator
    protected DomainEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt) {
        this.eventId = eventId != null ? eventId : UUID.randomUUID().toString();
        this.eventType = eventType != null ? eventType : getClass().getSimpleName();
        this.occurredAt = occurredAt != null ? occurredAt : Instant.now();
    }

    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public Instant getOccurredAt() { return occurredAt; }
}
