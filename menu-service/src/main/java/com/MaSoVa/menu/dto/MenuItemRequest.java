package com.MaSoVa.menu.dto;

import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.SpiceLevel;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.shared.model.MenuVariant;
import com.MaSoVa.shared.model.MenuCustomization;
import com.MaSoVa.shared.model.NutritionalInfo;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.util.List;

public class MenuItemRequest {

    @NotNull(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Cuisine is required")
    private Cuisine cuisine;

    @NotNull(message = "Category is required")
    private MenuCategory category;

    private String subCategory;

    @NotNull(message = "Base price is required")
    @Min(value = 0, message = "Price must be positive")
    private Long basePrice;

    private List<MenuVariant> variants;
    private List<MenuCustomization> customizations;
    private List<DietaryType> dietaryInfo;
    private SpiceLevel spiceLevel;
    private NutritionalInfo nutritionalInfo;
    private String imageUrl;
    private Boolean isAvailable = true;
    private Integer preparationTime;
    private String servingSize;
    private List<String> ingredients;
    private List<String> allergens;
    private String storeId;
    private Integer displayOrder = 0;
    private List<String> tags;
    private Boolean isRecommended = false;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Cuisine getCuisine() { return cuisine; }
    public void setCuisine(Cuisine cuisine) { this.cuisine = cuisine; }

    public MenuCategory getCategory() { return category; }
    public void setCategory(MenuCategory category) { this.category = category; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public Long getBasePrice() { return basePrice; }
    public void setBasePrice(Long basePrice) { this.basePrice = basePrice; }

    public List<MenuVariant> getVariants() { return variants; }
    public void setVariants(List<MenuVariant> variants) { this.variants = variants; }

    public List<MenuCustomization> getCustomizations() { return customizations; }
    public void setCustomizations(List<MenuCustomization> customizations) { this.customizations = customizations; }

    public List<DietaryType> getDietaryInfo() { return dietaryInfo; }
    public void setDietaryInfo(List<DietaryType> dietaryInfo) { this.dietaryInfo = dietaryInfo; }

    public SpiceLevel getSpiceLevel() { return spiceLevel; }
    public void setSpiceLevel(SpiceLevel spiceLevel) { this.spiceLevel = spiceLevel; }

    public NutritionalInfo getNutritionalInfo() { return nutritionalInfo; }
    public void setNutritionalInfo(NutritionalInfo nutritionalInfo) { this.nutritionalInfo = nutritionalInfo; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Integer getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Integer preparationTime) { this.preparationTime = preparationTime; }

    public String getServingSize() { return servingSize; }
    public void setServingSize(String servingSize) { this.servingSize = servingSize; }

    public List<String> getIngredients() { return ingredients; }
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }

    public List<String> getAllergens() { return allergens; }
    public void setAllergens(List<String> allergens) { this.allergens = allergens; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsRecommended() { return isRecommended; }
    public void setIsRecommended(Boolean isRecommended) { this.isRecommended = isRecommended; }
}
