package com.MaSoVa.menu.service;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.menu.repository.MenuItemRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MenuService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    // ========== CREATE ==========

    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem createMenuItem(MenuItem menuItem) {
        menuItem.setCreatedAt(LocalDateTime.now());
        menuItem.setUpdatedAt(LocalDateTime.now());
        return menuItemRepository.save(menuItem);
    }

    @CacheEvict(value = "menuItems", allEntries = true)
    public List<MenuItem> createMenuItems(List<MenuItem> menuItems) {
        menuItems.forEach(item -> {
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
        });
        return menuItemRepository.saveAll(menuItems);
    }

    // ========== READ ==========

    @Cacheable(value = "menuItems", key = "'all'")
    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    @Cacheable(value = "menuItems", key = "'available'")
    public List<MenuItem> getAvailableMenuItems() {
        return menuItemRepository.findByIsAvailableTrue();
    }

    @Cacheable(value = "menuItems", key = "#id")
    public Optional<MenuItem> getMenuItemById(String id) {
        return menuItemRepository.findById(id);
    }

    @Cacheable(value = "menuItems", key = "'cuisine-' + #cuisine")
    public List<MenuItem> getMenuItemsByCuisine(Cuisine cuisine) {
        return menuItemRepository.findByCuisineAndIsAvailableTrue(cuisine);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-cuisine-' + #cuisine")
    public List<MenuItem> getMenuItemsByStoreAndCuisine(String storeId, Cuisine cuisine) {
        return menuItemRepository.findByStoreIdAndCuisineAndIsAvailableTrue(storeId, cuisine);
    }

    @Cacheable(value = "menuItems", key = "'category-' + #category")
    public List<MenuItem> getMenuItemsByCategory(MenuCategory category) {
        return menuItemRepository.findByCategoryAndIsAvailableTrue(category);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-category-' + #category")
    public List<MenuItem> getMenuItemsByStoreAndCategory(String storeId, MenuCategory category) {
        return menuItemRepository.findByStoreIdAndCategoryAndIsAvailableTrue(storeId, category);
    }

    @Cacheable(value = "menuItems", key = "'dietary-' + #dietaryType")
    public List<MenuItem> getMenuItemsByDietaryType(DietaryType dietaryType) {
        return menuItemRepository.findByDietaryTypeAndIsAvailableTrue(dietaryType);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-dietary-' + #dietaryType")
    public List<MenuItem> getMenuItemsByStoreAndDietaryType(String storeId, DietaryType dietaryType) {
        return menuItemRepository.findByStoreIdAndDietaryTypeAndIsAvailableTrue(storeId, dietaryType);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId")
    public List<MenuItem> getMenuItemsByStore(String storeId) {
        return menuItemRepository.findByStoreIdAndIsAvailableTrue(storeId);
    }

    @Cacheable(value = "menuItems", key = "'recommended'")
    public List<MenuItem> getRecommendedItems() {
        return menuItemRepository.findByIsRecommendedTrueAndIsAvailableTrue();
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-recommended'")
    public List<MenuItem> getRecommendedItemsByStore(String storeId) {
        return menuItemRepository.findByStoreIdAndIsRecommendedTrueAndIsAvailableTrue(storeId);
    }

    @Cacheable(value = "menuItems", key = "'tag-' + #tag")
    public List<MenuItem> getMenuItemsByTag(String tag) {
        return menuItemRepository.findByTagAndIsAvailableTrue(tag);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-tag-' + #tag")
    public List<MenuItem> getMenuItemsByStoreAndTag(String storeId, String tag) {
        return menuItemRepository.findByStoreIdAndTagAndIsAvailableTrue(storeId, tag);
    }

    @Cacheable(value = "menuItems", key = "'search-' + #searchTerm")
    public List<MenuItem> searchMenuItems(String searchTerm) {
        return menuItemRepository.searchByNameAndIsAvailableTrue(searchTerm);
    }

    @Cacheable(value = "menuItems", key = "'store-' + #storeId + '-search-' + #searchTerm")
    public List<MenuItem> searchMenuItemsByStore(String storeId, String searchTerm) {
        return menuItemRepository.searchByStoreIdAndNameAndIsAvailableTrue(storeId, searchTerm);
    }

    // ========== UPDATE ==========

    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem updateMenuItem(String id, MenuItem updatedMenuItem) {
        return menuItemRepository.findById(id)
            .map(existingItem -> {
                existingItem.setName(updatedMenuItem.getName());
                existingItem.setDescription(updatedMenuItem.getDescription());
                existingItem.setCuisine(updatedMenuItem.getCuisine());
                existingItem.setCategory(updatedMenuItem.getCategory());
                existingItem.setSubCategory(updatedMenuItem.getSubCategory());
                existingItem.setBasePrice(updatedMenuItem.getBasePrice());

                existingItem.setVariants(updatedMenuItem.getVariants());
                existingItem.setCustomizations(updatedMenuItem.getCustomizations());
                existingItem.setDietaryInfo(updatedMenuItem.getDietaryInfo());
                existingItem.setSpiceLevel(updatedMenuItem.getSpiceLevel());
                existingItem.setNutritionalInfo(updatedMenuItem.getNutritionalInfo());

                existingItem.setImageUrl(updatedMenuItem.getImageUrl());
                existingItem.setPreparationTime(updatedMenuItem.getPreparationTime());
                existingItem.setServingSize(updatedMenuItem.getServingSize());
                existingItem.setIngredients(updatedMenuItem.getIngredients());
                existingItem.setAllergens(updatedMenuItem.getAllergens());
                existingItem.setPreparationInstructions(updatedMenuItem.getPreparationInstructions());
                existingItem.setStoreId(updatedMenuItem.getStoreId());
                existingItem.setDisplayOrder(updatedMenuItem.getDisplayOrder());
                existingItem.setTags(updatedMenuItem.getTags());
                existingItem.setIsRecommended(updatedMenuItem.getIsRecommended());

                existingItem.setUpdatedAt(LocalDateTime.now());

                return menuItemRepository.save(existingItem);
            })
            .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }

    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem toggleAvailability(String id) {
        return menuItemRepository.findById(id)
            .map(item -> {
                item.setIsAvailable(!item.getIsAvailable());
                item.setUpdatedAt(LocalDateTime.now());
                return menuItemRepository.save(item);
            })
            .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }

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

    // ========== DELETE ==========

    @CacheEvict(value = "menuItems", allEntries = true)
    public void deleteMenuItem(String id) {
        menuItemRepository.deleteById(id);
    }

    @CacheEvict(value = "menuItems", allEntries = true)
    public void deleteAllMenuItems() {
        menuItemRepository.deleteAll();
    }

    // ========== STATISTICS ==========

    public long getTotalItemsCount() {
        return menuItemRepository.count();
    }

    public long getTotalItemsCountByStore(String storeId) {
        return menuItemRepository.countByStoreId(storeId);
    }

    public long getAvailableItemsCount() {
        return menuItemRepository.findByIsAvailableTrue().size();
    }

    public long getAvailableItemsCountByStore(String storeId) {
        return menuItemRepository.countByStoreIdAndIsAvailableTrue(storeId);
    }

    public long getItemsCountByCuisine(Cuisine cuisine) {
        return menuItemRepository.countByCuisine(cuisine);
    }

    public long getItemsCountByStoreAndCuisine(String storeId, Cuisine cuisine) {
        return menuItemRepository.countByStoreIdAndCuisine(storeId, cuisine);
    }

    public long getItemsCountByCategory(MenuCategory category) {
        return menuItemRepository.countByCategory(category);
    }

    public long getItemsCountByStoreAndCategory(String storeId, MenuCategory category) {
        return menuItemRepository.countByStoreIdAndCategory(storeId, category);
    }
}
