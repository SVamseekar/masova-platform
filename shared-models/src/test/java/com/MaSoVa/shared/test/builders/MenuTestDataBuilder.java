package com.MaSoVa.shared.test.builders;

import com.MaSoVa.shared.test.TestDataBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builder for creating test MenuItem data as Map representations.
 *
 * The map structure mirrors the shared MenuItem entity fields and is suitable
 * for JSON serialization in integration tests across all services.
 *
 * @example
 * <pre>
 * {@code
 * // Default menu item (Margherita Pizza)
 * Map<String, Object> item = MenuTestDataBuilder.aMenuItem().build();
 *
 * // Unavailable item
 * Map<String, Object> item = MenuTestDataBuilder.aMenuItem()
 *         .withName("Seasonal Special")
 *         .withIsAvailable(false)
 *         .build();
 *
 * // Biryani item
 * Map<String, Object> biryani = MenuTestDataBuilder.aBiryaniItem().build();
 * }
 * </pre>
 */
public class MenuTestDataBuilder {

    private String id = TestDataBuilder.randomId();
    private String name = "Margherita Pizza";
    private String description = "Classic pizza with fresh mozzarella and basil";
    private String cuisine = "ITALIAN";
    private String category = "PIZZA";
    private String subCategory = null;
    private Long basePrice = 29900L; // in paise (299.00 INR)
    private List<Map<String, Object>> variants = new ArrayList<>();
    private List<Map<String, Object>> customizations = new ArrayList<>();
    private List<String> dietaryInfo = List.of("VEGETARIAN");
    private String spiceLevel = "MILD";
    private String imageUrl = "https://example.com/images/margherita.jpg";
    private Boolean isAvailable = true;
    private Integer preparationTime = 20;
    private String servingSize = "1 piece";
    private Double standardPortionSize = 250.0;
    private String portionUnit = "g";
    private Integer yieldPerRecipe = 8;
    private List<String> ingredients = List.of("Flour", "Mozzarella", "Tomato sauce", "Basil");
    private List<String> allergens = List.of("Gluten", "Dairy");
    private List<String> preparationInstructions = List.of("Prepare dough", "Add toppings", "Bake at 250C");
    private String storeId = TestDataBuilder.defaultStoreId();
    private Integer displayOrder = 0;
    private List<String> tags = List.of("popular");
    private Boolean isRecommended = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    private MenuTestDataBuilder() {}

    public static MenuTestDataBuilder aMenuItem() {
        return new MenuTestDataBuilder();
    }

    public static MenuTestDataBuilder aBiryaniItem() {
        return new MenuTestDataBuilder()
                .withName("Chicken Biryani")
                .withDescription("Fragrant basmati rice with spiced chicken")
                .withCuisine("SOUTH_INDIAN")
                .withCategory("BIRYANI")
                .withBasePrice(24900L)
                .withSpiceLevel("MEDIUM")
                .withDietaryInfo(List.of())
                .withIngredients(List.of("Basmati rice", "Chicken", "Spices", "Onion", "Yogurt"))
                .withAllergens(List.of())
                .withPreparationTime(35);
    }

    public static MenuTestDataBuilder aDosaItem() {
        return new MenuTestDataBuilder()
                .withName("Masala Dosa")
                .withDescription("Crispy crepe filled with spiced potato")
                .withCuisine("SOUTH_INDIAN")
                .withCategory("DOSA")
                .withBasePrice(12900L)
                .withSpiceLevel("MEDIUM")
                .withDietaryInfo(List.of("VEGETARIAN", "VEGAN"))
                .withIngredients(List.of("Rice batter", "Urad dal", "Potato", "Onion", "Spices"))
                .withAllergens(List.of())
                .withPreparationTime(15);
    }

    public static MenuTestDataBuilder aBeverageItem() {
        return new MenuTestDataBuilder()
                .withName("Masala Chai")
                .withDescription("Traditional Indian spiced tea")
                .withCuisine("SOUTH_INDIAN")
                .withCategory("TEA_CHAI")
                .withBasePrice(4900L)
                .withSpiceLevel("MILD")
                .withDietaryInfo(List.of("VEGETARIAN"))
                .withIngredients(List.of("Tea leaves", "Milk", "Sugar", "Cardamom", "Ginger"))
                .withAllergens(List.of("Dairy"))
                .withPreparationTime(5);
    }

    // Builder methods

    public MenuTestDataBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public MenuTestDataBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public MenuTestDataBuilder withDescription(String description) {
        this.description = description;
        return this;
    }

    public MenuTestDataBuilder withCuisine(String cuisine) {
        this.cuisine = cuisine;
        return this;
    }

    public MenuTestDataBuilder withCategory(String category) {
        this.category = category;
        return this;
    }

    public MenuTestDataBuilder withSubCategory(String subCategory) {
        this.subCategory = subCategory;
        return this;
    }

    public MenuTestDataBuilder withBasePrice(Long basePrice) {
        this.basePrice = basePrice;
        return this;
    }

    public MenuTestDataBuilder withVariants(List<Map<String, Object>> variants) {
        this.variants = variants;
        return this;
    }

    public MenuTestDataBuilder withCustomizations(List<Map<String, Object>> customizations) {
        this.customizations = customizations;
        return this;
    }

    public MenuTestDataBuilder withDietaryInfo(List<String> dietaryInfo) {
        this.dietaryInfo = dietaryInfo;
        return this;
    }

    public MenuTestDataBuilder withSpiceLevel(String spiceLevel) {
        this.spiceLevel = spiceLevel;
        return this;
    }

    public MenuTestDataBuilder withImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        return this;
    }

    public MenuTestDataBuilder withIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
        return this;
    }

    public MenuTestDataBuilder withPreparationTime(Integer preparationTime) {
        this.preparationTime = preparationTime;
        return this;
    }

    public MenuTestDataBuilder withServingSize(String servingSize) {
        this.servingSize = servingSize;
        return this;
    }

    public MenuTestDataBuilder withStandardPortionSize(Double standardPortionSize) {
        this.standardPortionSize = standardPortionSize;
        return this;
    }

    public MenuTestDataBuilder withPortionUnit(String portionUnit) {
        this.portionUnit = portionUnit;
        return this;
    }

    public MenuTestDataBuilder withYieldPerRecipe(Integer yieldPerRecipe) {
        this.yieldPerRecipe = yieldPerRecipe;
        return this;
    }

    public MenuTestDataBuilder withIngredients(List<String> ingredients) {
        this.ingredients = ingredients;
        return this;
    }

    public MenuTestDataBuilder withAllergens(List<String> allergens) {
        this.allergens = allergens;
        return this;
    }

    public MenuTestDataBuilder withPreparationInstructions(List<String> preparationInstructions) {
        this.preparationInstructions = preparationInstructions;
        return this;
    }

    public MenuTestDataBuilder withStoreId(String storeId) {
        this.storeId = storeId;
        return this;
    }

    public MenuTestDataBuilder withDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
        return this;
    }

    public MenuTestDataBuilder withTags(List<String> tags) {
        this.tags = tags;
        return this;
    }

    public MenuTestDataBuilder withIsRecommended(Boolean isRecommended) {
        this.isRecommended = isRecommended;
        return this;
    }

    public Map<String, Object> build() {
        Map<String, Object> menuItem = new HashMap<>();
        menuItem.put("id", id);
        menuItem.put("name", name);
        menuItem.put("description", description);
        menuItem.put("cuisine", cuisine);
        menuItem.put("category", category);
        menuItem.put("basePrice", basePrice);
        menuItem.put("variants", variants);
        menuItem.put("customizations", customizations);
        menuItem.put("dietaryInfo", dietaryInfo);
        menuItem.put("spiceLevel", spiceLevel);
        menuItem.put("imageUrl", imageUrl);
        menuItem.put("isAvailable", isAvailable);
        menuItem.put("preparationTime", preparationTime);
        menuItem.put("servingSize", servingSize);
        menuItem.put("standardPortionSize", standardPortionSize);
        menuItem.put("portionUnit", portionUnit);
        menuItem.put("yieldPerRecipe", yieldPerRecipe);
        menuItem.put("ingredients", ingredients);
        menuItem.put("allergens", allergens);
        menuItem.put("preparationInstructions", preparationInstructions);
        menuItem.put("storeId", storeId);
        menuItem.put("displayOrder", displayOrder);
        menuItem.put("tags", tags);
        menuItem.put("isRecommended", isRecommended);
        menuItem.put("createdAt", createdAt != null ? createdAt.toString() : null);
        menuItem.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);

        if (subCategory != null) {
            menuItem.put("subCategory", subCategory);
        }

        return menuItem;
    }

    // Variant and customization helpers

    /**
     * Build a menu variant map (e.g., size variants like Small/Medium/Large).
     */
    public static Map<String, Object> buildVariant(String name, Long priceAdjustment) {
        Map<String, Object> variant = new HashMap<>();
        variant.put("name", name);
        variant.put("priceAdjustment", priceAdjustment);
        return variant;
    }

    /**
     * Build a menu customization map (e.g., extra cheese, toppings).
     */
    public static Map<String, Object> buildCustomization(String name, Long price) {
        Map<String, Object> customization = new HashMap<>();
        customization.put("name", name);
        customization.put("price", price);
        return customization;
    }
}
