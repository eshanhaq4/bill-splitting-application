import { Member, MemberVisual } from '@/types/receipt';

const MEMBER_COLOR_CLASSES = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-lime-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
];

/**
 * Extracts 2-character base initials from a display name.
 * 
 * For multi-word names: Takes first letter of first two words (e.g., "John Doe" → "JD").
 * For single-word names: Takes first two letters (e.g., "Alice" → "AL").
 * Removes special characters and converts to uppercase.
 * Returns "??" if name is empty or invalid.
 */
function getBaseInitials(displayName: string): string {
    const parts = displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return '??';
    }

    if (parts.length === 1) {
        const single = parts[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (single.length >= 2) {
            return single.slice(0, 2);
        }
        return `${single[0] ?? '?'}${single[0] ?? '?'}`;
    }

    const first = parts[0][0] ?? '?';
    const second = parts[1][0] ?? '?';
    return `${first}${second}`.toUpperCase();
}

/**
 * Generates unique 2-character initials for a member, avoiding collisions.
 * 
 * Strategy:
 * 1. Try base initials from getBaseInitials()
 * 2. If taken, try pairing first initial with other characters from the flattened name
 * 3. If all exhausted, try numeric suffixes (first letter + 0-9)
 * 4. As last resort, returns base initials even if duplicate
 * 
 * Updates the usedInitials Set to track uniqueness across all members.
 */
function makeUniqueInitials(displayName: string, usedInitials: Set<string>): string {
    const base = getBaseInitials(displayName);
    if (!usedInitials.has(base)) {
        usedInitials.add(base);
        return base;
    }

    const flattened = displayName.replace(/\s+/g, '').toUpperCase();
    for (let index = 1; index < flattened.length; index += 1) {
        const candidate = `${base[0]}${flattened[index]}`;
        if (!usedInitials.has(candidate)) {
            usedInitials.add(candidate);
            return candidate;
        }
    }

    for (let suffix = 0; suffix <= 9; suffix += 1) {
        const candidate = `${base[0]}${suffix}`;
        if (!usedInitials.has(candidate)) {
            usedInitials.add(candidate);
            return candidate;
        }
    }

    usedInitials.add(base);
    return base;
}

/**
 * Assigns a consistent color class to a member using pseudo-random selection.
 * 
 * Uses a simple hash function on the member's ID and displayName to generate
 * a deterministic index into MEMBER_COLOR_CLASSES. Same member always gets
 * the same color, but different members get distributed across the palette.
 * 
 * Hash algorithm: multiply-and-add with 31 as prime multiplier, modulo palette size.
 */
function getColorForMember(member: Member): string {
    const key = `${member.id}:${member.displayName}`;
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) {
        hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    }

    return MEMBER_COLOR_CLASSES[hash % MEMBER_COLOR_CLASSES.length];
}

/**
 * Builds a complete mapping of member IDs to their visual representations.
 * 
 * For each member in the input array:
 * - Generates unique initials (collision-safe across all members)
 * - Assigns a consistent pseudo-random color
 * - Returns a Record mapping member.id to {initials, colorClass}
 * 
 * Used by ReceiptPage to derive avatar display data from backend Member objects.
 */
export function buildMemberVisualsById(members: Member[]): Record<string, MemberVisual> {
    const visualsById: Record<string, MemberVisual> = {};
    const usedInitials = new Set<string>();

    members.forEach((member) => {
        visualsById[member.id] = {
            initials: makeUniqueInitials(member.displayName, usedInitials),
            colorClass: getColorForMember(member),
        };
    });

    return visualsById;
}
