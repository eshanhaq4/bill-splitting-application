package com.billsplit.backend.service;

import com.billsplit.backend.model.ClaimResult;
import com.billsplit.backend.model.Item;
import com.billsplit.backend.model.Member;
import com.billsplit.backend.repository.ItemRepository;
import com.billsplit.backend.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LiteAgentService {
    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;
    private final ItemClaimService itemClaimService;
    private final SessionEventPublisher sessionEventPublisher;
    private final RedisQueueService redisQueueService;

    public LiteAgentService(ItemRepository itemRepository, MemberRepository memberRepository,
                             ItemClaimService itemClaimService, SessionEventPublisher sessionEventPublisher,
                             RedisQueueService redisQueueService) {
        this.itemRepository = itemRepository;
        this.memberRepository = memberRepository;
        this.itemClaimService = itemClaimService;
        this.sessionEventPublisher = sessionEventPublisher;
        this.redisQueueService = redisQueueService;
    }

    public void runAgent(String memberId) {
        // Guard: only run once per member
        String agentRanKey = "agent_ran:" + memberId;
        if (redisQueueService.getValue(agentRanKey) != null) {
            System.out.println("[LiteAgentService] Agent already ran for member: " + memberId);
            return;
        }
        redisQueueService.setValue(agentRanKey, "1", Duration.ofHours(24));

        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Only run for disconnected members with a session
        if (member.getSession() == null) return;
        if (member.getConnected() != null && member.getConnected()) return;

        String preference = member.getDietaryPreference();
        if (preference == null || preference.isBlank() || preference.equalsIgnoreCase("NONE")) return;

        preference = preference.trim().toUpperCase();
        List<Item> items = itemRepository.findBySessionId(member.getSession().getId());

        for (Item item : items) {
            if (item.getClaimedBy() != null) continue;
            if (item.getCategory() == null) continue;

            String category = item.getCategory().trim().toUpperCase();
            boolean shouldClaim = switch (preference) {
                case "VEGAN" -> category.equals("VEGAN");
                case "VEGETARIAN" -> category.equals("VEGAN") || category.equals("VEGETARIAN");
                default -> false;
            };

            if (shouldClaim) {
                ClaimResult result = itemClaimService.claimItem(item.getId().toString(), memberId);
                if (result.isSuccess()) {
                    System.out.println("[LiteAgentService] Agent claimed item: " + item.getName() + " for member: " + member.getDisplayName());
                    sessionEventPublisher.publish(member.getSession().getId().toString(), "AGENT_ACTION", Map.of(
                        "action", "CLAIMED",
                        "itemId", item.getId().toString(),
                        "memberId", member.getId().toString(),
                        "displayName", member.getDisplayName()
                    ));
                }
            }
        }
    }
}