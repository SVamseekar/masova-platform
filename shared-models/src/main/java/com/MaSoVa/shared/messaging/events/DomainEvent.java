package com.MaSoVa.shared.messaging.events;

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

    // Default no-arg constructor for Jackson deserialization
    protected DomainEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = getClass().getSimpleName();
        this.occurredAt = Instant.now();
    }

    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public Instant getOccurredAt() { return occurredAt; }
}
