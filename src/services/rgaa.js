import { GoogleGenerativeAI } from '@google/generative-ai';
import axeSource from 'axe-core/axe.min.js?raw';

const IMPACT_TO_SEVERITY = {
  critical: 'bloquant',
  serious: 'bloquant',
  moderate: 'majeur',
  minor: 'mineur',
};

/**
 * Lance axe-core sur un snippet HTML dans un iframe sandboxé et isolé
 * (aucun accès au DOM parent — le script collé par l'utilisateur ne peut pas
 * atteindre la page hôte). Ne nécessite aucune API, aucune clé.
 * @param {string} html
 * @returns {Promise<{violations: object[], passes: number, incomplete: number, score: number}>}
 */
export const runAxeAudit = (html) => {
  return new Promise((resolve, reject) => {
    const srcDoc = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body>
${html}
<script>${axeSource}</script>
<script>
  var PAGE_LEVEL_RULES = ['document-title', 'html-has-lang', 'landmark-one-main', 'region', 'page-has-heading-one', 'bypass'];
  var axeOptions = { rules: {} };
  PAGE_LEVEL_RULES.forEach(function (id) { axeOptions.rules[id] = { enabled: false }; });
  axe.run(document, axeOptions).then(function (results) {
    window.parent.postMessage({ source: 'vibehub-rgaa', ok: true, results: results }, '*');
  }).catch(function (err) {
    window.parent.postMessage({ source: 'vibehub-rgaa', ok: false, error: String(err && err.message || err) }, '*');
  });
</script>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', "Zone d'analyse isolée");
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:absolute;width:1280px;height:900px;left:-9999px;top:0;border:0;';
    iframe.srcdoc = srcDoc;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("L'analyse a expiré."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      iframe.remove();
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || event.data.source !== 'vibehub-rgaa') return;

      cleanup();
      if (!event.data.ok) {
        reject(new Error(event.data.error || "Échec de l'analyse axe-core."));
        return;
      }

      const { results } = event.data;
      const violations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        severity: IMPACT_TO_SEVERITY[v.impact] || 'mineur',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          target: n.target?.join(' '),
          failureSummary: n.failureSummary,
        })),
      }));

      const total = violations.length + results.passes.length;
      const score = total > 0 ? Math.round((results.passes.length / total) * 100) : 100;

      resolve({
        violations,
        passesCount: results.passes.length,
        incompleteCount: results.incomplete.length,
        score,
      });
    }

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_INSTRUCTION = `Tu es un expert accessibilité numérique maîtrisant le RGAA 4.1 et les WCAG 2.1/2.2 (niveau AA, référence légale française).

On te donne un extrait de code (HTML/JSX) ainsi que la liste des problèmes déjà détectés automatiquement par axe-core. Ta mission :
1. Ne répète PAS les problèmes déjà listés par axe-core sauf pour ajouter un contexte utile (ex : pertinence réelle d'un alt, pas juste sa présence).
2. Cherche les problèmes qu'un outil automatique ne peut PAS détecter : pertinence des textes alternatifs, qualité des libellés, cohérence de la hiérarchie de titres, usage correct des rôles ARIA, logique de la navigation clavier, pertinence des messages d'erreur.
3. Pour chaque problème trouvé, donne : sévérité (🔴 BLOQUANT / 🟠 MAJEUR / 🟡 MINEUR), le critère RGAA concerné, le code fautif, le code corrigé complet, une explication brève.
4. Termine par : ✅ Points positifs, puis 💡 Recommandations (tests manuels à faire : lecteur d'écran, navigation clavier).

Réponds en Markdown, en français, de façon concise et actionnable — pas de préambule.`;

/**
 * Approfondit l'audit axe-core avec un jugement contextuel (Gemini).
 * Réutilise la clé VITE_GEMINI_API_KEY déjà configurée pour l'onglet IA du projet.
 * @param {string} html
 * @param {object} axeResult - résultat de runAxeAudit
 * @returns {Promise<string>} rapport en Markdown
 */
export const generateRgaaDiagnostic = async (html, axeResult) => {
  if (!genAI) {
    return "⚠️ Clé API Gemini non configurée (`VITE_GEMINI_API_KEY` dans `.env`). L'analyse axe-core ci-dessus reste disponible sans configuration.";
  }

  const axeSummary = axeResult.violations.length
    ? axeResult.violations
        .map((v) => `- [${v.severity}] ${v.id} — ${v.help} (${v.nodes.length} occurrence(s))`)
        .join('\n')
    : 'Aucun problème détecté par axe-core.';

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  try {
    const result = await model.generateContent(
      `Code à analyser :\n\`\`\`html\n${html}\n\`\`\`\n\nProblèmes déjà détectés par axe-core :\n${axeSummary}`
    );
    return result.response.text();
  } catch (error) {
    console.error('Erreur lors du diagnostic RGAA approfondi :', error);
    if (error.status === 429) {
      return "⚠️ Quota Gemini dépassé. L'analyse axe-core ci-dessus reste disponible.";
    }
    return "⚠️ Erreur lors de l'analyse approfondie. L'analyse axe-core ci-dessus reste disponible.";
  }
};
