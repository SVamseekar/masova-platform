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

    @Query("{ 'dietaryInfo': ?0, 'isAvailable': true }")
    List<MenuItem> findByDietaryTypeAndIsAvailableTrue(DietaryType dietaryType);

    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isAvailable': true }")
    List<MenuItem> searchByNameAndIsAvailableTrue(String searchTerm);

    List<MenuItem> findByIsRecommendedTrueAndIsAvailableTrue();

    @Query("{ 'tags': ?0, 'isAvailable': true }")
    List<MenuItem> findByTagAndIsAvailableTrue(String tag);

    List<MenuItem> findAllByOrderByDisplayOrderAsc();

    Long countByCuisine(Cuisine cuisine);
    Long countByCategory(MenuCategory category);
}
