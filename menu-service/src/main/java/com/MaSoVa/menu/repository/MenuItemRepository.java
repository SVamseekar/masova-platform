package com.MaSoVa.menu.repository;

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
    List<MenuItem> findByStoreIdAndIsAvailableTrue(String storeId);

    // Store-specific queries
    List<MenuItem> findByStoreIdAndCuisineAndIsAvailableTrue(String storeId, Cuisine cuisine);
    List<MenuItem> findByStoreIdAndCategoryAndIsAvailableTrue(String storeId, MenuCategory category);
    List<MenuItem> findByStoreIdAndIsRecommendedTrueAndIsAvailableTrue(String storeId);

    @Query("{ 'dietaryInfo': ?0, 'isAvailable': true }")
    List<MenuItem> findByDietaryTypeAndIsAvailableTrue(DietaryType dietaryType);

    @Query("{ 'storeId': ?0, 'dietaryInfo': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndDietaryTypeAndIsAvailableTrue(String storeId, DietaryType dietaryType);

    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> searchByNameAndIsAvailableTrue(String searchTerm);

    @Query("{ 'storeId': ?0, 'name': { $regex: ?1, $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> searchByStoreIdAndNameAndIsAvailableTrue(String storeId, String searchTerm);

    List<MenuItem> findByIsRecommendedTrueAndIsAvailableTrue();

    @Query("{ 'tags': ?0, 'isAvailable': true }")
    List<MenuItem> findByTagAndIsAvailableTrue(String tag);

    @Query("{ 'storeId': ?0, 'tags': ?1, 'isAvailable': true }")
    List<MenuItem> findByStoreIdAndTagAndIsAvailableTrue(String storeId, String tag);

    List<MenuItem> findAllByOrderByDisplayOrderAsc();

    Long countByCuisine(Cuisine cuisine);
    Long countByCategory(MenuCategory category);

    // Store-specific counts
    Long countByStoreId(String storeId);
    Long countByStoreIdAndIsAvailableTrue(String storeId);
    Long countByStoreIdAndCuisine(String storeId, Cuisine cuisine);
    Long countByStoreIdAndCategory(String storeId, MenuCategory category);
}
