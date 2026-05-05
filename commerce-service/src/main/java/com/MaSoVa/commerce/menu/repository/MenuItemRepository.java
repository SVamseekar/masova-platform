package com.MaSoVa.commerce.menu.repository;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.DietaryType;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends MongoRepository<MenuItem, String> {

    List<MenuItem> findByIsAvailableTrue();
    List<MenuItem> findByCuisineAndIsAvailableTrue(Cuisine cuisine);
    List<MenuItem> findByCategoryAndIsAvailableTrue(MenuCategory category);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' } }")
    List<MenuItem> findByStoreId(String storeId);  // Get all items for a store (including unavailable) - case-insensitive exact match

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndIsAvailableTrue(String storeId);

    // Store-specific queries - case-insensitive exact match
    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'cuisine': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndCuisineAndIsAvailableTrue(String storeId, Cuisine cuisine);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'category': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndCategoryAndIsAvailableTrue(String storeId, MenuCategory category);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'isRecommended': true, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndIsRecommendedTrueAndIsAvailableTrue(String storeId);

    @Query("{ 'dietaryInfo': ?0, 'isAvailable': true }")
    List<MenuItem> findByDietaryTypeAndIsAvailableTrue(DietaryType dietaryType);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'dietaryInfo': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndDietaryTypeAndIsAvailableTrue(String storeId, DietaryType dietaryType);

    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> searchByNameAndIsAvailableTrue(String searchTerm);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'name': { $regex: ?1, $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> searchByStoreIdAndNameAndIsAvailableTrue(String storeId, String searchTerm);

    List<MenuItem> findByIsRecommendedTrueAndIsAvailableTrue();

    @Query("{ 'tags': ?0, 'isAvailable': true }")
    List<MenuItem> findByTagAndIsAvailableTrue(String tag);

    @Query("{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'tags': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndTagAndIsAvailableTrue(String storeId, String tag);

    List<MenuItem> findAllByOrderByDisplayOrderAsc();

    Long countByCuisine(Cuisine cuisine);
    Long countByCategory(MenuCategory category);

    // Store-specific counts - case-insensitive exact match
    @Query(value = "{ 'storeId': { $regex: '^?0$', $options: 'i' } }", count = true)
    Long countByStoreId(String storeId);

    @Query(value = "{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'isAvailable': true }", count = true)
    Long countByStoreIdAndIsAvailableTrue(String storeId);

    @Query(value = "{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'cuisine': ?1 }", count = true)
    Long countByStoreIdAndCuisine(String storeId, Cuisine cuisine);

    @Query(value = "{ 'storeId': { $regex: '^?0$', $options: 'i' }, 'category': ?1 }", count = true)
    Long countByStoreIdAndCategory(String storeId, MenuCategory category);
}
