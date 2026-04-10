package com.MaSoVa.commerce.menu.dto;

import com.MaSoVa.shared.enums.AllergenType;
import java.util.HashSet;
import java.util.Set;

public class AllergenDeclarationRequest {

    private Set<AllergenType> allergens = new HashSet<>();
    private boolean allergenFree = false;

    public AllergenDeclarationRequest() {}

    public Set<AllergenType> getAllergens() { return allergens; }
    public void setAllergens(Set<AllergenType> allergens) { this.allergens = allergens; }

    public boolean isAllergenFree() { return allergenFree; }
    public void setAllergenFree(boolean allergenFree) { this.allergenFree = allergenFree; }
}
