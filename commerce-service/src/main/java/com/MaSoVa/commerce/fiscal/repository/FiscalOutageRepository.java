package com.MaSoVa.commerce.fiscal.repository;

import com.MaSoVa.commerce.fiscal.entity.FiscalOutageJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FiscalOutageRepository extends JpaRepository<FiscalOutageJpaEntity, Long> {

    Optional<FiscalOutageJpaEntity> findByStoreIdAndSignerSystemAndClosedAtIsNull(String storeId, String signerSystem);

    long countByClosedAtIsNull();
}
