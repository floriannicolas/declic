# Déclic

Jeu de révision des cours du club photo, chapitre par chapitre. Next.js (App Router), TypeScript, Motion, Tailwind. Tout le contenu est embarqué, aucune requête réseau, progression en `localStorage`.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm test    # moteur, contenu, faisabilité des scénarios
pnpm build   # valide aussi tout le contenu (Zod) : une donnée invalide fait échouer le build
```

## Architecture

```
src/types/          contrat des données : Chapter, Camera, Scenario, questions
src/data/chapters/  contenu pédagogique, un fichier par cours + registre
src/data/cameras/   profils de boîtier, un fichier par appareil + registre
src/data/schemas.ts validation Zod du contenu, exécutée au build
src/engine/         logique pure : exposition, objectifs, simulateur, aperçu, score, tirage, questions
src/progress/       persistance derrière l'interface ProgressRepository (localStorage aujourd'hui)
src/components/     présentation et animations
src/components/illustrations/  illustrations SVG interactives, référencées par identifiant
public/photos/      photos de l'aperçu du simulateur, crédits dans src/data/photo-credits.ts
```

Les deux axes sont indépendants : un chapitre ne nomme jamais d'objectif ni de boîtier. Un scénario demande un rôle d'objectif (`standard-zoom`, `fast-prime`...) et une focale. Le moteur choisit l'objectif dans le profil et lit toutes les limites (vitesses, ISO, ouvertures, capteur, stabilisation) depuis ce profil.

## Ajouter un chapitre

1. Créer `src/data/chapters/chapter-2.ts` qui exporte un objet `Chapter`.
2. L'ajouter au tableau de `src/data/chapters/index.ts`.

Le menu le liste automatiquement. Un mode dont le contenu est vide (pas de scénarios, pas de diagnostics...) n'apparaît pas. Les textes d'explication des scénarios peuvent utiliser `{lens}`, `{maxAperture}`, `{maxShutter}`, `{stabilization}` et `{model}`, remplacés par les valeurs du profil.

Pour aller plus loin, un chapitre peut aussi fournir :

- `more` sur un terme, une question ou un diagnostic : des paragraphes et une illustration (`illustration: "bokeh"`), affichés repliés sous l'explication et dans le lexique ;
- `guides` : les aide-mémoire ouverts depuis le simulateur (`simulator`, `shutter`, `aperture`, `iso`) et le calcul de stops (`stops`), avec des rappels de vocabulaire (`terms`) ;
- `preview.photo` sur un scénario : un fond et un sujet détouré dans `public/photos/`, chaque fichier étant déclaré dans `src/data/photo-credits.ts`.

Une nouvelle illustration s'ajoute dans `ILLUSTRATION_IDS` (`src/types/question.ts`) puis dans le registre `src/components/illustrations/index.tsx` : TypeScript signale l'oubli.

Lancer `pnpm test` : il vérifie que chaque scénario a au moins une solution sur chaque profil.

## Ajouter un profil d'appareil

1. Créer `src/data/cameras/canon-r8.ts` qui exporte un objet `Camera` (copier `d3500.ts` comme modèle).
2. L'ajouter au tableau de `src/data/cameras/index.ts`.

Avec un seul profil, il est utilisé sans rien demander. Dès qu'il y en a deux, un sélecteur apparaît sur l'accueil et le choix est mémorisé. Les questions du mode « Spécial boîtier » viennent du champ `questions` du profil, et l'ordre des molettes de `screen.layout`.

## Déploiement

Projet Next.js standard : l'importer dans Vercel, sans configuration particulière.
