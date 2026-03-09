package com.billsplit.backend;

import com.billsplit.backend.model.*;
import com.billsplit.backend.repository.*;
import com.billsplit.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ItemClaimServiceTests {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionEventPublisher sessionEventPublisher;

    @InjectMocks
    private SessionService sessionService;

    private UUID itemId;
    private UUID userId;
    private UUID sessionId;
    private Item item;
    private Member member;
    private Session session;

    @BeforeEach
    void setup() {
        itemId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();

        session = new Session();
        session.setId(sessionId);
        session.setStatus(SessionStatus.WAITING);

        member = new Member();
        member.setId(userId);
        member.setDisplayName("Chris");
        member.setSession(session);

        item = new Item();
        item.setId(itemId);
        item.setName("Burger");
        item.setPrice(new BigDecimal("15.00"));
        item.setSession(session);
        item.setLocked(false);
    }

    @Test
    void claimItem_happyPath_returnsSuccessAndBroadcastsClaimed() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(memberRepository.findById(userId)).thenReturn(Optional.of(member));
        when(itemRepository.claimIfAvailable(itemId, userId)).thenReturn(1);
        item.setClaimedBy(member);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        ClaimResult result = sessionService.claimItem(itemId.toString(), userId.toString());

        assertTrue(result.isSuccess());
        assertNull(result.getErrorCode());
        assertEquals("Burger", result.getItem().getName());

        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_LOCKED"), any());
        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_CLAIMED"), any());
        verify(sessionEventPublisher, never()).publish(eq(sessionId.toString()), eq("ITEM_UNLOCKED"), any());
    }

    @Test
    void claimItem_raceConditionLoser_returnsFailureAndBroadcastsUnlocked() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(memberRepository.findById(userId)).thenReturn(Optional.of(member));
        when(itemRepository.claimIfAvailable(itemId, userId)).thenReturn(0);

        ClaimResult result = sessionService.claimItem(itemId.toString(), userId.toString());

        assertFalse(result.isSuccess());
        assertEquals("ITEM_ALREADY_CLAIMED", result.getErrorCode());

        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_LOCKED"), any());
        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_UNLOCKED"), any());
        verify(sessionEventPublisher, never()).publish(eq(sessionId.toString()), eq("ITEM_CLAIMED"), any());
    }

    @Test
    void claimItem_dbThrows_broadcastsUnlockedAndReturnsServerError() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(memberRepository.findById(userId)).thenReturn(Optional.of(member));
        when(itemRepository.claimIfAvailable(any(), any())).thenThrow(new RuntimeException("DB down"));

        ClaimResult result = sessionService.claimItem(itemId.toString(), userId.toString());

        assertFalse(result.isSuccess());
        assertEquals("SERVER_ERROR", result.getErrorCode());

        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_UNLOCKED"), any());
    }

    @Test
    void releaseItem_happyPath_returnsSuccessAndBroadcastsReleased() {
        item.setClaimedBy(member);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.releaseIfOwned(itemId, userId)).thenReturn(1);
        item.setClaimedBy(null);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        ClaimResult result = sessionService.releaseItem(itemId.toString(), userId.toString());

        assertTrue(result.isSuccess());
        assertNull(result.getItem().getClaimedBy());
        verify(sessionEventPublisher).publish(eq(sessionId.toString()), eq("ITEM_RELEASED"), any());
    }

    @Test
    void releaseItem_notOwner_returnsUnauthorized() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.releaseIfOwned(itemId, userId)).thenReturn(0);

        ClaimResult result = sessionService.releaseItem(itemId.toString(), userId.toString());

        assertFalse(result.isSuccess());
        assertEquals("UNAUTHORIZED", result.getErrorCode());
        verify(sessionEventPublisher, never()).publish(any(), eq("ITEM_RELEASED"), any());
    }
}