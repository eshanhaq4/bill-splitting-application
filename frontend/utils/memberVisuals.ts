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

function getColorForMember(member: Member): string {
    const key = `${member.id}:${member.displayName}`;
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) {
        hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    }

    return MEMBER_COLOR_CLASSES[hash % MEMBER_COLOR_CLASSES.length];
}

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
