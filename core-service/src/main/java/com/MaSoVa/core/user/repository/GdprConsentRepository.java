package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.enums.ConsentType;
import com.MaSoVa.shared.enums.ConsentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GdprConsentRepository extends MongoRepository<GdprConsent, String> {

    List<GdprConsent> findByUserId(String userId);

    List<GdprConsent> findByUserIdAndConsentType(String userId, ConsentType consentType);

    Optional<GdprConsent> findByUserIdAndConsentTypeAndStatus(String userId, ConsentType consentType, ConsentStatus status);

    List<GdprConsent> findByStatus(ConsentStatus status);

    List<GdprConsent> findByExpiresAtBefore(LocalDateTime dateTime);

    long countByUserIdAndStatus(String userId, ConsentStatus status);

    boolean existsByUserIdAndConsentTypeAndStatus(String userId, ConsentType consentType, ConsentStatus status);
}
