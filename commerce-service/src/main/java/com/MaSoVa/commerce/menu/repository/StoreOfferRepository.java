package com.MaSoVa.commerce.menu.repository;

import com.MaSoVa.commerce.menu.entity.StoreOffer;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StoreOfferRepository extends MongoRepository<StoreOffer, String> {

    /** Active offers for a store that have not passed their last valid day, in display order. */
    @Query(value = "{ 'storeId': ?0, 'active': true, 'validUntil': { $gte: ?1 } }", sort = "{ 'sortOrder': 1 }")
    List<StoreOffer> findCurrentByStoreId(String storeId, LocalDate today);
}
