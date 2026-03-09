package com.billsplit.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureHttpGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureHttpGraphQlTester
class SessionResolverTests {

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        Dotenv dotenv = Dotenv.load();
        String dbUrl = dotenv.get("DB_URL");
        System.out.println("DEBUG: DB_URL=" + dbUrl);
        registry.add("spring.datasource.url", () -> dbUrl);
        registry.add("spring.datasource.username", () -> dotenv.get("DB_USERNAME"));
        registry.add("spring.datasource.password", () -> dotenv.get("DB_PASSWORD"));
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    HttpGraphQlTester graphQlTester;

    @Test
    void createSession_returnsSuccessWithTokenAndSession() {
        graphQlTester.document("""
                mutation {
                    createSession(displayName: "Chris") {
                        success
                        token
                        member {
                            id
                            displayName
                        }
                        session {
                            id
                            status
                            joinUrl
                            qrCodeUrl
                        }
                    }
                }
                """)
                .execute()
                .path("createSession.success").entity(Boolean.class).isEqualTo(true)
                .path("createSession.token").hasValue()
                .path("createSession.member.displayName").entity(String.class).isEqualTo("Chris")
                .path("createSession.session.status").entity(String.class).isEqualTo("WAITING")
                .path("createSession.session.joinUrl").hasValue()
                .path("createSession.session.qrCodeUrl").hasValue();
    }

    @Test
    void joinSession_returnsSuccessWithMemberRoleMember() {
        // First create a session to get the session ID
        String sessionId = graphQlTester.document("""
                mutation {
                    createSession(displayName: "Chris") {
                        session { id }
                    }
                }
                """)
                .execute()
                .path("createSession.session.id")
                .entity(String.class)
                .get();

        // Now join with a different display name
        graphQlTester.document("""
                mutation {
                    joinSession(sessionId: "%s", displayName: "Ade") {
                        success
                        token
                        member {
                            id
                            displayName
                        }
                        session {
                            id
                            status
                        }
                    }
                }
                """.formatted(sessionId))
                .execute()
                .path("joinSession.success").entity(Boolean.class).isEqualTo(true)
                .path("joinSession.token").hasValue()
                .path("joinSession.member.displayName").entity(String.class).isEqualTo("Ade")
                .path("joinSession.session.status").entity(String.class).isEqualTo("WAITING");
    }

    @Test
    void joinSession_duplicateDisplayName_returnsError() {
        // Create a session
        String sessionId = graphQlTester.document("""
                mutation {
                    createSession(displayName: "Chris") {
                        session { id }
                    }
                }
                """)
                .execute()
                .path("createSession.session.id")
                .entity(String.class)
                .get();

        // Try to join with the same display name
        graphQlTester.document("""
                mutation {
                    joinSession(sessionId: "%s", displayName: "Chris") {
                        success
                    }
                }
                """.formatted(sessionId))
                .execute()
                .errors()
                .satisfy(errors -> {
                    org.junit.jupiter.api.Assertions.assertFalse(errors.isEmpty());
                });
    }

    @Test
    void getSession_returnsMembersAndItems() {
        String sessionId = graphQlTester.document("""
                mutation {
                    createSession(displayName: "Chris") {
                        session { id }
                    }
                }
                """)
                .execute()
                .path("createSession.session.id")
                .entity(String.class)
                .get();

        graphQlTester.document("""
                query {
                    session(id: "%s") {
                        id
                        status
                        joinUrl
                        qrCodeUrl
                        members {
                            id
                            displayName
                            role
                        }
                    }
                }
                """.formatted(sessionId))
                .execute()
                .path("session.status").entity(String.class).isEqualTo("WAITING")
                .path("session.joinUrl").hasValue()
                .path("session.members[0].displayName").entity(String.class).isEqualTo("Chris")
                .path("session.members[0].role").entity(String.class).isEqualTo("LEADER");
    }

}