#!/usr/bin/env python3
"""
Script to add recipe data (ingredients and preparation instructions) to existing menu items
Author: Claude Code
Date: October 25, 2025
"""

import json
import requests
import sys

# Configuration
MENU_SERVICE_URL = "http://localhost:8082/api/menu"
RECIPES_FILE = "sample-recipes.json"

def load_recipes():
    """Load recipes from JSON file"""
    try:
        with open(RECIPES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {RECIPES_FILE} not found!")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)

def get_all_menu_items():
    """Fetch all menu items from the menu service"""
    try:
        response = requests.get(f"{MENU_SERVICE_URL}/public")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching menu items: {e}")
        return []

def find_menu_item_by_name(menu_items, item_name):
    """Find a menu item by name (case-insensitive partial match)"""
    item_name_lower = item_name.lower()
    for item in menu_items:
        if item_name_lower in item['name'].lower() or item['name'].lower() in item_name_lower:
            return item
    return None

def update_menu_item(item_id, update_data):
    """Update a menu item with recipe data"""
    try:
        url = f"{MENU_SERVICE_URL}/items/{item_id}"
        response = requests.put(url, json=update_data)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error updating menu item {item_id}: {e}")
        return False

def main():
    print("=" * 60)
    print("MaSoVa Menu Recipe Data Migration")
    print("=" * 60)
    print()

    # Load recipes
    print("Loading recipes from file...")
    recipes = load_recipes()
    print(f"✓ Loaded {len(recipes)} recipes")
    print()

    # Fetch all menu items
    print("Fetching existing menu items...")
    menu_items = get_all_menu_items()
    print(f"✓ Found {len(menu_items)} menu items in database")
    print()

    # Process each recipe
    print("Processing recipes...")
    print("-" * 60)

    updated_count = 0
    not_found_count = 0

    for recipe in recipes:
        item_name = recipe['itemName']
        print(f"\n📝 Processing: {item_name}")

        # Find matching menu item
        menu_item = find_menu_item_by_name(menu_items, item_name)

        if not menu_item:
            print(f"   ⚠️  Item not found in database, skipping...")
            not_found_count += 1
            continue

        print(f"   ✓ Found match: {menu_item['name']} (ID: {menu_item['id']})")

        # Prepare update data
        update_data = {
            "name": menu_item['name'],
            "description": menu_item.get('description'),
            "cuisine": menu_item['cuisine'],
            "category": menu_item['category'],
            "basePrice": menu_item['basePrice'],
            "isAvailable": menu_item.get('isAvailable', True),
            "preparationTime": menu_item.get('preparationTime'),
            "servingSize": menu_item.get('servingSize'),
            "ingredients": recipe['ingredients'],
            "preparationInstructions": recipe['preparationInstructions'],
            "allergens": menu_item.get('allergens', []),
            "dietaryInfo": menu_item.get('dietaryInfo', []),
            "spiceLevel": menu_item.get('spiceLevel'),
            "imageUrl": menu_item.get('imageUrl'),
            "tags": menu_item.get('tags', []),
            "isRecommended": menu_item.get('isRecommended', False),
            "displayOrder": menu_item.get('displayOrder', 0)
        }

        # Update menu item
        if update_menu_item(menu_item['id'], update_data):
            print(f"   ✅ Successfully updated with {len(recipe['ingredients'])} ingredients")
            print(f"   ✅ Added {len(recipe['preparationInstructions'])} preparation steps")
            updated_count += 1
        else:
            print(f"   ❌ Failed to update")

    # Summary
    print()
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"Total recipes processed: {len(recipes)}")
    print(f"✅ Successfully updated: {updated_count}")
    print(f"⚠️  Not found in database: {not_found_count}")
    print(f"❌ Failed to update: {len(recipes) - updated_count - not_found_count}")
    print()

    if updated_count > 0:
        print("🎉 Recipe migration completed successfully!")
    else:
        print("⚠️  No items were updated. Please check if the menu service is running.")

if __name__ == "__main__":
    main()
