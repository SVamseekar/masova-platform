package com.MaSoVa.shared.model;

import java.util.List;

/**
 * Nutritional information for menu items
 */
public class NutritionalInfo {
    private Integer calories;         // Calories per serving
    private Double protein;           // Protein in grams
    private Double carbohydrates;     // Carbs in grams
    private Double fat;               // Fat in grams
    private String servingSize;       // e.g., "1 piece", "100g"
    private List<String> allergens;   // Common allergens

    public NutritionalInfo() {}

    // Getters and Setters
    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Double getProtein() { return protein; }
    public void setProtein(Double protein) { this.protein = protein; }

    public Double getCarbohydrates() { return carbohydrates; }
    public void setCarbohydrates(Double carbohydrates) { this.carbohydrates = carbohydrates; }

    public Double getFat() { return fat; }
    public void setFat(Double fat) { this.fat = fat; }

    public String getServingSize() { return servingSize; }
    public void setServingSize(String servingSize) { this.servingSize = servingSize; }

    public List<String> getAllergens() { return allergens; }
    public void setAllergens(List<String> allergens) { this.allergens = allergens; }
}
