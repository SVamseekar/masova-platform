# Global-1: Allergen Law Compliance — Design
**Date:** 2026-04-10  
**Status:** Approved  
**Legal basis:** EU Regulation 1169/2011 — 14 mandatory named allergens  
**Scope:** Backend (shared-models, commerce-service, core-service) + Web frontend + masova-mobile + MaSoVaCrewApp

---

## Summary

Replace the free-text `List<String> allergens` field on `MenuItem` with a typed `Set<AllergenType>` enum covering exactly the 14 EU-mandated allergens. Add an `allergensDeclared` boolean gate — `isAvailable` cannot be `true` until a manager has explicitly declared allergens (or declared the item allergen-free). Apply globally: India stores use the same 14-allergen system as EU stores.

---

## 1. Data Model

### 1.1 New enum: `AllergenType` (shared-models)

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

### 1.2 `MenuItem` changes (shared-models)

| Before | After |
|---|---|
| `List<String> allergens = new ArrayList<>()` | `Set<AllergenType> allergens = new HashSet<>()` |
| _(not present)_ | `boolean allergensDeclared = false` |

`NutritionalInfo.allergens` (`List<String>`) is removed — `MenuItem.allergens` is the single source of truth.

### 1.3 `MenuItemRequest` changes (commerce-service)

| Before | After |
|---|---|
| `List<String> allergens` | `Set<AllergenType> allergens` |
| _(not present)_ | `boolean allergensDeclared` |

### 1.4 `Customer.Preferences` changes (core-service)

| Before | After |
|---|---|
| `Set<String> allergens` | `Set<AllergenType> allergenAlerts` |

### 1.5 MongoDB migration

A one-time migration script run against the `menu_items` collection:
- Sets `allergens = []` (empty array)
- Sets `allergensDeclared = false`
- Sets `isAvailable = false`

All existing items require manager re-declaration before going live. The manager dashboard shows a "Pending allergen review" count so managers know how many items need attention.

---

## 2. Backend Enforcement Gate

### 2.1 Enforcement rule

```
if (menuItem.isAvailable == true && !menuItem.allergensDeclared) → throw BusinessException
```

Applied in:
- `MenuService.createMenuItem()`
- `MenuService.updateMenuItem()`
- `MenuService.setAvailability()` — cannot flip to `true` without declaration

### 2.2 New service method: `declareAllergens()`

```java
public MenuItem declareAllergens(String itemId, Set<AllergenType> allergens, boolean allergenFree)
```

- Sets `allergensDeclared = true`
- Sets `allergens` to the provided set (empty set when `allergenFree = true`)
- This is the **only** code path that sets `allergensDeclared = true`
- Evicts menu cache on save

### 2.3 New endpoint

```
PATCH /api/menu/{id}/allergens
Authorization: MANAGER role required
Body: { "allergens": ["MILK", "EGGS"], "allergenFree": false }
Response 200: updated MenuItem
Response 400: invalid AllergenType value
Response 403: insufficient role
```

### 2.4 `UpdatePreferencesRequest` (core-service)

`allergens: List<String>` → `allergenAlerts: Set<AllergenType>`

The existing `PATCH /api/customers/{id}/preferences` endpoint accepts this request — no new endpoint needed, only the request DTO field changes.

---

## 3. Frontend — Web

### 3.1 RecipeManagementPage

- Replace free-text allergen input with a **14-checkbox grid** — one checkbox per `AllergenType`, displayed with readable labels (e.g. `CEREALS_GLUTEN` → "Cereals containing gluten")
- **"This item contains no allergens"** checkbox at the bottom — when checked, sets `allergenFree: true` and disables the 14 checkboxes
- Save button calls `PATCH /api/menu/{id}/allergens`
- Availability toggle is **disabled** with tooltip "Declare allergens before making item available" until `allergensDeclared = true`

### 3.2 KitchenDisplayPage

- Each order ticket shows allergen icon badges per line item
- Badges use short labels: "GLU", "MILK", "EGG", etc.
- Any allergen present → badge flashes amber
- Items declared allergen-free → no badges shown

### 3.3 POSSystem

- Order confirmation screen shows allergen summary for the full order
- Example: "Contains: MILK, EGGS, NUTS"
- Staff acknowledge before completing the order

### 3.4 MenuPage (customer)

- Item detail shows full allergen list below the description
- If the customer's `allergenAlerts` matches any allergen on the item → red warning banner: "Contains allergens you've flagged"
- Items are never hidden — only warned

### 3.5 ProfilePage

- Allergen options updated from 9 hardcoded strings to all 14 `AllergenType` values with readable labels
- Saves as `allergenAlerts: Set<AllergenType>` via `UpdatePreferencesRequest`

### 3.6 Manager dashboard — menu list

- "Pending allergen review" count badge shown in `RecipeManagementPage` when any items have `allergensDeclared = false`
- Badge is a count with a link that filters the item list to show only undeclared items

---

## 4. Mobile Apps

### 4.1 masova-mobile (customer, RN 0.81)

**Item detail screen:**
- Allergen chip list below item description — readable labels ("Milk", "Eggs")
- If customer's allergen alerts match item allergens → red warning card above Add to Cart button: "Contains allergens you've flagged"

**Profile screen:**
- Allergen preferences updated from 9 hardcoded strings to 14 EU enum values with readable labels

### 4.2 MaSoVaCrewApp (staff, RN 0.83)

**KitchenQueueScreen:**
- Allergen badges per line item on each order card — same amber pattern as web KDS
- Tapping a badge shows the full allergen name
- No new screens — badges slot into the existing order card component

---

## 5. Testing

### 5.1 Safety floor (written BEFORE touching any class)

| Class | Tests |
|---|---|
| `MenuService` | Existing CRUD: create, read by store, read by category, update, delete |
| `MenuItem` | `@NotNull` validations, `isAvailable` default value |
| `MenuController` | Happy path GET/POST/PATCH + 400 validation error responses |

### 5.2 New tests (written alongside implementation)

**Backend:**
- `MenuService.declareAllergens()` — allergen-free declaration, partial set, full set of 14
- `MenuService` enforcement gate — `isAvailable=true` without declaration throws `BusinessException`
- `AllergenType` enum — all 14 values present
- `PATCH /api/menu/{id}/allergens` — 200, 400 (invalid enum value), 403 (wrong role)
- `Customer.Preferences` — `allergenAlerts` stores and retrieves `Set<AllergenType>` correctly
- MongoDB migration script — verified on test collection: all items set to `allergensDeclared=false`, `isAvailable=false`

**Frontend (Vitest):**
- `RecipeManagementPage` — 14 checkboxes render, allergen-free checkbox disables them, save fires `PATCH /api/menu/{id}/allergens`
- `MenuPage` — warning banner appears when customer allergen alert matches item allergen
- `KitchenDisplayPage` — amber badges render per allergen on each ticket line item

**Mobile:**
- masova-mobile item detail — allergen chips render, warning card appears on match
- MaSoVaCrewApp KitchenQueueScreen — allergen badges appear on order cards

---

## 6. What Is Explicitly Out of Scope

- Allergen filtering (hiding items from customer menu) — warn only, never hide
- Per-variant allergen declarations — allergens declared at item level only
- Allergen translation (i18n labels) — deferred to Global-3 (Currency/Locale/i18n phase)
- Aggregator allergen sync — deferred to Global-6

---

## 7. Readable Label Mapping

| Enum value | Display label |
|---|---|
| CELERY | Celery |
| CEREALS_GLUTEN | Cereals containing gluten |
| CRUSTACEANS | Crustaceans |
| EGGS | Eggs |
| FISH | Fish |
| LUPIN | Lupin |
| MILK | Milk |
| MOLLUSCS | Molluscs |
| MUSTARD | Mustard |
| NUTS | Tree nuts |
| PEANUTS | Peanuts |
| SESAME | Sesame |
| SOYA | Soya |
| SULPHUR_DIOXIDE | Sulphur dioxide and sulphites |
