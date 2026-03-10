export interface Member {
    id: string;
    displayName: string;
    connected: boolean;
    token?: string | null;
}

export interface MemberVisual {
    initials: string;
    colorClass: string;
}

export interface Item {
    id: string;
    name: string;
    price: number;
    category?: string;
    locked: boolean;
    agentClaimed?: boolean;
    claimedBy: Pick<Member, 'id'> | null;
}