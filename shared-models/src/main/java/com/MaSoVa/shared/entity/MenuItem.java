package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.SpiceLevel;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.shared.model.MenuVariant;
import com.MaSoVa.shared.model.MenuCustomization;
import com.MaSoVa.shared.model.NutritionalInfo;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Menu Item Entity - Represents a dish/item in the restaurant menu
 */
@Document(collection = "menu_items")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'category': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'isAvailable': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'isRecommended': 1}")
})
public class MenuItem implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    @Version
    private Long version;

    @NotNull
    @Field("name")
    @Indexed
    private String name;

    @Field("description")
    private String description;

    @NotNull
    @Field("cuisine")
    @Indexed
    private Cuisine cuisine;

    @NotNull
    @Field("category")
    @Indexed
    private MenuCategory category;

    @Field("subCategory")
    private String subCategory;

    @NotNull
    @Min(0)
    @Field("basePrice")
    private Long basePrice;  // Price in paise (₹)

    @Field("variants")
    private List<MenuVariant> variants = new ArrayList<>();

    @Field("customizations")
    private List<MenuCustomization> customizations = new ArrayList<>();

    @Field("dietaryInfo")
    private List<DietaryType> dietaryInfo = new ArrayList<>();

    @Field("spiceLevel")
    private SpiceLevel spiceLevel;

    @Field("nutritionalInfo")
    private NutritionalInfo nutritionalInfo;

    @Field("imageUrl")
    private String imageUrl;

    @Field("isAvailable")
    private Boolean isAvailable = true;

    @Field("preparationTime")
    private Integer preparationTime;  // Minutes

    @Field("servingSize")
    private String servingSize;

    // Portion control tracking
    @Field("standardPortionSize")
    private Double standardPortionSize;  // e.g., 250.0 (for 250g)

    @Field("portionUnit")
    private String portionUnit;  // e.g., "g", "ml", "pieces", "servings"

    @Field("yieldPerRecipe")
    private Integer yieldPerRecipe;  // How many portions one recipe makes

    @Field("ingredients")
    private List<String> ingredients = new ArrayList<>();

    @Field("allergens")
    private Set<AllergenType> allergens = new HashSet<>();

    @Field("allergensDeclared")
    private boolean allergensDeclared = false;

    @Field("preparationInstructions")
    private List<String> preparationInstructions = new ArrayList<>();  // Step-by-step recipe instructions

    @Field("storeId")
    @Indexed
    private String storeId;

    @Field("displayOrder")
    private Integer displayOrder = 0;

    @Field("tags")
    private List<String> tags = new ArrayList<>();  // e.g., "popular", "new", "chef-special"

    @Field("isRecommended")
    private Boolean isRecommended = false;

    @Field("createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public MenuItem() {}

    public MenuItem(String name, Cuisine cuisine, MenuCategory category, Long basePrice) {
        this.name = name;
        this.cuisine = cuisine;
        this.category = category;
        this.basePrice = basePrice;
        this.isAvailable = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public Double getStandardPortionSize() { return standardPortionSize; }
    public void setStandardPortionSize(Double standardPortionSize) { this.standardPortionSize = standardPortionSize; }

    public String getPortionUnit() { return portionUnit; }
    public void setPortionUnit(String portionUnit) { this.portionUnit = portionUnit; }

    public Integer getYieldPerRecipe() { return yieldPerRecipe; }
    public void setYieldPerRecipe(Integer yieldPerRecipe) { this.yieldPerRecipe = yieldPerRecipe; }

    public List<String> getIngredients() { return ingredients; }
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }

    public Set<AllergenType> getAllergens() { return allergens; }
    public void setAllergens(Set<AllergenType> allergens) { this.allergens = allergens; }

    public boolean isAllergensDeclared() { return allergensDeclared; }
    public void setAllergensDeclared(boolean allergensDeclared) { this.allergensDeclared = allergensDeclared; }

    public List<String> getPreparationInstructions() { return preparationInstructions; }
    public void setPreparationInstructions(List<String> preparationInstructions) { this.preparationInstructions = preparationInstructions; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsRecommended() { return isRecommended; }
    public void setIsRecommended(Boolean isRecommended) { this.isRecommended = isRecommended; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public void addVariant(MenuVariant variant) {
        if (this.variants == null) {
            this.variants = new ArrayList<>();
        }
        this.variants.add(variant);
    }

    public void addCustomization(MenuCustomization customization) {
        if (this.customizations == null) {
            this.customizations = new ArrayList<>();
        }
        this.customizations.add(customization);
    }

    public void addDietaryInfo(DietaryType dietaryType) {
        if (this.dietaryInfo == null) {
            this.dietaryInfo = new ArrayList<>();
        }
        this.dietaryInfo.add(dietaryType);
    }

    public void addTag(String tag) {
        if (this.tags == null) {
            this.tags = new ArrayList<>();
        }
        if (!this.tags.contains(tag)) {
            this.tags.add(tag);
        }
    }
}
