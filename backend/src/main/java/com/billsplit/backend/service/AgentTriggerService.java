package com.billsplit.backend.service;

import com.billsplit.backend.repository.MemberRepository;
import com.billsplit.backend.model.Member;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgentTriggerService {

    private final MemberRepository memberRepository;
    private final LiteAgentService liteAgentService;
    private final RedisQueueService redisQueueService;

    private static final String DISCONNECT_KEY_PREFIX = "disconnect:";

    public AgentTriggerService(MemberRepository memberRepository,
                                LiteAgentService liteAgentService,
                                RedisQueueService redisQueueService) {
        this.memberRepository = memberRepository;
        this.liteAgentService = liteAgentService;
        this.redisQueueService = redisQueueService;
    }

    @Scheduled(fixedDelay = 15000) // runs every 15 seconds
    public void checkDisconnectedMembers() {
        List<Member> disconnectedMembers = memberRepository.findByConnectedFalse();
        for (Member member : disconnectedMembers) {
            String key = DISCONNECT_KEY_PREFIX + member.getId().toString();
            String sessionId = redisQueueService.getValue(key);
            // Key still exists = still within 2 minute window, don't run agent yet
            // Key expired/gone = 2 minutes passed, run agent
            if (sessionId == null && member.getSession() != null 
                && member.getDietaryPreference() != null 
                && !member.getDietaryPreference().isBlank()) {
                System.out.println("[AgentTriggerService] Running agent for member: " + member.getId());
                liteAgentService.runAgent(member.getId().toString());
            }
        }
    }
}