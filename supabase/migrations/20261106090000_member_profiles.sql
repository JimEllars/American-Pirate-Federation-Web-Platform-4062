-- Member profiles and the opt-in public directory.
--
-- Phase A of docs/community-platform-roadmap.md. A member's profile is theirs: the row is
-- owner-write/owner-read, and nothing is published until `visibility = 'public'` is chosen.
--
-- The directory is a view, not a public grant on `members`. `members` holds the email and
-- wallet columns and stays owner-scoped; the view selects only the fields a member chose to
-- publish plus the alias/rank/guild the Federation already assigned. It runs with the view
-- owner's rights because the underlying `members` RLS would otherwise block every reader.

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
    member_id UUID PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
    headline TEXT NOT NULL DEFAULT '' CHECK (char_length(headline) <= 120),
    bio TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 1200),
    links JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (jsonb_typeof(links) = 'array' AND jsonb_array_length(links) <= 5),
    visibility TEXT NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('private', 'public')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles readable by owner or when public" ON public.profiles;
CREATE POLICY "Profiles readable by owner or when public"
    ON public.profiles FOR SELECT
    USING (visibility = 'public' OR auth.uid() = member_id);

DROP POLICY IF EXISTS "Members insert own profile" ON public.profiles;
CREATE POLICY "Members insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members update own profile" ON public.profiles;
CREATE POLICY "Members update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members delete own profile" ON public.profiles;
CREATE POLICY "Members delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = member_id);

CREATE INDEX IF NOT EXISTS profiles_public_updated_idx
    ON public.profiles (updated_at DESC)
    WHERE visibility = 'public';

-- Read-only projection for the directory. Deliberately excludes email, wallet_address and
-- every private profile field.
CREATE OR REPLACE VIEW public.public_directory
WITH (security_invoker = false) AS
SELECT
    p.member_id,
    m.alias,
    m.role,
    m.guild,
    p.headline,
    p.bio,
    p.links,
    p.updated_at
FROM public.profiles p
JOIN public.members m ON m.id = p.member_id
WHERE p.visibility = 'public';

REVOKE ALL ON public.public_directory FROM PUBLIC;
GRANT SELECT ON public.public_directory TO anon, authenticated;

COMMENT ON VIEW public.public_directory IS
    'Published member profiles only. Excludes email, wallet address and private rows.';

COMMIT;
