# Global-1: Allergen Law Compliance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text `List<String> allergens` on `MenuItem` with a typed `Set<AllergenType>` enum (14 EU allergens), add an `allergensDeclared` gate that blocks `isAvailable=true` until a manager makes an explicit declaration, and surface allergen info across all clients (web, masova-mobile, MaSoVaCrewApp).

**Architecture:** `AllergenType` enum lives in `shared-models` (single source of truth). `MenuItem` carries `allergens: Set<AllergenType>` and `allergensDeclared: boolean`. A new `PATCH /api/menu/{id}/allergens` endpoint is the only code path that sets `allergensDeclared=true`. A MongoDB migration script resets all existing items to undeclared/unavailable. Frontend and mobile clients render allergen badges and customer warnings using the same 14 labels.

**Tech Stack:** Java 21, Spring Boot 3, MongoDB, JUnit 5 + Mockito (backend tests), Vitest + React Testing Library (frontend tests), React Native 0.81 (masova-mobile), React Native 0.83 (MaSoVaCrewApp), TypeScript strict

---

## File Map

### Created
- `shared-models/src/main/java/com/MaSoVa/shared/enums/AllergenType.java`
- `commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/AllergenDeclarationRequest.java`
- `commerce-service/src/test/java/com/MaSoVa/commerce/menu/service/MenuServiceTest.java`
- `commerce-service/src/test/java/com/MaSoVa/commerce/menu/controller/MenuControllerTest.java`
- `scripts/migrate-allergens.js`
- `frontend/src/constants/allergens.ts`

### Modified
- `shared-models/src/main/java/com/MaSoVa/shared/entity/MenuItem.java` — `allergens` field type, add `allergensDeclared`
- `shared-models/src/main/java/com/MaSoVa/shared/model/NutritionalInfo.java` — remove `allergens` field
- `shared-models/src/test/java/com/MaSoVa/shared/test/builders/MenuTestDataBuilder.java` — update allergen field to enum
- `commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/MenuItemRequest.java` — `allergens` field type, add `allergensDeclared`
- `commerce-service/src/main/java/com/MaSoVa/commerce/menu/service/MenuService.java` — enforcement gate + `declareAllergens()`
- `commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java` — new `PATCH /api/menu/{id}/allergens`
- `core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java` — `allergens` → `allergenAlerts: Set<AllergenType>`
- `core-service/src/main/java/com/MaSoVa/core/customer/dto/request/UpdatePreferencesRequest.java` — same rename+retype
- `frontend/src/store/api/menuApi.ts` — update `MenuItem` and `MenuItemRequest` interfaces, add `declareAllergens` mutation
- `frontend/src/pages/manager/RecipeManagementPage.tsx` — 14-checkbox grid, pending badge
- `frontend/src/pages/kitchen/KitchenDisplayPage.tsx` — allergen badges per line item
- `frontend/src/apps/POSSystem/POSSystem.tsx` — allergen summary on order confirmation
- `frontend/src/pages/customer/MenuPage.tsx` — allergen list + warning banner on item detail
- `frontend/src/pages/customer/ProfilePage.tsx` — allergen options → 14 EU values
- `frontend/src/store/api/customerApi.ts` — `allergenAlerts` field
- `/Users/souravamseekarmarti/Projects/masova-mobile/src/types/index.ts` — add `allergens`, `allergensDeclared` to `MenuItem`
- `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/menu/ItemDetailScreen.tsx` — allergen chips + warning card
- `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/profile/ProfileScreen.tsx` — 14 EU allergen options
- `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp/src/store/api/orderApi.ts` — add `allergens` to `KitchenOrder` line items
- `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp/src/screens/kitchen/KitchenQueueScreen.tsx` — allergen badges on order cards

---

## Task 1: AllergenType enum (shared-models)

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/enums/AllergenType.java`

- [ ] **Step 1: Create the enum**

```java
package com.MaSoVa.shared.enums;

public enum AllergenType {
    CELERY,
    CEREALS_GLUTEN,
    CRUSTACEANS,
    EGGS,
    FISH,
    LUPIN,
    MILK,
    MOLLUSCS,
    MUSTARD,
    NUTS,
    PEANUTS,
    SESAME,
    SOYA,
    SULPHUR_DIOXIDE
}
```

- [ ] **Step 2: Verify it compiles**

Run from `shared-models/` on the Dell (PowerShell):
```powershell
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/enums/AllergenType.java
git commit -m "feat(shared): add AllergenType enum — 14 EU mandatory allergens"
```

---

## Task 2: Update MenuItem entity (shared-models)

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/entity/MenuItem.java`
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/model/NutritionalInfo.java`

- [ ] **Step 1: Update imports in MenuItem.java**

Add to the import block:
```java
import com.MaSoVa.shared.enums.AllergenType;
import java.util.HashSet;
import java.util.Set;
```

Remove `java.util.ArrayList` and `java.util.List` only if they are no longer used after this change — check: `ingredients`, `preparationInstructions`, `tags`, `variants`, `customizations`, `dietaryInfo` still use List, so keep both imports.

- [ ] **Step 2: Change the allergens field in MenuItem.java**

Find:
```java
    @Field("allergens")
    private List<String> allergens = new ArrayList<>();
```

Replace with:
```java
    @Field("allergens")
    private Set<AllergenType> allergens = new HashSet<>();

    @Field("allergensDeclared")
    private boolean allergensDeclared = false;
```

- [ ] **Step 3: Update getter/setter for allergens in MenuItem.java**

Find:
```java
    public List<String> getAllergens() { return allergens; }
    public void setAllergens(List<String> allergens) { this.allergens = allergens; }
```

Replace with:
```java
    public Set<AllergenType> getAllergens() { return allergens; }
    public void setAllergens(Set<AllergenType> allergens) { this.allergens = allergens; }

    public boolean isAllergensDeclared() { return allergensDeclared; }
    public void setAllergensDeclared(boolean allergensDeclared) { this.allergensDeclared = allergensDeclared; }
```

- [ ] **Step 4: Remove allergens from NutritionalInfo.java**

In `NutritionalInfo.java`, remove:
```java
    private List<String> allergens;   // Common allergens
```
And remove the getter/setter pair:
```java
    public List<String> getAllergens() { return allergens; }
    public void setAllergens(List<String> allergens) { this.allergens = allergens; }
```
Also remove `import java.util.List;` if it is now unused (check — `NutritionalInfo` has no other List fields, so remove it).

- [ ] **Step 5: Compile to verify**

```powershell
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/entity/MenuItem.java
git add shared-models/src/main/java/com/MaSoVa/shared/model/NutritionalInfo.java
git commit -m "feat(shared): migrate MenuItem allergens to Set<AllergenType>, add allergensDeclared gate"
```

---

## Task 3: Safety floor — MenuService existing CRUD tests

The safety floor must be written before any class is touched. `MenuService` is touched in Task 4, so write these tests now.

**Files:**
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/menu/service/MenuServiceTest.java`

- [ ] **Step 1: Write the test file**

```java
package com.MaSoVa.commerce.menu.service;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.exception.BusinessException;
import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.shared.test.BaseServiceTest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MenuServiceTest extends BaseServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @InjectMocks
    private MenuService menuService;

    private MenuItem baseItem;

    @BeforeEach
    void setUp() {
        baseItem = new MenuItem("Margherita Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        baseItem.setId("item-1");
        baseItem.setStoreId("store-1");
    }

    // ── Existing CRUD safety floor ────────────────────────────────────────────

    @Test
    @DisplayName("createMenuItem saves and returns the item")
    void createMenuItem_savesItem() {
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(baseItem);

        MenuItem result = menuService.createMenuItem(baseItem);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Margherita Pizza");
        verify(menuItemRepository).save(baseItem);
    }

    @Test
    @DisplayName("getMenuItemsByStore returns items for given storeId")
    void getMenuItemsByStore_returnsStoreItems() {
        when(menuItemRepository.findByStoreIdAndIsAvailableTrue("store-1"))
            .thenReturn(List.of(baseItem));

        List<MenuItem> result = menuService.getMenuItemsByStore("store-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStoreId()).isEqualTo("store-1");
    }

    @Test
    @DisplayName("getMenuItemsByStoreAndCategory returns filtered items")
    void getMenuItemsByStoreAndCategory_returnsFiltered() {
        when(menuItemRepository.findByStoreIdAndCategoryAndIsAvailableTrue("store-1", MenuCategory.PIZZA))
            .thenReturn(List.of(baseItem));

        List<MenuItem> result = menuService.getMenuItemsByStoreAndCategory("store-1", MenuCategory.PIZZA);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo(MenuCategory.PIZZA);
    }

    @Test
    @DisplayName("updateMenuItem updates fields and saves")
    void updateMenuItem_updatesFields() {
        MenuItem updated = new MenuItem("New Name", Cuisine.ITALIAN, MenuCategory.PIZZA, 35000L);
        when(menuItemRepository.findById("item-1")).thenReturn(Optional.of(baseItem));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.updateMenuItem("item-1", updated);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getBasePrice()).isEqualTo(35000L);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    @Test
    @DisplayName("deleteMenuItem calls repository deleteById")
    void deleteMenuItem_callsRepository() {
        doNothing().when(menuItemRepository).deleteById("item-1");

        menuService.deleteMenuItem("item-1");

        verify(menuItemRepository).deleteById("item-1");
    }

    // ── MenuItem validation safety floor ─────────────────────────────────────

    @Test
    @DisplayName("MenuItem name is required — not null")
    void menuItem_nameRequired() {
        MenuItem item = new MenuItem();
        assertThat(item.getName()).isNull(); // default null before validation
    }

    @Test
    @DisplayName("MenuItem isAvailable defaults to true on constructor")
    void menuItem_isAvailableDefaultsTrue() {
        MenuItem item = new MenuItem("Test", Cuisine.ITALIAN, MenuCategory.PIZZA, 10000L);
        assertThat(item.getIsAvailable()).isTrue();
    }

    @Test
    @DisplayName("MenuItem allergensDeclared defaults to false")
    void menuItem_allergensDeclaredDefaultsFalse() {
        MenuItem item = new MenuItem("Test", Cuisine.ITALIAN, MenuCategory.PIZZA, 10000L);
        assertThat(item.isAllergensDeclared()).isFalse();
    }

    // ── MenuController safety floor (delegation) ──────────────────────────────

    @Test
    @DisplayName("createMenuItem via service — getMenuItemById returns empty for unknown id")
    void getMenuItemById_returnsEmptyForUnknown() {
        when(menuItemRepository.findById("unknown")).thenReturn(Optional.empty());

        Optional<MenuItem> result = menuService.getMenuItemById("unknown");

        assertThat(result).isEmpty();
    }
}
```

- [ ] **Step 2: Run the tests**

```powershell
cd commerce-service && mvn test -pl . -Dtest=MenuServiceTest "-Dmaven.test.skip=false"
```
Expected: All tests PASS (these test existing behaviour — they must pass before any changes to MenuService)

- [ ] **Step 3: Commit**

```bash
git add commerce-service/src/test/java/com/MaSoVa/commerce/menu/service/MenuServiceTest.java
git commit -m "test(commerce): add MenuService safety floor tests before Global-1 changes"
```

---

## Task 4: Enforcement gate + declareAllergens in MenuService

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/service/MenuService.java`

- [ ] **Step 1: Write the failing tests first (add to MenuServiceTest.java)**

Add these test methods to `MenuServiceTest`:

```java
    // ── Enforcement gate tests ────────────────────────────────────────────────

    @Test
    @DisplayName("createMenuItem throws when isAvailable=true but allergensDeclared=false")
    void createMenuItem_throwsWhenAvailableWithoutDeclaration() {
        baseItem.setIsAvailable(true);
        baseItem.setAllergensDeclared(false);

        assertThatThrownBy(() -> menuService.createMenuItem(baseItem))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("allergens must be declared");
    }

    @Test
    @DisplayName("createMenuItem succeeds when isAvailable=true and allergensDeclared=true")
    void createMenuItem_succeedsWhenDeclared() {
        baseItem.setIsAvailable(true);
        baseItem.setAllergensDeclared(true);
        baseItem.setAllergens(Set.of(AllergenType.MILK, AllergenType.EGGS));
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(baseItem);

        MenuItem result = menuService.createMenuItem(baseItem);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createMenuItem succeeds when isAvailable=false regardless of declaration")
    void createMenuItem_succeedsWhenUnavailable() {
        baseItem.setIsAvailable(false);
        baseItem.setAllergensDeclared(false);
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(baseItem);

        MenuItem result = menuService.createMenuItem(baseItem);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("setAvailability throws when setting true without declaration")
    void setAvailability_throwsWithoutDeclaration() {
        baseItem.setAllergensDeclared(false);
        when(menuItemRepository.findById("item-1")).thenReturn(Optional.of(baseItem));

        assertThatThrownBy(() -> menuService.setAvailability("item-1", true))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("allergens must be declared");
    }

    @Test
    @DisplayName("declareAllergens sets allergensDeclared=true with provided allergens")
    void declareAllergens_setsAllergens() {
        when(menuItemRepository.findById("item-1")).thenReturn(Optional.of(baseItem));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.declareAllergens("item-1", Set.of(AllergenType.MILK, AllergenType.EGGS), false);

        assertThat(result.isAllergensDeclared()).isTrue();
        assertThat(result.getAllergens()).containsExactlyInAnyOrder(AllergenType.MILK, AllergenType.EGGS);
    }

    @Test
    @DisplayName("declareAllergens with allergenFree=true sets empty allergens and declared=true")
    void declareAllergens_allergenFree() {
        when(menuItemRepository.findById("item-1")).thenReturn(Optional.of(baseItem));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.declareAllergens("item-1", Set.of(), true);

        assertThat(result.isAllergensDeclared()).isTrue();
        assertThat(result.getAllergens()).isEmpty();
    }
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```powershell
mvn test -pl commerce-service -Dtest=MenuServiceTest "-Dmaven.test.skip=false"
```
Expected: FAIL — `createMenuItem_throwsWhenAvailableWithoutDeclaration` and others fail because the enforcement logic doesn't exist yet.

- [ ] **Step 3: Add the enforcement gate to MenuService**

Add this private method near the top of MenuService (after the field declarations):

```java
    private void enforceAllergenGate(MenuItem item) {
        if (Boolean.TRUE.equals(item.getIsAvailable()) && !item.isAllergensDeclared()) {
            throw new BusinessException("Allergens must be declared before making a menu item available. Use PATCH /api/menu/{id}/allergens first.");
        }
    }
```

- [ ] **Step 4: Apply the gate in createMenuItem**

Find in MenuService:
```java
    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem createMenuItem(MenuItem menuItem) {
        menuItem.setCreatedAt(LocalDateTime.now());
        menuItem.setUpdatedAt(LocalDateTime.now());
        return menuItemRepository.save(menuItem);
    }
```

Replace with:
```java
    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem createMenuItem(MenuItem menuItem) {
        enforceAllergenGate(menuItem);
        menuItem.setCreatedAt(LocalDateTime.now());
        menuItem.setUpdatedAt(LocalDateTime.now());
        return menuItemRepository.save(menuItem);
    }
```

- [ ] **Step 5: Apply the gate in updateMenuItem**

In the `updateMenuItem` method, after all the `existingItem.set*` calls and before `return menuItemRepository.save(existingItem)`, add:

```java
                enforceAllergenGate(existingItem);
```

The end of the map lambda should look like:

```java
                existingItem.setAllergens(updatedMenuItem.getAllergens());
                existingItem.setAllergensDeclared(updatedMenuItem.isAllergensDeclared());
                existingItem.setPreparationInstructions(updatedMenuItem.getPreparationInstructions());
                existingItem.setStoreId(updatedMenuItem.getStoreId());
                existingItem.setDisplayOrder(updatedMenuItem.getDisplayOrder());
                existingItem.setTags(updatedMenuItem.getTags());
                existingItem.setIsRecommended(updatedMenuItem.getIsRecommended());
                existingItem.setUpdatedAt(LocalDateTime.now());
                enforceAllergenGate(existingItem);
                return menuItemRepository.save(existingItem);
```

- [ ] **Step 6: Apply the gate in setAvailability**

Find:
```java
    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem setAvailability(String id, boolean isAvailable) {
        return menuItemRepository.findById(id)
            .map(item -> {
                item.setIsAvailable(isAvailable);
                item.setUpdatedAt(LocalDateTime.now());
                return menuItemRepository.save(item);
            })
            .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }
```

Replace with:
```java
    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem setAvailability(String id, boolean isAvailable) {
        return menuItemRepository.findById(id)
            .map(item -> {
                item.setIsAvailable(isAvailable);
                item.setUpdatedAt(LocalDateTime.now());
                enforceAllergenGate(item);
                return menuItemRepository.save(item);
            })
            .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }
```

- [ ] **Step 7: Add declareAllergens method to MenuService**

Add after `setAvailability`:

```java
    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem declareAllergens(String id, Set<AllergenType> allergens, boolean allergenFree) {
        return menuItemRepository.findById(id)
            .map(item -> {
                item.setAllergens(allergenFree ? new HashSet<>() : allergens);
                item.setAllergensDeclared(true);
                item.setUpdatedAt(LocalDateTime.now());
                return menuItemRepository.save(item);
            })
            .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }
```

Add the required imports to MenuService if not already present:
```java
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.exception.BusinessException;
import java.util.HashSet;
import java.util.Set;
```

- [ ] **Step 8: Run the tests**

```powershell
mvn test -pl commerce-service -Dtest=MenuServiceTest "-Dmaven.test.skip=false"
```
Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/menu/service/MenuService.java
git add commerce-service/src/test/java/com/MaSoVa/commerce/menu/service/MenuServiceTest.java
git commit -m "feat(commerce): add allergen enforcement gate and declareAllergens() to MenuService"
```

---

## Task 5: MenuItemRequest DTO + AllergenDeclarationRequest + MenuController endpoint

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/MenuItemRequest.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/AllergenDeclarationRequest.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/menu/controller/MenuControllerTest.java`

- [ ] **Step 1: Update MenuItemRequest.java**

Change:
```java
    private List<String> allergens;
```
To:
```java
    private Set<AllergenType> allergens = new HashSet<>();
    private boolean allergensDeclared = false;
```

Add imports:
```java
import com.MaSoVa.shared.enums.AllergenType;
import java.util.HashSet;
import java.util.Set;
```

Update getter/setter:
```java
    public Set<AllergenType> getAllergens() { return allergens; }
    public void setAllergens(Set<AllergenType> allergens) { this.allergens = allergens; }

    public boolean isAllergensDeclared() { return allergensDeclared; }
    public void setAllergensDeclared(boolean allergensDeclared) { this.allergensDeclared = allergensDeclared; }
```

Remove the old `List<String> allergens` getter/setter.

- [ ] **Step 2: Create AllergenDeclarationRequest.java**

```java
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
```

- [ ] **Step 3: Write the controller test first**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/menu/controller/MenuControllerTest.java`:

```java
package com.MaSoVa.commerce.menu.controller;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.exception.BusinessException;
import com.MaSoVa.commerce.menu.dto.AllergenDeclarationRequest;
import com.MaSoVa.commerce.menu.service.MenuService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MenuController.class)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MenuService menuService;

    @Test
    @DisplayName("GET /api/menu/public/{id} returns 200 for existing item")
    void getMenuItem_returns200() throws Exception {
        MenuItem item = new MenuItem("Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        item.setId("item-1");
        item.setAllergensDeclared(true);
        when(menuService.getMenuItemById("item-1")).thenReturn(Optional.of(item));

        mockMvc.perform(get("/api/menu/public/item-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Pizza"));
    }

    @Test
    @DisplayName("GET /api/menu/public/{id} returns 404 for missing item")
    void getMenuItem_returns404() throws Exception {
        when(menuService.getMenuItemById("bad-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/menu/public/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/menu/{id}/allergens returns 200 with valid body")
    void declareAllergens_returns200() throws Exception {
        MenuItem declared = new MenuItem("Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        declared.setId("item-1");
        declared.setAllergensDeclared(true);
        declared.setAllergens(Set.of(AllergenType.MILK, AllergenType.EGGS));

        when(menuService.declareAllergens(eq("item-1"), anySet(), eq(false))).thenReturn(declared);

        AllergenDeclarationRequest req = new AllergenDeclarationRequest();
        req.setAllergens(Set.of(AllergenType.MILK, AllergenType.EGGS));
        req.setAllergenFree(false);

        mockMvc.perform(patch("/api/menu/item-1/allergens")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.allergensDeclared").value(true));
    }

    @Test
    @DisplayName("PATCH /api/menu/{id}/allergens returns 400 for invalid AllergenType")
    void declareAllergens_returns400ForInvalidEnum() throws Exception {
        mockMvc.perform(patch("/api/menu/item-1/allergens")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"allergens\":[\"INVALID_ALLERGEN\"],\"allergenFree\":false}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/menu/items returns 400 when name is missing")
    void createMenuItem_returns400WhenNameMissing() throws Exception {
        mockMvc.perform(post("/api/menu/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":29900}"))
            .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 4: Run the controller tests to see them fail**

```powershell
mvn test -pl commerce-service -Dtest=MenuControllerTest "-Dmaven.test.skip=false"
```
Expected: `PATCH /api/menu/{id}/allergens returns 200` FAILS (endpoint doesn't exist yet). Others may pass already.

- [ ] **Step 5: Add the allergens endpoint to MenuController**

Add this import to MenuController:
```java
import com.MaSoVa.commerce.menu.dto.AllergenDeclarationRequest;
import com.MaSoVa.shared.enums.AllergenType;
```

Add this method to MenuController after the existing availability endpoints:

```java
    @PatchMapping("/items/{id}/allergens")
    public ResponseEntity<MenuItem> declareAllergens(
            @PathVariable String id,
            @RequestBody AllergenDeclarationRequest request) {
        MenuItem updated = menuService.declareAllergens(id, request.getAllergens(), request.isAllergenFree());
        return ResponseEntity.ok(updated);
    }
```

- [ ] **Step 6: Run the tests**

```powershell
mvn test -pl commerce-service -Dtest=MenuControllerTest "-Dmaven.test.skip=false"
```
Expected: All tests PASS.

- [ ] **Step 7: Compile full commerce-service**

```powershell
mvn compile -pl commerce-service "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/MenuItemRequest.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/menu/dto/AllergenDeclarationRequest.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java
git add commerce-service/src/test/java/com/MaSoVa/commerce/menu/controller/MenuControllerTest.java
git commit -m "feat(commerce): add PATCH /api/menu/{id}/allergens endpoint for allergen declaration"
```

---

## Task 6: Customer allergen alerts (core-service)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/dto/request/UpdatePreferencesRequest.java`

- [ ] **Step 1: Update Customer.CustomerPreferences inner class**

In `Customer.java`, find the `CustomerPreferences` inner class. Change:
```java
        private Set<String> allergens = new HashSet<>();
```
To:
```java
        private Set<AllergenType> allergenAlerts = new HashSet<>();
```

Update the getter/setter:
```java
        public Set<AllergenType> getAllergenAlerts() { return allergenAlerts; }
        public void setAllergenAlerts(Set<AllergenType> allergenAlerts) { this.allergenAlerts = allergenAlerts; }
```
Remove the old `getAllergens()`/`setAllergens()` pair.

Add import at the top of `Customer.java`:
```java
import com.MaSoVa.shared.enums.AllergenType;
```

- [ ] **Step 2: Update UpdatePreferencesRequest.java**

Change:
```java
    private Set<String> allergens;
```
To:
```java
    private Set<AllergenType> allergenAlerts;
```

Update getter/setter:
```java
    public Set<AllergenType> getAllergenAlerts() { return allergenAlerts; }
    public void setAllergenAlerts(Set<AllergenType> allergenAlerts) { this.allergenAlerts = allergenAlerts; }
```
Remove old `getAllergens()`/`setAllergens()` pair.

Add import:
```java
import com.MaSoVa.shared.enums.AllergenType;
```

- [ ] **Step 3: Find where UpdatePreferencesRequest is applied and update it**

Search for usages of `.getAllergens()` or `.setAllergens()` in core-service:

```powershell
Select-String -Path "core-service/src/main/java/**/*.java" -Pattern "getAllergens|setAllergens" -Recurse
```

For each file found, rename the call from `getAllergens()`→`getAllergenAlerts()` and `setAllergens()`→`setAllergenAlerts()`.

- [ ] **Step 4: Compile core-service**

```powershell
mvn compile -pl core-service "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java
git add core-service/src/main/java/com/MaSoVa/core/customer/dto/request/UpdatePreferencesRequest.java
git commit -m "feat(core): rename customer allergens to allergenAlerts, type to Set<AllergenType>"
```

---

## Task 7: MongoDB migration script

**Files:**
- Create: `scripts/migrate-allergens.js`

- [ ] **Step 1: Create the migration script**

```javascript
// migrate-allergens.js
// Run with: mongosh mongodb://localhost:27017/masova migrate-allergens.js
// Resets all menu_items: allergens=[], allergensDeclared=false, isAvailable=false
// Managers must re-declare allergens before items can go live.

const db = connect('mongodb://localhost:27017/masova');

const result = db.menu_items.updateMany(
  {},
  {
    $set: {
      allergens: [],
      allergensDeclared: false,
      isAvailable: false
    },
    $unset: {
      // Remove old free-text allergen data from NutritionalInfo if present
      "nutritionalInfo.allergens": ""
    }
  }
);

print(`Migration complete. Modified ${result.modifiedCount} menu items.`);
print("All items set to: allergensDeclared=false, isAvailable=false, allergens=[]");
print("Managers must re-declare allergens via PATCH /api/menu/{id}/allergens before items go live.");
```

- [ ] **Step 2: Test the migration script against dev MongoDB**

On the Dell, run:
```powershell
mongosh mongodb://localhost:27017/masova migrate-allergens.js
```
Expected output: `Migration complete. Modified N menu items.`

Verify in mongosh:
```javascript
db.menu_items.findOne({}, { allergens: 1, allergensDeclared: 1, isAvailable: 1 })
```
Expected: `{ allergens: [], allergensDeclared: false, isAvailable: false }`

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-allergens.js
git commit -m "chore: add allergen migration script — resets all menu items to undeclared"
```

---

## Task 8: Update MenuTestDataBuilder

**Files:**
- Modify: `shared-models/src/test/java/com/MaSoVa/shared/test/builders/MenuTestDataBuilder.java`

- [ ] **Step 1: Update the builder defaults**

The builder currently has `List<String> allergens = List.of("Gluten", "Dairy")` and `withAllergens(List<String>)`. Update to use enum names and add `allergensDeclared`.

Change field declarations:
```java
    private List<String> allergens = List.of("CEREALS_GLUTEN", "MILK");
    private boolean allergensDeclared = true;
```

Update the `withAllergens` method signature:
```java
    public MenuTestDataBuilder withAllergens(List<String> allergens) {
        this.allergens = allergens;
        return this;
    }

    public MenuTestDataBuilder withAllergensDeclared(boolean allergensDeclared) {
        this.allergensDeclared = allergensDeclared;
        return this;
    }
```

Update `build()` to include `allergensDeclared`:
```java
        menuItem.put("allergens", allergens);
        menuItem.put("allergensDeclared", allergensDeclared);
```

Update all static factory methods that set empty allergens to also default `allergensDeclared=true` (since they have allergens=[] meaning allergen-free, which IS a valid declaration):

In `aBiryaniItem()`, `aDosaItem()`:
```java
                .withAllergens(List.of())
                .withAllergensDeclared(true)
```

In `aBeverageItem()` (dairy → MILK):
```java
                .withAllergens(List.of("MILK"))
                .withAllergensDeclared(true)
```

- [ ] **Step 2: Compile shared-models**

```powershell
mvn compile -pl shared-models "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/test/java/com/MaSoVa/shared/test/builders/MenuTestDataBuilder.java
git commit -m "chore(shared): update MenuTestDataBuilder — allergens as enum names, add allergensDeclared"
```

---

## Task 9: Frontend constants + menuApi type updates

**Files:**
- Create: `frontend/src/constants/allergens.ts`
- Modify: `frontend/src/store/api/menuApi.ts`
- Modify: `frontend/src/store/api/customerApi.ts`

- [ ] **Step 1: Create allergens.ts constants**

```typescript
// frontend/src/constants/allergens.ts

export type AllergenType =
  | 'CELERY'
  | 'CEREALS_GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'LUPIN'
  | 'MILK'
  | 'MOLLUSCS'
  | 'MUSTARD'
  | 'NUTS'
  | 'PEANUTS'
  | 'SESAME'
  | 'SOYA'
  | 'SULPHUR_DIOXIDE';

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  CELERY: 'Celery',
  CEREALS_GLUTEN: 'Cereals containing gluten',
  CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs',
  FISH: 'Fish',
  LUPIN: 'Lupin',
  MILK: 'Milk',
  MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard',
  NUTS: 'Tree nuts',
  PEANUTS: 'Peanuts',
  SESAME: 'Sesame',
  SOYA: 'Soya',
  SULPHUR_DIOXIDE: 'Sulphur dioxide and sulphites',
};

export const ALLERGEN_SHORT: Record<AllergenType, string> = {
  CELERY: 'CEL',
  CEREALS_GLUTEN: 'GLU',
  CRUSTACEANS: 'CRU',
  EGGS: 'EGG',
  FISH: 'FSH',
  LUPIN: 'LUP',
  MILK: 'MLK',
  MOLLUSCS: 'MOL',
  MUSTARD: 'MUS',
  NUTS: 'NUT',
  PEANUTS: 'PNT',
  SESAME: 'SES',
  SOYA: 'SOY',
  SULPHUR_DIOXIDE: 'SUL',
};

export const ALL_ALLERGENS: AllergenType[] = Object.keys(ALLERGEN_LABELS) as AllergenType[];
```

- [ ] **Step 2: Update menuApi.ts interfaces**

In `frontend/src/store/api/menuApi.ts`:

Add import at the top:
```typescript
import { AllergenType } from '../../constants/allergens';
```

In the `NutritionalInfo` interface, remove:
```typescript
  allergens?: string[];
```

In the `MenuItem` interface, change:
```typescript
  allergens?: string[];
```
To:
```typescript
  allergens?: AllergenType[];
  allergensDeclared?: boolean;
```

In the `MenuItemRequest` interface, change:
```typescript
  allergens?: string[];
```
To:
```typescript
  allergens?: AllergenType[];
  allergensDeclared?: boolean;
```

Add a new `AllergenDeclarationRequest` interface:
```typescript
export interface AllergenDeclarationRequest {
  allergens: AllergenType[];
  allergenFree: boolean;
}
```

Add a new endpoint in the `menuApi` endpoints builder (after `deleteAllMenuItems`):
```typescript
    declareAllergens: builder.mutation<MenuItem, { id: string; data: AllergenDeclarationRequest }>({
      query: ({ id, data }) => ({
        url: `/api/menu/items/${id}/allergens`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        price: response.basePrice,
      }),
      invalidatesTags: ['Menu'],
    }),
```

Export the new hook at the bottom of the file:
```typescript
  useDeclareAllergensMutation,
```

- [ ] **Step 3: Update customerApi.ts**

In `frontend/src/store/api/customerApi.ts`, find the customer preferences type or the `UpdatePreferencesRequest` type definition and change:
```typescript
  allergens?: string[];
```
To:
```typescript
  allergenAlerts?: AllergenType[];
```
Add import: `import { AllergenType } from '../../constants/allergens';`

- [ ] **Step 4: Type-check the frontend**

On Mac:
```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors (or only pre-existing errors unrelated to allergens).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/constants/allergens.ts
git add frontend/src/store/api/menuApi.ts
git add frontend/src/store/api/customerApi.ts
git commit -m "feat(frontend): add AllergenType constants and update menuApi/customerApi types"
```

---

## Task 10: RecipeManagementPage — 14-checkbox allergen grid

**Files:**
- Modify: `frontend/src/pages/manager/RecipeManagementPage.tsx`

- [ ] **Step 1: Write the Vitest test first**

Create `frontend/src/pages/manager/RecipeManagementPage.allergen.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import { ALL_ALLERGENS, ALLERGEN_LABELS } from '../../../constants/allergens';

// Minimal mock store
const mockStore = configureStore({ reducer: { menuApi: () => ({}) } });

// Mock the RTK Query hooks used by RecipeManagementPage
vi.mock('../../../store/api/menuApi', () => ({
  useGetAllMenuItemsQuery: () => ({ data: [], isLoading: false }),
  useDeclareAllergensMutation: () => [vi.fn(), { isLoading: false }],
  useCreateMenuItemMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateMenuItemMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteMenuItemMutation: () => [vi.fn(), { isLoading: false }],
  useToggleAvailabilityMutation: () => [vi.fn(), { isLoading: false }],
  useSetAvailabilityMutation: () => [vi.fn(), { isLoading: false }],
}));

describe('RecipeManagementPage — allergen grid', () => {
  it('renders 14 allergen checkboxes when item is selected for allergen declaration', async () => {
    // This test verifies the allergen grid component in isolation
    // Import the AllergenGrid component directly once extracted
    const { AllergenGrid } = await import('../../../pages/manager/RecipeManagementPage');

    render(<AllergenGrid selectedAllergens={[]} onChange={vi.fn()} allergenFree={false} onAllergenFreeChange={vi.fn()} />);

    ALL_ALLERGENS.forEach(allergen => {
      expect(screen.getByLabelText(ALLERGEN_LABELS[allergen])).toBeInTheDocument();
    });
  });

  it('disables all 14 checkboxes when allergenFree is true', async () => {
    const { AllergenGrid } = await import('../../../pages/manager/RecipeManagementPage');

    render(<AllergenGrid selectedAllergens={[]} onChange={vi.fn()} allergenFree={true} onAllergenFreeChange={vi.fn()} />);

    ALL_ALLERGENS.forEach(allergen => {
      expect(screen.getByLabelText(ALLERGEN_LABELS[allergen])).toBeDisabled();
    });
  });

  it('calls onChange when a checkbox is clicked', async () => {
    const { AllergenGrid } = await import('../../../pages/manager/RecipeManagementPage');
    const onChange = vi.fn();

    render(<AllergenGrid selectedAllergens={[]} onChange={onChange} allergenFree={false} onAllergenFreeChange={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Milk'));
    expect(onChange).toHaveBeenCalledWith(['MILK']);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd frontend && npx vitest run src/pages/manager/RecipeManagementPage.allergen.test.tsx
```
Expected: FAIL — `AllergenGrid` is not exported yet.

- [ ] **Step 3: Add AllergenGrid exported component to RecipeManagementPage.tsx**

At the top of `RecipeManagementPage.tsx`, add imports:
```typescript
import { AllergenType, ALL_ALLERGENS, ALLERGEN_LABELS } from '../../constants/allergens';
import { useDeclareAllergensMutation } from '../../store/api/menuApi';
```

Add this exported component before the main `RecipeManagementPage` component:

```typescript
export interface AllergenGridProps {
  selectedAllergens: AllergenType[];
  onChange: (allergens: AllergenType[]) => void;
  allergenFree: boolean;
  onAllergenFreeChange: (value: boolean) => void;
}

export const AllergenGrid: React.FC<AllergenGridProps> = ({
  selectedAllergens,
  onChange,
  allergenFree,
  onAllergenFreeChange,
}) => {
  const toggle = (allergen: AllergenType) => {
    if (selectedAllergens.includes(allergen)) {
      onChange(selectedAllergens.filter(a => a !== allergen));
    } else {
      onChange([...selectedAllergens, allergen]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {ALL_ALLERGENS.map(allergen => (
          <label
            key={allergen}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: allergenFree ? 'not-allowed' : 'pointer',
              opacity: allergenFree ? 0.4 : 1, fontSize: '0.875rem',
            }}
          >
            <input
              type="checkbox"
              aria-label={ALLERGEN_LABELS[allergen]}
              checked={selectedAllergens.includes(allergen)}
              disabled={allergenFree}
              onChange={() => toggle(allergen)}
            />
            {ALLERGEN_LABELS[allergen]}
          </label>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={allergenFree}
          onChange={e => {
            onAllergenFreeChange(e.target.checked);
            if (e.target.checked) onChange([]);
          }}
        />
        This item contains no allergens
      </label>
    </div>
  );
};
```

Then integrate `AllergenGrid` and the `useDeclareAllergensMutation` hook into the existing item editing flow in `RecipeManagementPage`. Find the section that handles item editing/saving (look for the form submit or save handler), and:

1. Add state: `const [declareAllergens] = useDeclareAllergensMutation();`
2. Add state: `const [selectedAllergens, setSelectedAllergens] = useState<AllergenType[]>([]);`
3. Add state: `const [allergenFree, setAllergenFree] = useState(false);`
4. Render `<AllergenGrid>` in the item edit panel
5. On save, call `declareAllergens({ id: item.id, data: { allergens: selectedAllergens, allergenFree } })`

Also add the pending badge. Before the item list, add:

```typescript
{items.filter(i => !i.allergensDeclared).length > 0 && (
  <div style={{
    background: 'rgba(255, 165, 0, 0.15)', border: '1px solid orange',
    borderRadius: 8, padding: '8px 16px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <span style={{ fontWeight: 700, color: 'orange' }}>
      ⚠ {items.filter(i => !i.allergensDeclared).length} items pending allergen review
    </span>
    <button onClick={() => setFilter('undeclared')} style={{ fontSize: '0.8rem', color: 'orange', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
      View items
    </button>
  </div>
)}
```

- [ ] **Step 4: Run the tests**

```bash
cd frontend && npx vitest run src/pages/manager/RecipeManagementPage.allergen.test.tsx
```
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/manager/RecipeManagementPage.tsx
git add frontend/src/pages/manager/RecipeManagementPage.allergen.test.tsx
git commit -m "feat(frontend): add 14-checkbox allergen grid and pending review badge to RecipeManagementPage"
```

---

## Task 11: KitchenDisplayPage — allergen badges

**Files:**
- Modify: `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`

- [ ] **Step 1: Write the test**

Create `frontend/src/pages/kitchen/KitchenDisplayPage.allergen.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllergenBadge, AllergenBadgeList } from '../../pages/kitchen/KitchenDisplayPage';

describe('KitchenDisplayPage — allergen badges', () => {
  it('renders a badge with the short allergen code', () => {
    render(<AllergenBadge allergen="MILK" />);
    expect(screen.getByText('MLK')).toBeInTheDocument();
  });

  it('renders amber-coloured badge', () => {
    const { container } = render(<AllergenBadge allergen="EGGS" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.background).toContain('255, 165, 0'); // orange/amber
  });

  it('renders no badges when allergens array is empty', () => {
    const { container } = render(<AllergenBadgeList allergens={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('renders one badge per allergen', () => {
    render(<AllergenBadgeList allergens={['MILK', 'EGGS', 'PEANUTS']} />);
    expect(screen.getByText('MLK')).toBeInTheDocument();
    expect(screen.getByText('EGG')).toBeInTheDocument();
    expect(screen.getByText('PNT')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd frontend && npx vitest run src/pages/kitchen/KitchenDisplayPage.allergen.test.tsx
```
Expected: FAIL — `AllergenBadge` and `AllergenBadgeList` not exported.

- [ ] **Step 3: Add exported badge components to KitchenDisplayPage.tsx**

Add this import at the top:
```typescript
import { AllergenType, ALLERGEN_SHORT } from '../../constants/allergens';
```

Add these exported components before the main `KitchenDisplayPage` component:

```typescript
export const AllergenBadge: React.FC<{ allergen: AllergenType }> = ({ allergen }) => (
  <span
    title={allergen}
    style={{
      display: 'inline-block',
      background: 'rgba(255, 165, 0, 0.2)',
      border: '1px solid rgba(255, 165, 0, 0.6)',
      color: 'orange',
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '2px 5px',
      borderRadius: 4,
      marginRight: 3,
      letterSpacing: '0.05em',
    }}
  >
    {ALLERGEN_SHORT[allergen]}
  </span>
);

export const AllergenBadgeList: React.FC<{ allergens: AllergenType[] }> = ({ allergens }) => {
  if (!allergens || allergens.length === 0) return <></>;
  return (
    <span>
      {allergens.map(a => <AllergenBadge key={a} allergen={a} />)}
    </span>
  );
};
```

Then find where order line items are rendered in `KitchenDisplayPage` (the `OrderItem` interface and the JSX that renders `item.name` and `item.toppings`). In that JSX, add after the item name:

```typescript
{/* Allergen badges — need allergens on the line item */}
{(lineItem as any).allergens && (lineItem as any).allergens.length > 0 && (
  <AllergenBadgeList allergens={(lineItem as any).allergens} />
)}
```

Note: The `OrderItem` interface in `KitchenDisplayPage.tsx` currently does not include allergens. Add it:
```typescript
interface OrderItem {
  name: string;
  size: string | null;
  toppings: string[];
  quantity: number;
  allergens?: AllergenType[];
}
```

- [ ] **Step 4: Run the tests**

```bash
cd frontend && npx vitest run src/pages/kitchen/KitchenDisplayPage.allergen.test.tsx
```
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/kitchen/KitchenDisplayPage.tsx
git add frontend/src/pages/kitchen/KitchenDisplayPage.allergen.test.tsx
git commit -m "feat(frontend): add allergen badge components to KitchenDisplayPage"
```

---

## Task 12: MenuPage (customer) — allergen list + warning banner

**Files:**
- Modify: `frontend/src/pages/customer/MenuPage.tsx`

- [ ] **Step 1: Write the test**

Create `frontend/src/pages/customer/MenuPage.allergen.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AllergenWarningBanner } from '../../pages/customer/MenuPage';

describe('MenuPage — allergen warning', () => {
  it('shows warning when item allergen matches customer alert', () => {
    render(
      <AllergenWarningBanner
        itemAllergens={['MILK', 'EGGS']}
        customerAllergenAlerts={['MILK']}
      />
    );
    expect(screen.getByText(/contains allergens you've flagged/i)).toBeInTheDocument();
  });

  it('does not show warning when there is no overlap', () => {
    render(
      <AllergenWarningBanner
        itemAllergens={['CELERY']}
        customerAllergenAlerts={['MILK']}
      />
    );
    expect(screen.queryByText(/contains allergens you've flagged/i)).not.toBeInTheDocument();
  });

  it('does not show warning when customerAllergenAlerts is empty', () => {
    render(
      <AllergenWarningBanner
        itemAllergens={['MILK', 'EGGS']}
        customerAllergenAlerts={[]}
      />
    );
    expect(screen.queryByText(/contains allergens you've flagged/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd frontend && npx vitest run src/pages/customer/MenuPage.allergen.test.tsx
```
Expected: FAIL — `AllergenWarningBanner` not exported.

- [ ] **Step 3: Add AllergenWarningBanner exported component to MenuPage.tsx**

Add import at the top:
```typescript
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';
```

Add this exported component before `MenuPage`:

```typescript
export interface AllergenWarningBannerProps {
  itemAllergens: AllergenType[];
  customerAllergenAlerts: AllergenType[];
}

export const AllergenWarningBanner: React.FC<AllergenWarningBannerProps> = ({
  itemAllergens,
  customerAllergenAlerts,
}) => {
  const matches = itemAllergens.filter(a => customerAllergenAlerts.includes(a));
  if (matches.length === 0) return null;
  return (
    <div style={{
      background: 'rgba(220, 38, 38, 0.12)',
      border: '1px solid rgba(220, 38, 38, 0.4)',
      borderRadius: 8,
      padding: '10px 16px',
      marginBottom: 12,
      color: '#ef4444',
      fontSize: '0.875rem',
      fontWeight: 600,
    }}>
      ⚠ Contains allergens you've flagged: {matches.map(a => ALLERGEN_LABELS[a]).join(', ')}
    </div>
  );
};
```

Then find the item detail rendering section in `MenuPage.tsx` and:
1. Read `customer.preferences.allergenAlerts` from the customer data (already loaded via RTK Query)
2. Render `<AllergenWarningBanner itemAllergens={selectedItem.allergens ?? []} customerAllergenAlerts={customer?.preferences?.allergenAlerts ?? []} />` above the Add to Cart button
3. Also render the full allergen list: `{selectedItem.allergens?.map(a => <span key={a}>{ALLERGEN_LABELS[a]}</span>)}`

- [ ] **Step 4: Run the tests**

```bash
cd frontend && npx vitest run src/pages/customer/MenuPage.allergen.test.tsx
```
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/customer/MenuPage.tsx
git add frontend/src/pages/customer/MenuPage.allergen.test.tsx
git commit -m "feat(frontend): add allergen list and warning banner to customer MenuPage"
```

---

## Task 13: POSSystem — allergen summary on order confirmation

**Files:**
- Modify: `frontend/src/apps/POSSystem/POSSystem.tsx`

- [ ] **Step 1: Add the allergen summary**

In `frontend/src/apps/POSSystem/POSSystem.tsx`, find the order confirmation/review section (where the order total and payment method are shown before completing the order).

Add import:
```typescript
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';
```

Find the order items in the confirmation view. Collect all allergens from all items and display a summary:

```typescript
{/* Allergen summary */}
{(() => {
  const allAllergens = new Set<AllergenType>();
  orderItems.forEach(item => {
    (item.allergens ?? []).forEach((a: AllergenType) => allAllergens.add(a));
  });
  if (allAllergens.size === 0) return null;
  return (
    <div style={{
      background: 'rgba(255,165,0,0.1)',
      border: '1px solid rgba(255,165,0,0.4)',
      borderRadius: 8,
      padding: '8px 14px',
      marginTop: 12,
      fontSize: '0.8rem',
      color: 'orange',
    }}>
      <strong>Allergens in this order:</strong>{' '}
      {Array.from(allAllergens).map(a => ALLERGEN_LABELS[a]).join(', ')}
    </div>
  );
})()}
```

Note: The IIFE `(() => {...})()` pattern is extracted into a variable before `return (` to avoid the TypeScript JSX IIFE issue documented in CLAUDE.md. Alternatively use a helper:

```typescript
const allergenSummary = (() => {
  const allAllergens = new Set<AllergenType>();
  orderItems.forEach(item => {
    (item.allergens ?? []).forEach((a: AllergenType) => allAllergens.add(a));
  });
  if (allAllergens.size === 0) return null;
  return (
    <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.4)', borderRadius: 8, padding: '8px 14px', marginTop: 12, fontSize: '0.8rem', color: 'orange' }}>
      <strong>Allergens in this order:</strong>{' '}
      {Array.from(allAllergens).map(a => ALLERGEN_LABELS[a]).join(', ')}
    </div>
  );
})();
```

Then in the JSX: `{allergenSummary}`

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/apps/POSSystem/POSSystem.tsx
git commit -m "feat(frontend): add allergen summary to POS order confirmation screen"
```

---

## Task 14: ProfilePage — update allergen options to 14 EU values

**Files:**
- Modify: `frontend/src/pages/customer/ProfilePage.tsx`

- [ ] **Step 1: Update the allergenOptions array**

In `ProfilePage.tsx`, find:
```typescript
  const allergenOptions = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'];
```

Replace with:
```typescript
  import { ALL_ALLERGENS, ALLERGEN_LABELS, AllergenType } from '../../constants/allergens';
  // (add at top of file with other imports)
```

And change the options array usage. Find where `allergenOptions.map` is used in the JSX:

```tsx
{allergenOptions.map(a => {
  const sel = (preferencesForm.allergens || []).includes(a);
```

Replace with:
```tsx
{ALL_ALLERGENS.map(allergen => {
  const sel = (preferencesForm.allergenAlerts || []).includes(allergen);
```

And the inner JSX references: change `a` to `allergen`, use `ALLERGEN_LABELS[allergen]` for display.

Also update the `preferencesForm` state initializer. Find:
```typescript
        allergens: customer.preferences?.allergens || [],
```
Replace with:
```typescript
        allergenAlerts: customer.preferences?.allergenAlerts || [],
```

Update any other references to `preferencesForm.allergens` → `preferencesForm.allergenAlerts` in this file.

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/customer/ProfilePage.tsx
git commit -m "feat(frontend): update customer ProfilePage allergen options to 14 EU allergens"
```

---

## Task 15: masova-mobile — ItemDetailScreen allergen chips + warning

**Files:**
- Modify: `/Users/souravamseekarmarti/Projects/masova-mobile/src/types/index.ts`
- Modify: `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/menu/ItemDetailScreen.tsx`
- Modify: `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/profile/ProfileScreen.tsx`

- [ ] **Step 1: Add allergen types to masova-mobile types**

In `/Users/souravamseekarmarti/Projects/masova-mobile/src/types/index.ts`, add before the `MenuItem` interface:

```typescript
export type AllergenType =
  | 'CELERY' | 'CEREALS_GLUTEN' | 'CRUSTACEANS' | 'EGGS' | 'FISH'
  | 'LUPIN' | 'MILK' | 'MOLLUSCS' | 'MUSTARD' | 'NUTS'
  | 'PEANUTS' | 'SESAME' | 'SOYA' | 'SULPHUR_DIOXIDE';

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  CELERY: 'Celery', CEREALS_GLUTEN: 'Cereals containing gluten', CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs', FISH: 'Fish', LUPIN: 'Lupin', MILK: 'Milk', MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard', NUTS: 'Tree nuts', PEANUTS: 'Peanuts', SESAME: 'Sesame',
  SOYA: 'Soya', SULPHUR_DIOXIDE: 'Sulphur dioxide and sulphites',
};

export const ALL_ALLERGEN_TYPES: AllergenType[] = Object.keys(ALLERGEN_LABELS) as AllergenType[];
```

In the `MenuItem` interface, add:
```typescript
  allergens?: AllergenType[];
  allergensDeclared?: boolean;
```

- [ ] **Step 2: Add allergen chips to ItemDetailScreen**

In `ItemDetailScreen.tsx`, add import:
```typescript
import { AllergenType, ALLERGEN_LABELS } from '../../types';
```

Find the section that renders item details (description, price etc.) and add after the description:

```typescript
{/* Allergen list */}
{item?.allergens && item.allergens.length > 0 && (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 }}>
    {item.allergens.map(allergen => (
      <View key={allergen} style={{
        backgroundColor: 'rgba(255,165,0,0.15)',
        borderWidth: 1, borderColor: 'rgba(255,165,0,0.5)',
        borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
      }}>
        <Text style={{ color: 'orange', fontSize: 12, fontWeight: '600' }}>
          {ALLERGEN_LABELS[allergen]}
        </Text>
      </View>
    ))}
  </View>
)}
```

Add the warning card. The customer's allergen alerts need to come from the auth context or a profile API call. Assume `customer.preferences.allergenAlerts` is available from the auth context as `user?.allergenAlerts`. Add above the Add to Cart button:

```typescript
{/* Allergen warning */}
{(() => {
  const alerts: AllergenType[] = (user as any)?.allergenAlerts ?? [];
  const matches = (item?.allergens ?? []).filter(a => alerts.includes(a));
  if (matches.length === 0) return null;
  return (
    <View style={{
      backgroundColor: 'rgba(220,38,38,0.12)',
      borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)',
      borderRadius: 10, padding: 12, marginBottom: 12,
    }}>
      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
        ⚠ Contains allergens you've flagged:{'\n'}
        {matches.map(a => ALLERGEN_LABELS[a]).join(', ')}
      </Text>
    </View>
  );
})()}
```

Note: To avoid IIFE-in-JSX issues in RN (same pattern as web), extract to a variable before `return`:

```typescript
const allergenWarning = (() => {
  const alerts: AllergenType[] = (user as any)?.allergenAlerts ?? [];
  const matches = (item?.allergens ?? []).filter(a => alerts.includes(a));
  if (matches.length === 0) return null;
  return (
    <View style={{ backgroundColor: 'rgba(220,38,38,0.12)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
        ⚠ Contains allergens you've flagged:{'\n'}
        {matches.map(a => ALLERGEN_LABELS[a]).join(', ')}
      </Text>
    </View>
  );
})();
```

Then in JSX: `{allergenWarning}`

- [ ] **Step 3: Update ProfileScreen allergen options**

In `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/profile/ProfileScreen.tsx`, find where allergen preferences are displayed/edited (look for the 9 hardcoded allergen strings). Replace with `ALL_ALLERGEN_TYPES` mapped to `ALLERGEN_LABELS`.

Import at top:
```typescript
import { ALL_ALLERGEN_TYPES, ALLERGEN_LABELS, AllergenType } from '../../types';
```

Replace the hardcoded options list with the constants.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile && npx tsc --noEmit
```
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/types/index.ts src/screens/menu/ItemDetailScreen.tsx src/screens/profile/ProfileScreen.tsx
git commit -m "feat(masova-mobile): add allergen chips and customer warning to ItemDetailScreen"
```

---

## Task 16: MaSoVaCrewApp — KitchenQueueScreen allergen badges

**Files:**
- Modify: `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp/src/store/api/orderApi.ts`
- Modify: `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp/src/screens/kitchen/KitchenQueueScreen.tsx`

- [ ] **Step 1: Add allergens to KitchenOrder line items in orderApi.ts**

In `MaSoVaCrewApp/src/store/api/orderApi.ts`, find:
```typescript
export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; customizations?: string }>;
  specialInstructions?: string;
}
```

Replace with:
```typescript
export type AllergenType =
  | 'CELERY' | 'CEREALS_GLUTEN' | 'CRUSTACEANS' | 'EGGS' | 'FISH'
  | 'LUPIN' | 'MILK' | 'MOLLUSCS' | 'MUSTARD' | 'NUTS'
  | 'PEANUTS' | 'SESAME' | 'SOYA' | 'SULPHUR_DIOXIDE';

export const ALLERGEN_SHORT: Record<AllergenType, string> = {
  CELERY: 'CEL', CEREALS_GLUTEN: 'GLU', CRUSTACEANS: 'CRU', EGGS: 'EGG', FISH: 'FSH',
  LUPIN: 'LUP', MILK: 'MLK', MOLLUSCS: 'MOL', MUSTARD: 'MUS', NUTS: 'NUT',
  PEANUTS: 'PNT', SESAME: 'SES', SOYA: 'SOY', SULPHUR_DIOXIDE: 'SUL',
};

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  CELERY: 'Celery', CEREALS_GLUTEN: 'Cereals containing gluten', CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs', FISH: 'Fish', LUPIN: 'Lupin', MILK: 'Milk', MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard', NUTS: 'Tree nuts', PEANUTS: 'Peanuts', SESAME: 'Sesame',
  SOYA: 'Soya', SULPHUR_DIOXIDE: 'Sulphur dioxide and sulphites',
};

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; customizations?: string; allergens?: AllergenType[] }>;
  specialInstructions?: string;
}
```

- [ ] **Step 2: Add allergen badges to KitchenQueueScreen**

In `KitchenQueueScreen.tsx`, add import:
```typescript
import { AllergenType, ALLERGEN_SHORT, ALLERGEN_LABELS } from '../../store/api/orderApi';
```

Find the line item rendering section:
```typescript
      {item.items.map((lineItem, idx) => (
        <View key={idx} style={styles.lineItem}>
          <Text style={styles.lineItemText}>{lineItem.quantity}× {lineItem.name}</Text>
          {lineItem.customizations ? (
            <Text style={styles.customizations}>{lineItem.customizations}</Text>
          ) : null}
        </View>
      ))}
```

Replace with:
```typescript
      {item.items.map((lineItem, idx) => (
        <View key={idx} style={styles.lineItem}>
          <Text style={styles.lineItemText}>{lineItem.quantity}× {lineItem.name}</Text>
          {lineItem.customizations ? (
            <Text style={styles.customizations}>{lineItem.customizations}</Text>
          ) : null}
          {lineItem.allergens && lineItem.allergens.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {lineItem.allergens.map(allergen => (
                <TouchableOpacity
                  key={allergen}
                  onPress={() => Alert.alert(ALLERGEN_SHORT[allergen], ALLERGEN_LABELS[allergen])}
                  style={{
                    backgroundColor: 'rgba(255,165,0,0.2)',
                    borderWidth: 1, borderColor: 'rgba(255,165,0,0.5)',
                    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: 'orange', fontSize: 10, fontWeight: '700' }}>
                    {ALLERGEN_SHORT[allergen]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp && npx tsc --noEmit
```
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
git add src/store/api/orderApi.ts src/screens/kitchen/KitchenQueueScreen.tsx
git commit -m "feat(MaSoVaCrewApp): add allergen badges to KitchenQueueScreen order cards"
```

---

## Task 17: Final verification

- [ ] **Step 1: Run all backend tests**

On Dell (PowerShell):
```powershell
mvn test -pl shared-models,commerce-service,core-service "-Dmaven.test.skip=false"
```
Expected: All tests PASS. Note counts for each module.

- [ ] **Step 2: Run all frontend tests**

On Mac:
```bash
cd frontend && npx vitest run
```
Expected: All tests PASS.

- [ ] **Step 3: TypeScript check all three JS projects**

```bash
cd frontend && npx tsc --noEmit
cd /Users/souravamseekarmarti/Projects/masova-mobile && npx tsc --noEmit
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp && npx tsc --noEmit
```
Expected: No new errors in any project.

- [ ] **Step 4: Run the migration on dev**

On Dell:
```powershell
mongosh mongodb://localhost:27017/masova C:\path\to\scripts\migrate-allergens.js
```
Expected: Migration complete message. Verify one document manually in mongosh.

- [ ] **Step 5: Manual smoke test**

1. Start commerce-service on Dell
2. `POST /api/menu/items` with `isAvailable: true, allergensDeclared: false` → expect 500/BusinessException
3. `POST /api/menu/items` with `isAvailable: false, allergensDeclared: false` → expect 201 success
4. `PATCH /api/menu/{id}/allergens` with `{ "allergens": ["MILK", "EGGS"], "allergenFree": false }` → expect 200, item shows `allergensDeclared: true`
5. `PATCH /api/menu/{id}/availability/true` on that item → expect 200 success (declared)
6. `PATCH /api/menu/{id}/allergens` with `{ "allergens": [], "allergenFree": true }` on another item → expect 200, allergens empty, allergensDeclared true

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(global-1): final verification — all tests pass, smoke test complete"
```
