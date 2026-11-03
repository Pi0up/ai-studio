# Instructions pour les Agents IA et Développeurs (`AGENTS.md`)

Ce document définit les directives d'ingénierie logicielle, les conventions Git, les règles de contribution et les optimisations de build pour ce projet (`ai-studio`).

---

## 1. Gestion des Branches et Bonnes Pratiques Git

Toute contribution doit suivre le modèle standardisé **GitHub Flow / Trunk-Based Development** avec des branches de travail dédiées.

### Conventions de nommage des branches
Les branches doivent utiliser la casse `kebab-case` et être préfixées par le type de modification :
- `feat/<nom-fonctionnalite>` : Ajout d'une nouvelle fonctionnalité.
- `fix/<nom-correctif>` : Correction d'un bug identifié.
- `hotfix/<description-urgence>` : Correctif critique en production / branche principale.
- `refactor/<nom-refactoring>` : Refactorisation de code sans modification de comportement.
- `perf/<optimisation>` : Amélioration de performance.
- `docs/<sujet>` : Documentation seule.
- `chore/<sujet>` : Tâches d'infrastructure, dépendances ou configuration tooling.

*Exemples :*
- `feat/zoom-controls`
- `fix/mermaid-render-overflow`
- `hotfix/broken-preview-bundle`

---

## 2. Cycle de Vie des Modifications : Pull Requests & `main`

### Règle d'or : PR obligatoire pour merger sur `main`
- **Toute modification doit impérativement passer par une Pull Request (PR)** validée avant d'être fusionnée sur la branche `main`.
- La PR doit comporter un résumé clair des changements apportés et pointer vers l'éventuelle issue concernée.

### Exception d'urgence : Hotfixes directs sur `main`
- Les commits et pushs directs sur `main` sont **strictement réservés aux hotfixes d'extrême urgence** (ex: régression bloquante immédiate en production, rupture de release critique).
- Même dans ce cas, le message de commit doit expliciter la nature critique du hotfix (`hotfix: ...`), et le code doit être vérifié localement avant le push.

---

## 3. Normes de Commits (Conventional Commits)

Les messages de commit doivent strictement respecter la spécification **Conventional Commits** :

```text
<type>(<périmètre optionnel>): <description courte et impérative>

[corps optionnel expliquant le 'pourquoi']
```

### Types autorisés :
- `feat` : Nouvelle fonctionnalité.
- `fix` : Correction de bug.
- `hotfix` : Correctif urgent.
- `perf` : Gain de performances.
- `refactor` : Restructuration de code.
- `test` : Ajout ou correction de tests.
- `build` : Modification touchant le système de build (Vite, packaging, etc.).
- `ci` : Configuration GitHub Actions ou CI/CD.
- `docs` : Documentation.
- `chore` : Tâches diverses, mise à jour de dépendances.

*Exemples :*
- `feat(viewer): implement pan and zoom navigation`
- `fix(sitemap): correct tree layout algorithm edge case`
- `hotfix: fix preview.html missing file generation in release`

---

## 4. Tests et Débit de Travail : Local vs CI

Pour allier **qualité logicielle absolue** et **rapidité d'itération maximale**, nous appliquons un compromis pragmatique entre l'environnement local et l'environnement CI :

### En Pull Request (CI GitHub Actions) : Zéro compromis
- **Tous les tests doivent obligatoirement passer (`npm test`).**
- Le build de production doit réussir sans erreur (`npm run build`).
- Tout échec de test bloque le merge de la PR.

### En local : Accélérer la boucle de feedback
- **Saut des tests en commit local autorisé** : Lors des commits intermédiaires de travail, il est permis de sauter l'exécution automatique de la suite de tests (ex: via `git commit --no-verify`) pour éviter d'alourdir le temps de commit et de build local.
- **Tests ciblés** : Au lieu de relancer toute la suite Vitest à chaque micro-changement, ciblez uniquement les tests impactés par vos modifications :
  ```bash
  # Lancer uniquement un fichier de test spécifique
  npx vitest run tests/viewer.test.js

  # Mode watch ciblé sur les fichiers modifiés
  npx vitest watch tests/viewer.test.js
  ```
- **Validation avant PR** : Avant d'ouvrir une PR ou de demander une revue, lancez la suite complète localement au moins une fois (`npm test`) pour vous assurer que la CI passera au vert dès le premier coup.

---

## 5. Optimisation du Build & Prévention des Erreurs

Afin de préserver la vélocité sans introduire de régressions :

1. **Privilégier le serveur de développement en local (`npm run dev`) :**
   - Ne lancez pas un `npm run build` complet à chaque modification de code frontend. Le serveur Vite HMR (Hot Module Replacement) compile à la volée en quelques millisecondes.
   - Ne réservez `npm run build` qu'à la validation finale du bundle standalone (`dist/preview.html`).

2. **Exploitation des caches :**
   - Ne supprimez pas le dossier `.vite` ou `node_modules` systématiquement.
   - En environnement automatisé ou conteneurisé, préférez `npm ci` à `npm install` pour garantir des temps d'installation optimaux et des dépendances strictes.

3. **Précautions sur le script de build :**
   - Le script `build` combine `vite build` avec une étape Node.js post-build générant `dist/preview.html` et copiant les assets de `public/`.
   - Vérifiez que vos modifications d'assets ou de template ne cassent pas la structure attendue par ce script dans [package.json](file:///c:/Users/vincent.pperrery/Documents/_dev/ai-studio/package.json).

4. **Synthèse des règles d'or :**
   - Branche dédiée `feat/...` ou `fix/...`
   - Commits conventionnels et itérations locales rapides
   - Tests ciblés en dev, tests intégraux exigés en PR
   - Merge sur `main` uniquement via PR (hotfix direct sur `main` exceptionnel)
