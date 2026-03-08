package com.billsplit.backend.repository;

import com.billsplit.backend.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {
    java.util.List<Item> findBySessionId(UUID sessionId);
}