export const aiConfig = {
  AUTOMATION_WEBHOOK_URL: import.meta.env.VITE_AI_ENDPOINT || null,
  AI_SYSTEM_PROMPT_VERSION: import.meta.env.VITE_AI_PROMPT_VERSION || 'v1.0.0'
};
