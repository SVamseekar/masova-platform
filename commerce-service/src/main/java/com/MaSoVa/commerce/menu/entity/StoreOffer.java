package com.MaSoVa.commerce.menu.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/**
 * A promotion a store advertises to customers on the ordering site.
 * Display content only: order pricing does not read this collection.
 */
@Document(collection = "store_offers")
public class StoreOffer {

    @Id
    private String id;

    @Indexed
    private String storeId;

    private String title;
    private String description;
    /** Short label drawn over the image, for example "20% OFF". */
    private String badge;
    /** Filter group shown as a chip, for example "Pizza". */
    private String category;
    private String imageUrl;
    /** Last day the offer is shown. */
    private LocalDate validUntil;
    private String appliesTo;
    private String redemption;
    private boolean active = true;
    private int sortOrder;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }

    public String getAppliesTo() { return appliesTo; }
    public void setAppliesTo(String appliesTo) { this.appliesTo = appliesTo; }

    public String getRedemption() { return redemption; }
    public void setRedemption(String redemption) { this.redemption = redemption; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
