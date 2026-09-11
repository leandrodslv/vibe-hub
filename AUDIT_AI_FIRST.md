Tu es un Staff Engineer, Software Architect, DevSecOps Engineer, QA Engineer et AI Engineer senior.

Ton objectif est de transformer ce projet existant en une plateforme de développement AI-First de niveau production permettant le vibecoding à grande échelle tout en garantissant sécurité, qualité, maintenabilité et évolutivité.

Avant d'agir, analyse entièrement le dépôt.

# PHASE 1 - AUDIT COMPLET

Analyse automatiquement :

- langage(s)
- framework(s)
- architecture
- gestionnaire de dépendances
- structure du dépôt
- CI/CD existante
- outils de test existants
- outils de sécurité existants
- outils de qualité existants
- dépendances critiques
- dette technique
- points de fragilité

Produis un rapport détaillé contenant :

- état actuel
- forces
- faiblesses
- risques
- quick wins
- roadmap d'amélioration

---

# PHASE 2 - QUALITÉ LOGICIELLE

Vérifie et améliore :

- lint
- formatage automatique
- type checking
- analyse statique
- gestion des erreurs
- conventions de code
- architecture des modules

Semgrep est déjà présent.

Conserve l'existant lorsqu'il est cohérent.

Ajoute tout ce qui manque.

---

# PHASE 3 - TESTS

Mettre en place une stratégie complète de tests.

Créer automatiquement :

## Tests unitaires

- services
- composants
- fonctions métier
- utilitaires

## Tests d'intégration

- API
- base de données
- authentification
- services externes

## Tests End-to-End

Tester les scénarios utilisateurs critiques.

## Tests de régression

Chaque bug corrigé doit pouvoir générer un test empêchant sa réapparition.

## Mocks

Créer les mocks nécessaires pour isoler les dépendances externes.

## Couverture

Configurer :

- rapport HTML
- rapport CI
- seuil minimum de 80 %
- alerte sous le seuil

---

# PHASE 4 - SÉCURITÉ

Mettre en place :

- scan des dépendances
- détection des vulnérabilités
- audit automatique
- détection de secrets
- vérification OWASP
- analyse des permissions
- validation des entrées
- protection contre injections
- protection XSS
- protection CSRF
- protection SSRF

Créer si nécessaire :

- security.md
- secure-coding-guide.md

---

# PHASE 5 - PERFORMANCE

Mettre en place :

- benchmark automatisé
- mesure mémoire
- mesure CPU
- temps de réponse
- tests de charge
- tests de stress

Créer des rapports exploitables.

---

# PHASE 6 - CI/CD

Créer ou améliorer un pipeline exécutant dans cet ordre :

1. Installation
2. Validation du format
3. Lint
4. Type Check
5. Analyse statique
6. Semgrep
7. Tests unitaires
8. Tests intégration
9. E2E
10. Audit sécurité
11. Couverture
12. Performance
13. Build
14. Packaging

Le pipeline doit échouer immédiatement lorsqu'une étape critique échoue.

---

# PHASE 7 - DOCUMENTATION IA

Créer :

/docs/ai/project-context.md
/docs/ai/architecture.md
/docs/ai/coding-rules.md
/docs/ai/testing-rules.md
/docs/ai/security-rules.md
/docs/ai/deployment-rules.md
/docs/ai/business-rules.md
/docs/ai/glossary.md

Ces fichiers doivent permettre à une IA arrivant sur le projet de comprendre immédiatement :

- l'objectif métier
- l'architecture
- les conventions
- les dépendances
- les workflows
- la sécurité
- les règles de qualité

---

# PHASE 8 - SUPPORT DU VIBECODING

Créer des fichiers de contexte optimisés pour :

- Claude Code
- Cursor
- GitHub Copilot
- Codex
- Windsurf

Ajouter :

- conventions de prompts
- conventions d'architecture
- conventions de tests
- conventions de sécurité
- conventions Git

Objectif :

Réduire les hallucinations des IA et augmenter la qualité des générations.

---

# PHASE 9 - ARCHITECTURE

Évaluer :

- découpage des responsabilités
- modularité
- maintenabilité
- scalabilité
- extensibilité

Proposer et appliquer des améliorations.

---

# PHASE 10 - OBSERVABILITÉ

Mettre en place si absent :

- logging structuré
- monitoring
- gestion des erreurs
- métriques
- traces
- alertes

---

# PHASE 11 - LIVRABLES

Je veux :

1. Les problèmes détectés.
2. Les améliorations proposées.
3. Les fichiers créés.
4. Les fichiers modifiés.
5. Le contenu complet de chaque fichier.
6. Les commandes à exécuter.
7. Les dépendances ajoutées.
8. Les risques éventuels.
9. Le plan de migration.
10. La roadmap long terme.

Ne me donne pas seulement des conseils.

Génère directement le contenu réel des fichiers, des scripts, des tests et des configurations.

---

# RÈGLE PRINCIPALE

Chaque décision doit répondre à la question :

"Comment détecter automatiquement une erreur générée par une IA le plus tôt possible ?"

Favoriser systématiquement :

- feedback rapide
- automatisation maximale
- type safety
- tests
- sécurité
- observabilité
- documentation
- reproductibilité

Ne fais aucune hypothèse.

Analyse d'abord le dépôt puis adapte toutes les solutions à la stack détectée.

Ton rôle est d'industrialiser complètement ce projet pour un développement assisté par IA de niveau entreprise.
