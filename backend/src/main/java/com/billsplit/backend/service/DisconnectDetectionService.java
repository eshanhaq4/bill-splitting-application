package com.billsplit.backend.service;

import org.springframework.stereotype.Service;
import java.time.Duration;
import com.billsplit.backend.repository.MemberRepository;
import com.billsplit.backend.model.Member;

@Service
public class DisconnectDetectionService {

    private static final long DISCONNECT_TIMEOUT_SECONDS = 120;
    private static final String DISCONNECT_KEY_PREFIX = "disconnect:";

    private final RedisQueueService redisQueueService;
    private final SessionEventPublisher eventPublisher;
    private final MemberRepository memberRepository;

    public DisconnectDetectionService(RedisQueueService redisQueueService, 
                                       SessionEventPublisher eventPublisher,
                                       MemberRepository memberRepository) {
        this.redisQueueService = redisQueueService;
        this.eventPublisher = eventPublisher;
        this.memberRepository = memberRepository;
    }

    public void onMemberDisconnected(String memberId, String sessionId) {
        // Mark member as disconnected in DB
        memberRepository.findById(java.util.UUID.fromString(memberId)).ifPresent(member -> {
            member.setConnected(false);
            memberRepository.save(member);
        });

        // Broadcast USER_DISCONNECTED
        eventPublisher.publish(sessionId, "USER_DISCONNECTED", 
            java.util.Map.of("memberId", memberId));

        // Set Redis TTL for 2 minutes
        redisQueueService.setValue(
            DISCONNECT_KEY_PREFIX + memberId,
            sessionId,
            Duration.ofSeconds(DISCONNECT_TIMEOUT_SECONDS)
        );
    }

    public void onMemberReconnected(String memberId, String sessionId) {
        // Cancel the Redis timer
        redisQueueService.deleteKey(DISCONNECT_KEY_PREFIX + memberId);

        // Mark member as connected in DB
        memberRepository.findById(java.util.UUID.fromString(memberId)).ifPresent(member -> {
            member.setConnected(true);
            memberRepository.save(member);
        });

        // Broadcast USER_RECONNECTED
        eventPublisher.publish(sessionId, "USER_RECONNECTED",
            java.util.Map.of("memberId", memberId));
    }

    // ************************************ //
    // ** Methods for WebSocket listener ** //
    // ************************************ //
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