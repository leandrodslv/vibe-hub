// @ts-check
/**
 * Appel Gemini partagé par les scripts d'automatisation (pentest, sync hebdo).
 * Nécessite `GEMINI_API_KEY` dans l'environnement. Sans clé → renvoie `null`
 * (l'appelant dégrade : « lance Claude Code en local »).
 */

const MODEL = 'gemini-2.5-flash-lite';

/**
 * @param {string} prompt
 * @param {{ maxChars?: number }} [opts]
 * @returns {Promise<string | null>}
 */
export async function askGemini(prompt, { maxChars = 120_000 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  // Clé dans l'en-tête `x-goog-api-key`, jamais dans l'URL (query loggable).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt.slice(0, maxChars) }] }],
      }),
    });
  } catch (err) {
    console.error(`Gemini injoignable : ${err instanceof Error ? err.message : err}`);
    return null;
  }
  if (!res.ok) {
    console.error(`Gemini a répondu ${res.status}.`);
    return null;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? null;
}
