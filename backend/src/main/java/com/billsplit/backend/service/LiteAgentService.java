package com.billsplit.backend.service;

import com.billsplit.backend.model.ClaimResult;
import com.billsplit.backend.model.Item;
import com.billsplit.backend.model.Member;
import com.billsplit.backend.repository.ItemRepository;
import com.billsplit.backend.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LiteAgentService {
    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;
    private final ItemClaimService itemClaimService;
    private final SessionEventPublisher sessionEventPublisher;

    public LiteAgentService(ItemRepository itemRepository, MemberRepository memberRepository, ItemClaimService itemClaimService, SessionEventPublisher sessionEventPublisher) {
        this.itemRepository = itemRepository;
        this.memberRepository = memberRepository;
        this.itemClaimService = itemClaimService;
        this.sessionEventPublisher = sessionEventPublisher;
    }

    public void runAgent(String memberId) {
        Member member = memberRepository.findById(UUID.fromString(memberId)).orElseThrow(() -> new RuntimeException("Member not found"));
        if (member.getSession() == null) { // No active session
            return;
        }
        if (member.getConnected() != null && member.getConnected()) { // Already connected
            return;
        }
        if (member.getDietaryPreference() == null || member.getDietaryPreference().isBlank()) { // No dietary preferences
            return;
        }

        String preference = member.getDietaryPreference().trim().toUpperCase();
        List<Item> items = itemRepository.findBySessionId(member.getSession().getId());

        for (Item item: items) {
            if (item.getClaimedBy() != null) {
                continue;
            }
            if (item.getCategory() == null) {
                continue;
            }
            
        }        
    }
}