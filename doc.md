# Experiments — le projet et ses décisions

Petit labo de micro-expériences visuelles, dans une interface sobre façon Vercel. Chaque expérience est un mini-outil : des réglages à gauche, un aperçu au centre, un export PNG.

- Site : https://xp.arthurschmitt.com (GitHub Pages, déployé à chaque push sur `main`)
- Dépôt : https://github.com/tart2000/experiments (public)
- Expériences : **Ransom note generator** (`/ransom`), **Browser mockup** (`/browser`), **Carousel texte** (`/carousel`)

## Lancer le projet

```bash
npm install
npm run dev -- --port 5199   # 5173 était déjà pris sur la machine
npm run build                # tsc + vite build
```

## Stack (et pourquoi)

| Choix | Raison |
|---|---|
| **Vite + React + TypeScript**, un seul `package.json` | Simple ; pas de monorepo tant qu'on n'en a pas besoin |
| **Tailwind v4 + composants façon shadcn écrits à la main** (Radix), police **Geist** | Rendu « Vercel » sans passer par la CLI shadcn |
| **Zustand** | État des réglages, minimal |
| **Phosphor Icons** | Choisi par Arthur pour tout le projet (Lucide a été retiré) |
| **Canvas 2D** pour le rendu | Export PNG direct, rotations, découpes (`clip`), blends (`multiply`), pas de dépendance |
| **Routeur maison (History API)** | Deux routes suffisent : `/` et `/<id>` |

## Architecture

```
src/
  App.tsx            shell : sidebar (accueil, dropdown de projet, réglages, bouton PNG) + aperçu
  Home.tsx           grille de cartes carrées
  store.ts           réglages de toutes les expés
  lib/               persist.ts (JSON dev), prng.ts (aléatoire seedé), router.ts
  components/        controls.tsx (Section, Field, SliderField) + ui/ (button, select, slider…)
  experiments/
    types.ts         contrat d'une expérience
    registry.ts      liste des expériences
    ransom/  browser/
ransom/textures/     textures lues directement par l'app (paper/, color/, paper_LG.jpg)
```

**Ajouter une expérience** = un dossier dans `src/experiments/` qui exporte `{ id, title, thumbnail, defaultParams, Controls, Preview, onLoad? }`, plus une ligne dans `registry.ts`. La carte de l'accueil et la route apparaissent toutes seules.

## Décisions transverses

- **Persistance JSON temporaire, dev uniquement.** Un petit plugin Vite (`vite.config.ts`) expose `GET/PUT /api/state/:id` qui lit/écrit `data/<id>.json` (gitignoré). En production il n'y a pas de serveur : les appels sont sautés et chaque visite repart des valeurs par défaut. Piste ouverte : `localStorage`.
- **Nouveau seed à chaque rechargement** (hook `onLoad` de l'expérience), pour que chaque visite donne un résultat différent.
- **Les textures ne sont pas copiées** : `import.meta.glob` lit `ransom/textures/{paper,color}`. Déposer un fichier dans le dossier suffit. Les exports `ransom-*` y sont ignorés. Les motifs de glob doivent être des chaînes littérales (limite Vite).
- **Déploiement** : workflow GitHub Actions → Pages. Comme le domaine perso est à la racine, le build utilise `BASE=/`. `404.html` est copié depuis `index.html` pour que `/ransom` marche en accès direct.
- **Domaine** : sous-domaine Ionos avec 4 enregistrements A vers les IP de GitHub Pages.
- **Vie privée (Browser mockup)** : l'image chargée reste en mémoire dans le navigateur, elle n'est jamais envoyée ni sauvegardée.

## Ransom note generator

**Principe.** `layout(text, params) → LetterSpec[]` est une fonction **pure et déterministe** ; `render.ts` dessine à partir de ces specs. Cette séparation a rendu possible l'édition lettre par lettre.

**Aléatoire.** Chaque lettre a 4 flux aléatoires indépendants (géométrie/type, fond, couleurs, décorations), dérivés de `hash(seed, index)`. Modifier un aspect d'une lettre ne change ni ses autres aspects, ni les autres lettres.

**Rendu d'une lettre.**
- Fond : uni, texture couleur (rotation, retournement, recadrage, teinte multiply) ou papier déchiré (la texture donne sa propre forme via son alpha).
- Forme : quadrilatère à **côtés droits**, non parallèles. Les bords déchirés « en polygone » ont été retirés (trop bizarres).
- Marges serrées autour du glyphe, pour qu'une lettre puisse avoir été « découpée toute seule ».
- Texte : couleur unie, dégradé ou texture. Jamais de texture sur le texte quand le fond est déjà texturé (tirage auto seulement).
- Décorations facultatives : `decoration.{frame, outline, textShadow}`. Le cadre est rare (~3 %), l'« ombre » est une ombre décalée du texte.
- **Plus aucune ombre portée derrière les découpes** : elle n'était pas contrôlable et invisible sur fond sombre.

**Options globales.** Texte multi-lignes (les retours à la ligne sont pris en compte), espacement, interligne, variations de taille/angle/décalage, choix des polices, fond de l'image (transparent par défaut, blanc, noir), 4 palettes (Standard, Vintage, Fluo, Noir & blanc, chacune avec son filtre), texture papier globale en option (`paper_LG.jpg`, appliquée à 50 %).

**Format.** Canvas de 1600×900 minimum ; la hauteur grandit avec le texte, l'aperçu défile. Le curseur « Taille » grossit les lettres, pas le cadre.

**Panneau de lettre.** Un clic sur une lettre ouvre un panneau : police (avec aperçu de la lettre), casse, taille, angle, marges, couleur/dégradé/texture du texte, type et couleur du fond, décorations. Les changements sont stockés dans `overrides[index]` et réinitialisés au reroll ou au rechargement.

## Browser mockup

- Fenêtre de **1440 px de large fixe** ; la hauteur suit l'image.
- Navigateurs : Safari, Chrome, Arc (minimal), chacun clair/sombre, dessinés en Canvas.
- Options : URL, titre d'onglet, arrondi, ombre, marge, fond, résolution d'export.
- **Ratio de l'image finale** : Auto, 1:1, 2:3, 3:4, 3:2, 4:3. En ratio fixe, la fenêtre reste ancrée en haut, sa hauteur est plafonnée par la marge du bas (l'image est coupée), et l'aperçu tient entièrement dans la zone.
- Plafond de sécurité : un canvas ne dépasse pas 16 000 px, l'échelle d'export baisse toute seule au besoin.

## Carousel texte

- Un grand texte, chaque `---` démarre une nouvelle slide (nombre de slides = séparateurs + 1) ; les retours à la ligne sont conservés.
- Réglages : format (1:1, 4:5, 3:4, 9:16, 1,91:1, 16:9, 2:3), couleur de fond et de texte (20 pastilles + couleur libre), 10 polices, déco du bas (rien, flèche, points).
- **Aperçu en HTML/CSS** (`SlidePreview.tsx`) : la slide est mise en page à la taille réelle du format puis réduite par `transform`. L'auto-fit du texte mesure le DOM (`largestFitting`, recherche dichotomique sur des entiers : une version à bornes décimales bouclait à l'infini et figeait le navigateur).
- **Logo** (optionnel) : choisi depuis l'ordinateur, gardé en mémoire (jamais envoyé ni sauvegardé), calé en haut à gauche de chaque slide, 100 px de haut au plus (jamais agrandi) ; le texte démarre sous lui. Géométrie dans `fit.ts`, store dans `logo.ts`.
- **Export en canvas** (`render.ts`) : même géométrie (`fit.ts`) et même algorithme d'ajustement ; 1 slide → PNG, plusieurs → `carousel.zip` (fflate). Le bouton du shell affiche un loader pendant la génération.

## Points d'attention connus

- Le contraste texte/fond suppose un gris clair pour les textures ; certaines textures sombres peuvent donner un texte peu lisible.
- Le dépôt étant public, `ransom/references/` et une partie des textures (banques d'images) y sont visibles. À retirer si on veut être propre côté droits.
- `paper_1.png` contient un filigrane visible sur son fond transparent.
- En prod, les réglages ne sont pas conservés.

## Pistes

Étiquettes Dymo, enseigne à néon, tuiles de scrabble ; partage du code commun (panneau de lettre, palettes) vers un dossier partagé ; sauvegarde des réglages dans `localStorage`.
