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
- `hotfix: fix index.html missing file generation in release`

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
   - Ne réservez `npm run build` qu'à la validation finale du bundle standalone (`dist/index.html`).

2. **Exploitation des caches :**
   - Ne supprimez pas le dossier `.vite` ou `node_modules` systématiquement.
   - En environnement automatisé ou conteneurisé, préférez `npm ci` à `npm install` pour garantir des temps d'installation optimaux et des dépendances strictes.

3. **Précautions sur le script de build :**
   - Le script `build` exécute `vite build` et génère un visualiseur HTML standalone unique et autonome dans `dist/index.html` exempt de toute donnée d'exemple.
   - Les jeux de données de démonstration ou de test sont stockés dans `examples/` (ex. `examples/eco-stays/`) et ne sont jamais intégrés au bundle de distribution.

4. **Synthèse des règles d'or :**
   - Branche dédiée `feat/...` ou `fix/...`
   - Actions Git automatiques au fur et à mesure (commits atomiques et pushs continus)
   - Commits conventionnels et itérations locales rapides
   - Tests ciblés en dev, tests intégraux exigés en PR
   - Merge sur `main` uniquement via PR (hotfix direct sur `main` exceptionnel)

---

## 6. Automatisation du Versioning et Changelog (Semantic-Release)

Le projet utilise **semantic-release** intégré dans le workflow GitHub Actions (`.github/workflows/ci.yml`).

### Fonctionnement du cycle de release :
1. **Déclenchement automatique** : À chaque merge de Pull Request sur la branche `main`, le job `release` s'exécute après le succès des tests.
2. **Déduction du SemVer** :
   - `feat(...)` : Incrément **MINEUR** (`1.3.0` $\rightarrow$ `1.4.0`).
   - `fix(...)`, `hotfix(...)`, `perf(...)` : Incrément **PATCH** (`1.3.0` $\rightarrow$ `1.3.1`).
   - `BREAKING CHANGE:` ou `feat(...!):` : Incrément **MAJEUR** (`1.3.0` $\rightarrow$ `2.0.0`).
   - `docs`, `chore`, `refactor`, `test`, `ci`, `build` : Aucun saut de version.
3. **Mise à jour du Changelog (`CHANGELOG.md`)** : Généré automatiquement avec les sections correspondantes (Features, Bug Fixes, Hotfixes, Performance).
4. **Mise à jour de `package.json` et Tag Git** : Un commit `chore(release): X.Y.Z [skip ci]` et un tag Git `vX.Y.Z` sont créés automatiquement.
5. **Assets de la GitHub Release** : L'artefact autonome `dist/index.html` et l'archive ZIP `information-architecture-studio-vX.Y.Z.zip` sont attachés à la release GitHub.

### Test local (Dry-run) :
Pour vérifier la détection de version et le changelog sans publier :
```bash
npx semantic-release --dry-run
```

---

## 7. Actions Git Automatiques au Fil de l'Eau (Obligation pour les Agents IA)

Pour garantir la traçabilité, éviter toute perte de travail et maintenir un historique Git clair et granulaire, **l'agent IA doit exécuter les actions Git de manière proactive et automatique au fur et à mesure de son travail**, sans attendre une demande explicite de l'utilisateur :

1. **Initialisation de la tâche :**
   - Inspecter systématiquement l'état du dépôt (`git status`, `git branch`).
   - Si les modifications concernent un nouveau sujet ou si le workspace est sur `main`, basculer immédiatement sur une branche dédiée (`feat/...`, `fix/...`, `chore/...`). Ne jamais développer directement sur `main`.

2. **Commits atomiques et réguliers au fil de l'eau :**
   - **Ne jamais accumuler l'ensemble des changements pour un unique commit en fin de session.**
   - Dès qu'une sous-tâche, un fichier clé, une refactorisation ou un test est terminé et validé, exécuter immédiatement un commit conventionnel (`git add <fichiers>` puis `git commit`).
   - Chaque commit doit représenter une unité logique de changement claire.

3. **Synchronisation continue (`git push`) :**
   - Pousser régulièrement la branche de travail vers le dépôt distant (`git push -u origin <nom-branche>` dès le premier commit, puis `git push` au fur et à mesure des commits significatifs).
   - Cela assure la sauvegarde en temps réel du travail dans l'espace distant.

4. **Clôture et propreté :**
   - Avant de rendre la main à l'utilisateur, vérifier `git status` pour s'assurer qu'aucun fichier orphelin (*untracked*) ou modification non commitée ne subsiste.
   - Confirmer brièvement à l'utilisateur les commits réalisés et le statut de synchronisation de la branche.

