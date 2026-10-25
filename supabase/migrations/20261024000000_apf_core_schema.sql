-- 1. Members / Pirate Passport Profiles
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'Deckhand' CHECK (role IN ('Unverified', 'Deckhand', 'Navigator', 'Guild Master')),
    guild TEXT NOT NULL DEFAULT 'Federation Reserve',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Proposals & Governance
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT,
    author_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Signed Member Votes
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    vote TEXT NOT NULL CHECK (vote IN ('FOR', 'AGAINST', 'ABSTAIN')),
    signature TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(proposal_id, member_id)
);

-- 4. Policy Consensus Table
CREATE TABLE IF NOT EXISTS public.policy_consensus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    theme TEXT,
    reference TEXT,
    consensus_score NUMERIC NOT NULL DEFAULT 85.0,
    status TEXT NOT NULL DEFAULT 'Active',
    last_revision DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Treasury Ledger Ingress
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    asset TEXT NOT NULL DEFAULT 'USDC',
    target TEXT NOT NULL,
    alignment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Events & Dispatches
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    time_display TEXT NOT NULL,
    capacity TEXT NOT NULL DEFAULT 'Open',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Event RSVPs (Signals)
CREATE TABLE IF NOT EXISTS public.event_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- 8. Transmissions (Podcasts & Intel Briefs)
CREATE TABLE IF NOT EXISTS public.transmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    audio_url TEXT,
    encrypted_content TEXT,
    classification TEXT NOT NULL DEFAULT 'PUBLIC',
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Armory Inventory & Requisitions
CREATE TABLE IF NOT EXISTS public.armory_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    item_id UUID NOT NULL REFERENCES public.armory_inventory(id),
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armory_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Public read policy_consensus" ON public.policy_consensus FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read transmissions" ON public.transmissions FOR SELECT USING (true);
CREATE POLICY "Public read ledger" ON public.ledger FOR SELECT USING (true);
CREATE POLICY "Public read armory_inventory" ON public.armory_inventory FOR SELECT USING (is_active = true);
CREATE POLICY "Public read proposals" ON public.proposals FOR SELECT USING (true);

CREATE POLICY "Members manage own profile" ON public.members FOR ALL USING (auth.uid() = id);
CREATE POLICY "Members submit proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Members cast votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Members rsvp to events" ON public.event_signals FOR INSERT WITH CHECK (auth.uid() = member_id);

-- SEED THE 14 OFFICIAL POLICIES (APF-001 through APF-014)
INSERT INTO public.policy_consensus (policy_code, title, summary, theme, reference, consensus_score) VALUES
('APF-001', 'The Zero-Data Protocol', 'Complete eradication of targeted data harvesting across all federation assets.', 'Data Sovereignty', '4th Amendment', 94.0),
('APF-002', 'The Fleet Mutual Aid Pact', 'Protocol for resource sharing and legal defense of federation members under state pressure.', 'Mutual Aid', 'Preamble', 88.0),
('APF-003', 'Decentralized Governance Draft', 'Direct liquid democracy for all key federation directives and resource allocations.', 'Direct Democracy', 'Article I, Section 1', 92.5),
('APF-004', 'Intellectual Property Abolition', 'Systematic sunsetting of software and pharmaceutical patents to promote commons technology.', 'Open Source Infrastructure', 'Article I, Section 8', 86.0),
('APF-005', 'Corporate Housing Nullification Act', 'Prohibition of corporate and algorithmic ownership of single-family housing.', 'Housing Sovereignty', '9th Amendment', 96.0),
('APF-006', 'Universal Sustenance Guarantee', 'Baseline public rights guarantee for clean drinking water and foundational nutrition.', 'Resource Security', 'Preamble', 95.0),
('APF-007', 'Green Transit & Energy Transition Accord', 'Commitment of federation resources toward decentralized renewable microgrids.', 'Energy Autonomy', 'Article I, Section 8', 91.0),
('APF-008', 'The 1950s Tax Restoration Act', 'Restoration of top marginal individual and corporate tax brackets to 1950s levels.', 'Economic Equity', '16th Amendment', 89.0),
('APF-009', 'The Collective Labor Protection Mandate', 'Federal bans on union-busting and mandatory worker representation on corporate boards.', 'Labor Assembly', '1st Amendment', 93.0),
('APF-010', 'Open Generations Education Protocol', 'Tuition-free public universities and complete cancellation of predatory student debt.', 'Education Access', '1st Amendment', 91.5),
('APF-011', 'The Public Servant Accountability Directive', 'Lifetime ban on corporate lobbying for former elected officials and immediate end to Citizens United.', 'Anti-Corruption', 'Article I, Section 9', 98.0),
('APF-012', 'Generational Stewardship & Competency Cap', 'Upper age limits and term limits for federal judicial and congressional seats.', 'Systemic Reform', '22nd Amendment', 87.0),
('APF-013', 'Industrial Infrastructure Permitting Sovereignty', 'Local binding referendum requirements prior to data center or heavy industrial grid hookups.', 'Civic Permitting', 'General Welfare', 84.5),
('APF-014', 'Corporate Free Reign Nullification Act', 'Termination of corporate personhood and full criminal liability for executive misconduct.', 'Corporate Reform', 'Commerce Clause', 97.0)
ON CONFLICT (policy_code) DO NOTHING;
