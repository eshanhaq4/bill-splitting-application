package com.billsplit.backend.controller;

import com.billsplit.backend.model.*;
import com.billsplit.backend.service.SessionService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import com.billsplit.backend.service.ItemClaimService;

@Controller
public class SessionController {

    private final SessionService sessionService;
    private final ItemClaimService itemClaimService;

    public SessionController(SessionService sessionService, ItemClaimService itemClaimService) {
        this.sessionService = sessionService;
        this.itemClaimService = itemClaimService;
    }

    @QueryMapping
    public Session session(@Argument String id) {
        return sessionService.getSession(id);
    }

    @MutationMapping
    public CreateSessionResult createSession(@Argument String displayName, @Argument String dietaryPreference) {
        return sessionService.createSession(displayName, dietaryPreference);
    }

    @MutationMapping

    public JoinSessionResult joinSession(@Argument String sessionId, @Argument String displayName,
            @Argument String dietaryPreference) {
        return sessionService.joinSession(sessionId, displayName, dietaryPreference);
    }

    @MutationMapping
    public ClaimResult claimItem(@Argument String itemId, @Argument String userId) {
        return sessionService.claimItem(itemId, userId);
    }

    @MutationMapping
    public ClaimResult releaseItem(@Argument String itemId, @Argument String userId) {
        return sessionService.releaseItem(itemId, userId);
    }

    @MutationMapping
    public ReceiptUploadResult uploadReceipt(
            @Argument String sessionId,
            @Argument String fileBase64,
            @Argument String fileName) {
        return sessionService.uploadReceipt(sessionId, fileBase64, fileName);
    }

    @MutationMapping
    public MarkReadyResult markReady(@Argument String sessionId, @Argument String memberId) {
        return sessionService.markReady(sessionId, memberId);
    }
}