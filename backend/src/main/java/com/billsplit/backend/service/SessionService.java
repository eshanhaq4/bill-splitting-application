package com.billsplit.backend.service;

import com.billsplit.backend.model.*;
import com.billsplit.backend.repository.*;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;

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
            member = memberRepository.save(member);
            System.out.println("Member created: " + member.getId());

            // Set join URL and QR code URL
            session.setJoinUrl("http://localhost:8080/session/" + session.getId() + "/join");
            session.setQrCodeUrl("http://localhost:8080/qr/" + session.getId());

            // Build result
            CreateSessionResult result = new CreateSessionResult();
            result.setSuccess(true);
            result.setToken(member.getToken().toString());
            result.setMember(member);
            result.setSession(session);
            System.out.println("Result built successfully");
            return result;
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

        // Create the member
        Member member = new Member();
        member.setDisplayName(displayName);
        member.setToken(UUID.randomUUID());
        member.setConnected(true);
        member.setSession(session);
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
        return sessionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("SESSION_NOT_FOUND"));
    }
}