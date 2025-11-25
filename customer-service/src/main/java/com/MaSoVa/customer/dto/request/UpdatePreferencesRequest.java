package com.MaSoVa.customer.dto.request;

import java.util.Set;

public class UpdatePreferencesRequest {

    private Set<String> favoriteMenuItems;
    private Set<String> cuisinePreferences;
    private Set<String> dietaryRestrictions;
    private Set<String> allergens;
    private String preferredPaymentMethod;
    private String spiceLevel;
    private Boolean notifyOnOffers;
    private Boolean notifyOnOrderStatus;

    public UpdatePreferencesRequest() {}

    // Getters and Setters
    public Set<String> getFavoriteMenuItems() { return favoriteMenuItems; }
    public void setFavoriteMenuItems(Set<String> favoriteMenuItems) { this.favoriteMenuItems = favoriteMenuItems; }

    public Set<String> getCuisinePreferences() { return cuisinePreferences; }
    public void setCuisinePreferences(Set<String> cuisinePreferences) { this.cuisinePreferences = cuisinePreferences; }

    public Set<String> getDietaryRestrictions() { return dietaryRestrictions; }
    public void setDietaryRestrictions(Set<String> dietaryRestrictions) { this.dietaryRestrictions = dietaryRestrictions; }

    public Set<String> getAllergens() { return allergens; }
    public void setAllergens(Set<String> allergens) { this.allergens = allergens; }

    public String getPreferredPaymentMethod() { return preferredPaymentMethod; }
    public void setPreferredPaymentMethod(String preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; }

    public String getSpiceLevel() { return spiceLevel; }
    public void setSpiceLevel(String spiceLevel) { this.spiceLevel = spiceLevel; }

    public Boolean getNotifyOnOffers() { return notifyOnOffers; }
    public void setNotifyOnOffers(Boolean notifyOnOffers) { this.notifyOnOffers = notifyOnOffers; }

    public Boolean getNotifyOnOrderStatus() { return notifyOnOrderStatus; }
    public void setNotifyOnOrderStatus(Boolean notifyOnOrderStatus) { this.notifyOnOrderStatus = notifyOnOrderStatus; }
}
