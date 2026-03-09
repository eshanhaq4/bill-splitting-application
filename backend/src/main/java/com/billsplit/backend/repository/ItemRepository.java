package com.billsplit.backend.repository;

import com.billsplit.backend.model.Item;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {

    List<Item> findBySessionId(UUID sessionId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE items SET claimed_by = :memberId WHERE id = :itemId AND claimed_by IS NULL AND locked = false", nativeQuery = true)
    int claimIfAvailable(@Param("itemId") UUID itemId, @Param("memberId") UUID memberId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE items SET claimed_by = NULL WHERE id = :itemId AND claimed_by = :memberId", nativeQuery = true)
    int releaseIfOwned(@Param("itemId") UUID itemId, @Param("memberId") UUID memberId);
}