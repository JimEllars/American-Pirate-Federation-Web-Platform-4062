-- Profile link scheme constraint.
--
-- A published profile's `links` array is rendered as clickable `href`s on /members, so the
-- scheme of each URL is a security boundary. The form in src/pages/Profile.jsx validates it,
-- and src/lib/api/links.js filters it on read — but neither is the only writer: RLS lets a
-- member POST their own `profiles` row straight to PostgREST with the anon key and their
-- session. Checking only in the browser lets that member store `javascript:…` and have every
-- visitor's click execute it in the pirateusa.org origin.
--
-- Postgres does not allow a subquery inside CHECK, so the per-element test is an IMMUTABLE
-- function. Only http and https are accepted; `data:`, `vbscript:` and `javascript:` are
-- refused for new rows and (after VALIDATE) for existing ones.

BEGIN;

CREATE OR REPLACE FUNCTION public.profile_links_are_http(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN value IS NULL THEN TRUE
        WHEN jsonb_typeof(value) IS DISTINCT FROM 'array' THEN FALSE
        WHEN jsonb_array_length(value) > 5 THEN FALSE
        ELSE NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(value) AS link
            WHERE jsonb_typeof(link) IS DISTINCT FROM 'object'
               OR COALESCE(link->>'url', '') !~* '^https?://[^[:space:]]+$'
               OR position(E'\t' IN COALESCE(link->>'url', '')) > 0
               OR position(E'\n' IN COALESCE(link->>'url', '')) > 0
               OR position(E'\r' IN COALESCE(link->>'url', '')) > 0
        )
    END;
$$;

COMMENT ON FUNCTION public.profile_links_are_http(JSONB) IS
    'TRUE when every entry in a profiles.links array carries an http(s) URL with no whitespace.';

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_links_are_http;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_links_are_http
    CHECK (public.profile_links_are_http(links));

COMMIT;
