# Information Architecture Studio (`ai-studio`)

Visualiseur web unifié, interactif et autonome pour l'Architecture de l'Information (IA) : arborescences (*sitemaps*), parcours utilisateurs (*userflows*) et fiches d'écrans.

---

## 🌟 Introduction

**Information Architecture Studio** (`ai-studio`) est un outil conçu pour explorer, inspecter et partager visuellement les livrables d'Architecture de l'Information d'une application ou d'un service.

Compilé sous la forme d'un **fichier HTML unique et autonome** (`preview.html`), il s'exécute directement dans un navigateur moderne (y compris via le protocole `file://`, sans nécessiter de serveur applicatif ou de runtime Node.js en production).

### Principales fonctionnalités
- **Canevas vectoriel SVG infini** : Navigation fluide (pan & zoom haute fidélité sans pixellisation, centrage automatique).
- **Arborescences & Parcours unifiés** : Visualisation claire des sitemaps et des flux utilisateurs (empilement vertical des cas d'usage, flux nominaux, variantes et segments).
- **Navigation transversale** : Passerelle instantanée entre un écran dans l'arborescence et ses apparitions dans les parcours utilisateurs.
- **Inspecteur latéral & Filtrage** : Exploration détaillée des écrans, actions, conditions, métadonnées métier et masquage dynamique par calques.

---

## 🔗 Écosystème : Synergie avec `ai-skills`

Ce studio fonctionne en tandem avec le dépôt [**Pi0up/ai-skills**](https://github.com/Pi0up/ai-skills) :

- **[ai-skills](https://github.com/Pi0up/ai-skills)** est la suite de compétences et d'agents d'IA qui structure, conçoit et génère automatiquement les spécifications d'Architecture de l'Information (diagrammes Mermaid `.mmd`, fiches écrans `screen-sheets/` et `metadata.json`).
- **ai-studio** sert de **visualiseur officiel** pour donner vie aux projets conçus avec `ai-skills`, offrant aux équipes produit, designers et développeurs une interface visuelle ergonomique pour valider et parcourir les projets.

---

## ⚙️ Principe de fonctionnement général

Le fonctionnement repose sur une boucle simple et modulaire :

```
┌─────────────────────────────────┐
│     Données déclaratives        │
│ (Mermaid .mmd, JSON, fiches MD) │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│        Moteur ai-studio         │
│  - Parsing & enrichissement     │
│  - Tracé vectoriel SVG natif    │
│  - Navigation transversale      │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│      Livrable autonome          │
│     (dist/preview.html)         │
└─────────────────────────────────┘
```

1. **Sources déclaratives simples** : Le studio consomme un jeu de fichiers (placés par défaut dans `public/` ou `generated/`) :
   - Les diagrammes d'arborescence et de parcours (`sitemap-*.mmd`, `PF-*.mmd`) enrichis de métadonnées.
   - Les fiches descriptives détaillées de chaque écran (`screen-sheets/*.md`).
   - Un index global (`metadata.json`).
2. **Moteur de rendu SVG natif** : Les graphes sont analysés et rendus sous forme d'arborescences et de flux vectoriels avec calcul automatique de l'alignement, des courbes de liaison (Bézier) et des pastilles d'état.
3. **Pilotage par les métadonnées** : Les cartes d'écrans, d'actions et d'attentes sont habillées dynamiquement en fonction de leur statut, rôle ou tags, avec synchronisation continue de l'inspecteur d'informations.
4. **Distribution ultra-légère** : Le projet se compile via Vite en un fichier unique minifié intégrant HTML, styles CSS et scripts JS vanilla.

---

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 20 ou supérieure recommandée)
- `npm`

### Installation
```bash
npm install
```

### Développement
Lance le serveur de développement Vite avec rechargement à chaud et jeu de données de démonstration :
```bash
npm run dev
```

### Tests
Exécute la suite de tests unitaires avec Vitest :
```bash
npm test
```

### Compilation (Build)
Génère le visualiseur unique et autonome dans `dist/preview.html` :
```bash
npm run build
```

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
