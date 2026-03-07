CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    tax NUMERIC(10, 2),
    tip NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    token UUID NOT NULL UNIQUE,
    connected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    locked BOOLEAN NOT NULL DEFAULT false,
    claimed_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(item_id, member_id)
);