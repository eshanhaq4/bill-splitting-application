package com.billsplit.backend.service;

import com.billsplit.backend.model.*;
import com.billsplit.backend.repository.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final ItemRepository itemRepository;
    private final SessionEventPublisher sessionEventPublisher;

    @Value("${app.base-url}")
    private String baseUrl;

    public SessionService(SessionRepository sessionRepository,
            MemberRepository memberRepository,
            ItemRepository itemRepository,
            SessionEventPublisher sessionEventPublisher) {
        this.sessionRepository = sessionRepository;
        this.memberRepository = memberRepository;
        this.itemRepository = itemRepository;
        this.sessionEventPublisher = sessionEventPublisher;
    }

    public CreateSessionResult createSession(String displayName, String dietaryPreference) {
        try {
            // Create the session
            Session session = new Session();
            session.setStatus(SessionStatus.WAITING);
            session = sessionRepository.save(session);
            System.out.println("Session created: " + session.getId());

            // Create the member
            Member member = new Member();
            member.setDisplayName(displayName);
            member.setToken(UUID.randomUUID());
            member.setConnected(true);
            member.setSession(session);
            member.setRole(MemberRole.LEADER);
            if (dietaryPreference != null) {
                member.setDietaryPreference(dietaryPreference);
            }
            member = memberRepository.save(member);
            System.out.println("Member created: " + member.getId());

            session.setLeader(member);

            // Set join URL and QR code URL
            String joinUrl = baseUrl + "/join/" + session.getId();
            String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" + joinUrl;
            session.setJoinUrl(joinUrl);
            session.setQrCodeUrl(qrCodeUrl);

            // Build result
            return new CreateSessionResult(true, member.getToken().toString(), member, session);
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public JoinSessionResult joinSession(String sessionId, String displayName, String dietaryPreference) {
        // Find the session
        Session session = sessionRepository.findById(UUID.fromString(sessionId))
                .orElseThrow(() -> new RuntimeException("SESSION_NOT_FOUND"));

        // Add this before creating the member in joinSession
        memberRepository.findBySessionIdAndDisplayName(
                UUID.fromString(sessionId), displayName).ifPresent(m -> {
                    throw new RuntimeException("DISPLAY_NAME_TAKEN");
                });

        // Create the member
        Member member = new Member();
        member.setDisplayName(displayName);
        member.setToken(UUID.randomUUID());
        member.setConnected(true);
        member.setSession(session);
        member.setRole(MemberRole.MEMBER);
        if (dietaryPreference != null) {
            member.setDietaryPreference(dietaryPreference);
        }

        member = memberRepository.save(member);

        // Build result
        JoinSessionResult result = new JoinSessionResult();
        result.setSuccess(true);
        result.setToken(member.getToken().toString());
        result.setMember(member);
        result.setSession(session);
        return result;
    }

    public Session getSession(String id) {
        Session session = sessionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("SESSION_NOT_FOUND"));

        String joinUrl = baseUrl + "/join/" + session.getId();
        session.setJoinUrl(joinUrl);
        session.setQrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?data=" + joinUrl);

        session.getMembers().stream()
                .filter(m -> m.getRole() == MemberRole.LEADER)
                .findFirst()
                .ifPresent(session::setLeader);

        return session;
    }

    public ClaimResult claimItem(String itemId, String userId) {
        Item item = itemRepository.findById(UUID.fromString(itemId))
                .orElseThrow(() -> new RuntimeException("ITEM_NOT_FOUND"));

        String sessionId = item.getSession().getId().toString();

        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("MEMBER_NOT_FOUND"));

        sessionEventPublisher.publish(sessionId, "ITEM_LOCKED",
                Map.of("item_id", itemId));

        try {
            int rows = itemRepository.claimIfAvailable(
                    UUID.fromString(itemId),
                    UUID.fromString(userId));

            if (rows == 1) {
                item = itemRepository.findById(UUID.fromString(itemId)).get();

                sessionEventPublisher.publish(sessionId, "ITEM_CLAIMED",
                        Map.of("item_id", itemId,
                                "claimed_by", userId,
                                "display_name", member.getDisplayName()));

                ClaimResult result = new ClaimResult();
                result.setSuccess(true);
                result.setItem(item);
                return result;

            } else {
                sessionEventPublisher.publish(sessionId, "ITEM_UNLOCKED",
                        Map.of("item_id", itemId));

                ClaimResult result = new ClaimResult();
                result.setSuccess(false);
                result.setItem(item);
                result.setErrorCode("ITEM_ALREADY_CLAIMED");
                result.setMessage("Item was claimed by someone else");
                return result;
            }

        } catch (Exception e) {
            sessionEventPublisher.publish(sessionId, "ITEM_UNLOCKED",
                    Map.of("item_id", itemId));

            ClaimResult result = new ClaimResult();
            result.setSuccess(false);
            result.setItem(item);
            result.setErrorCode("SERVER_ERROR");
            result.setMessage(e.getMessage());
            return result;
        }
    }

    public ClaimResult releaseItem(String itemId, String userId) {
        Item item = itemRepository.findById(UUID.fromString(itemId))
                .orElseThrow(() -> new RuntimeException("ITEM_NOT_FOUND"));

        String sessionId = item.getSession().getId().toString();

        int rows = itemRepository.releaseIfOwned(
                UUID.fromString(itemId),
                UUID.fromString(userId));

        if (rows == 1) {
            item = itemRepository.findById(UUID.fromString(itemId)).get();

            sessionEventPublisher.publish(sessionId, "ITEM_RELEASED",
                    Map.of("item_id", itemId));

            ClaimResult result = new ClaimResult();
            result.setSuccess(true);
            result.setItem(item);
            return result;

        } else {
            ClaimResult result = new ClaimResult();
            result.setSuccess(false);
            result.setItem(item);
            result.setErrorCode("UNAUTHORIZED");
            result.setMessage("You do not own this item");
            return result;
        }
    }

}