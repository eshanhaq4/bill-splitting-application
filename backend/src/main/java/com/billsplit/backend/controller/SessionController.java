package com.billsplit.backend.controller;

import com.billsplit.backend.model.*;
import com.billsplit.backend.service.SessionService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @QueryMapping
    public Session session(@Argument String id) {
        return sessionService.getSession(id);
    }

    @MutationMapping
    public CreateSessionResult createSession(@Argument String displayName) {
        return sessionService.createSession(displayName);
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
}