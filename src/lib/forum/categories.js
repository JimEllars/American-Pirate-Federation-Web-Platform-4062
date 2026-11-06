/**
 * Forum categories — strategic structure, not user data.
 *
 * These are fixed ids so the client can list the forum before the database migration is
 * applied and so threads keep their category across environments. The same seven rows are
 * seeded by supabase/migrations/20261106120000_forum.sql; keep the two in step.
 */

export const FORUM_CATEGORIES = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    slug: 'general',
    name: 'General Assembly',
    description: 'Introductions, announcements, and everything that does not fit elsewhere.',
    sortOrder: 10
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    slug: 'code',
    name: 'The Pirate Code',
    description: 'Debate the twenty articles, draft amendments, and argue the fine print.',
    sortOrder: 20
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    slug: 'guilds',
    name: 'Guild Halls',
    description: 'Shipwrights, Surgeons, Quartermasters and Navigators: projects and coordination.',
    sortOrder: 30
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    slug: 'mutual-aid',
    name: 'Mutual Aid',
    description: 'Requests, offers, and local organizing. Ask for help; offer what you have.',
    sortOrder: 40
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    slug: 'learning',
    name: 'Resources & Learning',
    description: 'Reading lists, explainers, teach-ins, and skill-sharing for the fleet.',
    sortOrder: 45
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    slug: 'tech',
    name: 'Tech & Privacy',
    description: 'Open source, data sovereignty, security, and the infrastructure we run.',
    sortOrder: 50
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    slug: 'action',
    name: 'Politics & Action',
    description: 'Campaigns, legislation, direct action, and after-action reports.',
    sortOrder: 60
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    slug: 'meta',
    name: "Quartermaster's Office",
    description: 'How the platform and the Federation run. Bugs, rules, and process.',
    sortOrder: 70
  }
];

export const categoryBySlug = (slug) =>
  FORUM_CATEGORIES.find((category) => category.slug === slug) || null;

export const categoryById = (id) =>
  FORUM_CATEGORIES.find((category) => category.id === id) || null;
