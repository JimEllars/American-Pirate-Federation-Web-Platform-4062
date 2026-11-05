/**
 * AI gateway configuration.
 *
 * The browser talks to our own edge function, never to a model provider directly.
 * Architectural Law 3 (Zero-Secret Edge Containment): an AI provider key cannot live in a
 * VITE_* variable because Vite inlines every one of them into the public bundle. The key
 * belongs to /api/ai, which reads it from the Pages environment.
 */
export const aiConfig = {
  AI_ENDPOINT: '/api/ai',
  AI_SYSTEM_PROMPT_VERSION: 'v1.0.0'
};
