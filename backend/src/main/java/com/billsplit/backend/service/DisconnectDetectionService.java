package com.billsplit.backend.service;

import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import com.billsplit.backend.repository.MemberRepository;
import com.billsplit.backend.model.Member;

@Service
public class DisconnectDetectionService {

    private static final long DISCONNECT_TIMEOUT_SECONDS = 120;
    private static final String DISCONNECT_KEY_PREFIX = "disconnect:";

    private final RedisQueueService redisQueueService;
    private final SessionEventPublisher eventPublisher;
    private final MemberRepository memberRepository;
    private final LiteAgentService liteAgentService;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public DisconnectDetectionService(RedisQueueService redisQueueService,
                                       SessionEventPublisher eventPublisher,
                                       MemberRepository memberRepository,
                                       LiteAgentService liteAgentService) {
        this.redisQueueService = redisQueueService;
        this.eventPublisher = eventPublisher;
        this.memberRepository = memberRepository;
        this.liteAgentService = liteAgentService;
    }

    public void onMemberDisconnected(String memberId, String sessionId) {
        memberRepository.findById(java.util.UUID.fromString(memberId)).ifPresent(member -> {
            member.setConnected(false);
            memberRepository.save(member);
        });

        eventPublisher.publish(sessionId, "USER_DISCONNECTED",
            java.util.Map.of("memberId", memberId));

        redisQueueService.setValue(
            DISCONNECT_KEY_PREFIX + memberId,
            sessionId,
            Duration.ofSeconds(DISCONNECT_TIMEOUT_SECONDS)
        );

        // Schedule agent to run after 2 minutes
        scheduler.schedule(() -> {
            System.out.println("[DisconnectDetectionService] 2 min elapsed, triggering agent for member: " + memberId);
            liteAgentService.runAgent(memberId);
        }, DISCONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    public void onMemberReconnected(String memberId, String sessionId) {
        redisQueueService.deleteKey(DISCONNECT_KEY_PREFIX + memberId);

        memberRepository.findById(java.util.UUID.fromString(memberId)).ifPresent(member -> {
            member.setConnected(true);
            memberRepository.save(member);
        });

        eventPublisher.publish(sessionId, "USER_RECONNECTED",
            java.util.Map.of("memberId", memberId));
    }

    public void onMemberDisconnectedByToken(String token, String sessionId) {
        Member member = memberRepository.findByToken(java.util.UUID.fromString(token));
        if (member != null) {
            onMemberDisconnected(member.getId().toString(), sessionId);
        }
    }

    public void onMemberReconnectedByToken(String token, String sessionId) {
        Member member = memberRepository.findByToken(java.util.UUID.fromString(token));
        if (member != null) {
            onMemberReconnected(member.getId().toString(), sessionId);
        }
    }
}