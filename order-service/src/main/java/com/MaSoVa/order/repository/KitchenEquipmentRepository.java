package com.MaSoVa.order.repository;

import com.MaSoVa.order.entity.KitchenEquipment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenEquipmentRepository extends MongoRepository<KitchenEquipment, String> {

    List<KitchenEquipment> findByStoreId(String storeId);

    List<KitchenEquipment> findByStoreIdAndStatus(String storeId, KitchenEquipment.EquipmentStatus status);

    List<KitchenEquipment> findByStoreIdAndType(String storeId, KitchenEquipment.EquipmentType type);

    List<KitchenEquipment> findByStoreIdAndIsOn(String storeId, Boolean isOn);
}
