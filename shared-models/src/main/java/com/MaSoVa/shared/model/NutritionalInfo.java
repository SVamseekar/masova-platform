package com.MaSoVa.shared.model;

import java.io.Serializable;

/**
 * Nutritional information for menu items
 */
public class NutritionalInfo implements Serializable {

    private static final long serialVersionUID = 1L;
    private Integer calories;         // Calories per serving
    private Double protein;           // Protein in grams
    private Double carbohydrates;     // Carbs in grams
    private Double fat;               // Fat in grams
    private String servingSize;       // e.g., "1 piece", "100g"

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
}
