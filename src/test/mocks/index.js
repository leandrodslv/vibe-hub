// @ts-check
/**
 * Point d'entrée des mocks réseau déterministes (MSW) — V3 de
 * docs/ai/roadmap-automatisation.md.
 */

export { server, resetScenarios } from './server.js';
export { setGeminiScenario, geminiRequests } from './handlers/gemini.js';
export { setSupabaseScenario } from './handlers/supabase.js';
export { geminiScenarios } from './scenarios/gemini.js';
export { courseScenarios, makeCourseRow } from './scenarios/courses.js';
