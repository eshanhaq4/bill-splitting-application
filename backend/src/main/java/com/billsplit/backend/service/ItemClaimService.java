package com.billsplit.backend.service;

import com.billsplit.backend.model.*;
import com.billsplit.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class ItemClaimService {

    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;
    private final SessionEventPublisher eventPublisher;

    public ItemClaimService(ItemRepository itemRepository, MemberRepository memberRepository, SessionEventPublisher eventPublisher) {
        this.itemRepository = itemRepository;
        this.memberRepository = memberRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ClaimResult claimItem(String itemId, String userId) {
        Item item = itemRepository.findById(UUID.fromString(itemId))
                .orElseThrow(() -> new RuntimeException("ITEM_NOT_FOUND"));

        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("UNAUTHORIZED"));

        String sessionId = item.getSession().getId().toString();

        // Broadcast ITEM_LOCKED immediately
        eventPublisher.publish(sessionId, "ITEM_LOCKED", java.util.Map.of("itemId", itemId));

        try {
            // Atomic conditional update
            if (item.getClaimedBy() != null) {
                eventPublisher.publish(sessionId, "ITEM_UNLOCKED", java.util.Map.of("itemId", itemId));
                ClaimResult result = new ClaimResult();
                result.setSuccess(false);
                result.setErrorCode("ITEM_ALREADY_CLAIMED");
                result.setMessage("Item was already claimed by someone else.");
                result.setItem(item);
                return result;
            }

            item.setClaimedBy(member);
            itemRepository.save(item);

            // Broadcast ITEM_CLAIMED
            eventPublisher.publish(sessionId, "ITEM_CLAIMED", java.util.Map.of(
                "itemId", itemId,
                "claimedBy", userId,
                "displayName", member.getDisplayName()
            ));

            ClaimResult result = new ClaimResult();
            result.setSuccess(true);
            result.setItem(item);
            return result;

        } catch (Exception e) {
            eventPublisher.publish(sessionId, "ITEM_UNLOCKED", java.util.Map.of("itemId", itemId));
            ClaimResult result = new ClaimResult();
            result.setSuccess(false);
            result.setErrorCode("SERVER_ERROR");
            result.setMessage(e.getMessage());
            result.setItem(item);
            return result;
        }
    }

    @Transactional
    public ClaimResult releaseItem(String itemId, String userId) {
        Item item = itemRepository.findById(UUID.fromString(itemId))
                .orElseThrow(() -> new RuntimeException("ITEM_NOT_FOUND"));

        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("UNAUTHORIZED"));

        String sessionId = item.getSession().getId().toString();

        if (item.getClaimedBy() == null || !item.getClaimedBy().getId().equals(member.getId())) {
            ClaimResult result = new ClaimResult();
            result.setSuccess(false);
            result.setErrorCode("UNAUTHORIZED");
            result.setMessage("You cannot release an item you did not claim.");
            result.setItem(item);
            return result;
        }

        item.setClaimedBy(null);
        itemRepository.save(item);

        eventPublisher.publish(sessionId, "ITEM_RELEASED", java.util.Map.of("itemId", itemId));

        ClaimResult result = new ClaimResult();
        result.setSuccess(true);
        result.setItem(item);
        return result;
    }
}