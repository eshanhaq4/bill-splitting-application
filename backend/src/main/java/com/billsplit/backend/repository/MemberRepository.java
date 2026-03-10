package com.billsplit.backend.repository;

import com.billsplit.backend.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {
    Member findByToken(UUID token);

    Optional<Member> findBySessionIdAndDisplayName(UUID sessionId, String displayName);

    List<Member> findBySessionId(UUID sessionId);
}