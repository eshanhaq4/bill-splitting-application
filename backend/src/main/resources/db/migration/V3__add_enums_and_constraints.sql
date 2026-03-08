CREATE TYPE member_role AS ENUM ('LEADER', 'MEMBER');

ALTER TABLE members
ADD COLUMN role member_role NOT NULL DEFAULT 'MEMBER';

ALTER TABLE members
ADD CONSTRAINT unique_display_name_per_session
UNIQUE (session_id, display_name);

ALTER TABLE items
DROP COLUMN quantity;