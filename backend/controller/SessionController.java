package com.billsplit.backend.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class SessionController {

    @QueryMapping
    public Session session(@Argument String id) {
        // TODO: fetch session from database
        return null;
    }

    @MutationMapping
    public CreateSessionResult createSession(@Argument String displayName) {
        // TODO: create session in database, generate token
        return null;
    }

    @MutationMapping
    public JoinSessionResult joinSession(@Argument String sessionId, @Argument String displayName) {
        // TODO: join session, generate token
        return null;
    }
}