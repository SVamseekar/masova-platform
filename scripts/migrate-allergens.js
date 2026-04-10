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
print("Managers must re-declare allergens via PATCH /api/menu/items/{id}/allergens before items go live.");
