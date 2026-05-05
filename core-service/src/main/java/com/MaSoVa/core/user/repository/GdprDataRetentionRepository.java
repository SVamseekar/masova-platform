package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.GdprDataRetention;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GdprDataRetentionRepository extends MongoRepository<GdprDataRetention, String> {

    Optional<GdprDataRetention> findByDataType(String dataType);

    List<GdprDataRetention> findByIsActive(boolean isActive);

    List<GdprDataRetention> findByAutoDeleteEnabled(boolean autoDeleteEnabled);
}
