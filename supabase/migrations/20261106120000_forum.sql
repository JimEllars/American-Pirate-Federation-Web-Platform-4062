-- Reddit-style forum: strategic categories, threads, replies and votes.
--
-- Read is public. Writing needs a Pirate Passport and a member record; voting is one row per
-- member per target. Authors cannot edit or delete in this first cut — moderation changes
-- status, and every write is scoped by RLS.
--
-- Categories are seeded with fixed ids that match src/lib/forum/categories.js.

BEGIN;

CREATE TABLE IF NOT EXISTS public.forum_categories (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    author_alias TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed', 'locked')),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    author_alias TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed')),
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_votes (
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'post')),
    target_id UUID NOT NULL,
    value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (member_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS forum_threads_category_idx
    ON public.forum_threads (category_id, is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS forum_threads_activity_idx
    ON public.forum_threads (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_thread_idx
    ON public.forum_posts (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS forum_posts_parent_idx
    ON public.forum_posts (parent_id);

-- ---------------------------------------------------------------------------
-- Author aliases: denormalised at write time so reading the forum never has to
-- join `members` (which is owner-scoped and would hide every other author).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_set_author_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    SELECT alias INTO NEW.author_alias FROM public.members WHERE id = NEW.author_id;
    IF NEW.author_alias IS NULL THEN
        NEW.author_alias := '';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_threads_author_alias ON public.forum_threads;
CREATE TRIGGER forum_threads_author_alias
    BEFORE INSERT ON public.forum_threads
    FOR EACH ROW EXECUTE FUNCTION public.forum_set_author_alias();

DROP TRIGGER IF EXISTS forum_posts_author_alias ON public.forum_posts;
CREATE TRIGGER forum_posts_author_alias
    BEFORE INSERT ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION public.forum_set_author_alias();

-- ---------------------------------------------------------------------------
-- Scores are maintained by trigger; clients never write score directly.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_apply_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    delta INTEGER := 0;
    target_kind TEXT;
    target UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        delta := NEW.value;
        target_kind := NEW.target_type;
        target := NEW.target_id;
    ELSIF TG_OP = 'DELETE' THEN
        delta := -OLD.value;
        target_kind := OLD.target_type;
        target := OLD.target_id;
    ELSE
        delta := NEW.value - OLD.value;
        target_kind := NEW.target_type;
        target := NEW.target_id;
    END IF;

    IF delta = 0 THEN
        RETURN NULL;
    END IF;

    IF target_kind = 'thread' THEN
        UPDATE public.forum_threads SET score = score + delta WHERE id = target;
    ELSE
        UPDATE public.forum_posts SET score = score + delta WHERE id = target;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS forum_votes_apply ON public.forum_votes;
CREATE TRIGGER forum_votes_apply
    AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
    FOR EACH ROW EXECUTE FUNCTION public.forum_apply_vote();

-- ---------------------------------------------------------------------------
-- Thread stats: reply count and last activity, maintained on published posts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_sync_thread_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'published' THEN
            UPDATE public.forum_threads
               SET reply_count = reply_count + 1,
                   last_activity_at = NEW.created_at
             WHERE id = NEW.thread_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'published' AND NEW.status <> 'published' THEN
            UPDATE public.forum_threads
               SET reply_count = GREATEST(0, reply_count - 1)
             WHERE id = NEW.thread_id;
        ELSIF OLD.status <> 'published' AND NEW.status = 'published' THEN
            UPDATE public.forum_threads
               SET reply_count = reply_count + 1,
                   last_activity_at = NOW()
             WHERE id = NEW.thread_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS forum_posts_thread_stats ON public.forum_posts;
CREATE TRIGGER forum_posts_thread_stats
    AFTER INSERT OR UPDATE OF status ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION public.forum_sync_thread_stats();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum categories are public" ON public.forum_categories;
CREATE POLICY "Forum categories are public"
    ON public.forum_categories FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Staff manage forum categories" ON public.forum_categories;
CREATE POLICY "Staff manage forum categories"
    ON public.forum_categories FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ));

DROP POLICY IF EXISTS "Published threads are public" ON public.forum_threads;
CREATE POLICY "Published threads are public"
    ON public.forum_threads FOR SELECT
    USING (
        status = 'published'
        OR auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
        )
    );

DROP POLICY IF EXISTS "Members open threads" ON public.forum_threads;
CREATE POLICY "Members open threads"
    ON public.forum_threads FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.forum_categories c
            WHERE c.id = category_id AND c.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Staff moderate threads" ON public.forum_threads;
CREATE POLICY "Staff moderate threads"
    ON public.forum_threads FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ));

DROP POLICY IF EXISTS "Published replies are public" ON public.forum_posts;
CREATE POLICY "Published replies are public"
    ON public.forum_posts FOR SELECT
    USING (
        status = 'published'
        OR auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
        )
    );

DROP POLICY IF EXISTS "Members reply to published threads" ON public.forum_posts;
CREATE POLICY "Members reply to published threads"
    ON public.forum_posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.forum_threads t
            WHERE t.id = thread_id AND t.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Staff moderate replies" ON public.forum_posts;
CREATE POLICY "Staff moderate replies"
    ON public.forum_posts FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() AND m.role IN ('Navigator', 'Guild Master')
    ));

DROP POLICY IF EXISTS "Members read their own votes" ON public.forum_votes;
CREATE POLICY "Members read their own votes"
    ON public.forum_votes FOR SELECT
    USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members cast their own votes" ON public.forum_votes;
CREATE POLICY "Members cast their own votes"
    ON public.forum_votes FOR INSERT
    WITH CHECK (
        auth.uid() = member_id
        AND (
            (target_type = 'thread' AND EXISTS (
                SELECT 1 FROM public.forum_threads t WHERE t.id = target_id AND t.status = 'published'
            ))
            OR (target_type = 'post' AND EXISTS (
                SELECT 1 FROM public.forum_posts p WHERE p.id = target_id AND p.status = 'published'
            ))
        )
    );

DROP POLICY IF EXISTS "Members change their own votes" ON public.forum_votes;
CREATE POLICY "Members change their own votes"
    ON public.forum_votes FOR UPDATE
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members withdraw their own votes" ON public.forum_votes;
CREATE POLICY "Members withdraw their own votes"
    ON public.forum_votes FOR DELETE
    USING (auth.uid() = member_id);

-- ---------------------------------------------------------------------------
-- Column privileges: authors may set only the fields a post actually owns.
-- Score, status, pinning and counts are trigger/policy territory.
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.forum_categories FROM anon, authenticated;
REVOKE ALL ON public.forum_threads FROM anon, authenticated;
REVOKE ALL ON public.forum_posts FROM anon, authenticated;
REVOKE ALL ON public.forum_votes FROM anon, authenticated;

GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT UPDATE (name, description, sort_order, is_active) ON public.forum_categories TO authenticated;

GRANT SELECT ON public.forum_threads TO anon, authenticated;
GRANT INSERT (category_id, author_id, title, body) ON public.forum_threads TO authenticated;
GRANT UPDATE (status, is_pinned) ON public.forum_threads TO authenticated;

GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT (thread_id, parent_id, author_id, body) ON public.forum_posts TO authenticated;
GRANT UPDATE (status) ON public.forum_posts TO authenticated;

GRANT SELECT, INSERT (member_id, target_type, target_id, value), UPDATE (value), DELETE
    ON public.forum_votes TO authenticated;

-- ---------------------------------------------------------------------------
-- Strategic categories (ids match src/lib/forum/categories.js).
-- ---------------------------------------------------------------------------
INSERT INTO public.forum_categories (id, slug, name, description, sort_order) VALUES
    ('11111111-1111-4111-8111-111111111101', 'general', 'General Assembly',
     'Introductions, announcements, and everything that does not fit elsewhere.', 10),
    ('11111111-1111-4111-8111-111111111102', 'code', 'The Pirate Code',
     'Debate the twenty articles, draft amendments, and argue the fine print.', 20),
    ('11111111-1111-4111-8111-111111111103', 'guilds', 'Guild Halls',
     'Shipwrights, Surgeons, Quartermasters and Navigators: projects and coordination.', 30),
    ('11111111-1111-4111-8111-111111111104', 'mutual-aid', 'Mutual Aid',
     'Requests, offers, and local organizing. Ask for help; offer what you have.', 40),
    ('11111111-1111-4111-8111-111111111108', 'learning', 'Resources & Learning',
     'Reading lists, explainers, teach-ins, and skill-sharing for the fleet.', 45),
    ('11111111-1111-4111-8111-111111111105', 'tech', 'Tech & Privacy',
     'Open source, data sovereignty, security, and the infrastructure we run.', 50),
    ('11111111-1111-4111-8111-111111111106', 'action', 'Politics & Action',
     'Campaigns, legislation, direct action, and after-action reports.', 60),
    ('11111111-1111-4111-8111-111111111107', 'meta', 'Quartermaster''s Office',
     'How the platform and the Federation run. Bugs, rules, and process.', 70)
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order,
        is_active = TRUE;

COMMIT;
