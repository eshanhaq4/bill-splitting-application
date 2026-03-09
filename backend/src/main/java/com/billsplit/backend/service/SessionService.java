package com.billsplit.backend.service;

import com.billsplit.backend.model.*;
import com.billsplit.backend.repository.*;
import org.springframework.stereotype.Service;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    @Value("${app.base-url}")
    private String baseUrl;

    public SessionService(SessionRepository sessionRepository, MemberRepository memberRepository) {
        this.sessionRepository = sessionRepository;
        this.memberRepository = memberRepository;
    }

    public CreateSessionResult createSession(String displayName) {
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

    public JoinSessionResult joinSession(String sessionId, String displayName) {
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
}