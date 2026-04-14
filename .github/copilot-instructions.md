# Instructions — billingdjinn

## Contexte du projet

Application de gestion de factures. Stack : Astro + Vue 3 + Tailwind v4 + DaisyUI v5 + PrimeVue 4 + PocketBase.

## Projet de référence : lexlsf

**Chemin absolu :** `/Users/joelpoulin/Sites/astro/lexlsf`

lexlsf est le projet de référence qui utilise exactement la même stack et fonctionne en production.

### Règle fondamentale

Quand une feature de billingdjinn s'inspire de lexlsf ou qu'un bug est signalé :

1. **Lire d'abord le fichier correspondant dans lexlsf** avant toute analyse ou hypothèse.
2. **Copier au maximum depuis lexlsf** — ne pas réécrire ce qui existe et fonctionne déjà.
3. **Faire confiance au code de lexlsf** : s'il s'y trouve, il est considéré comme correct et fonctionnel.
4. **Ne pas inventer de raisons** à un bug avant d'avoir vérifié comment c'est fait dans lexlsf et comparé les deux implémentations.

### Exemples d'application

- Bug sur un composant Vue → lire le composant équivalent dans `lexlsf/src/` en premier.
- Feature à implémenter → copier le fichier lexlsf correspondant, adapter les noms/labels.
- Comportement inattendu d'un composable → comparer ligne à ligne avec lexlsf.

## Architecture

- `pb/` — PocketBase (binaire stock, pas de Go custom)
- `pb/pb_migrations/` — Migrations JS auto-exécutées au démarrage de PocketBase
- `src/admin/` — SPA Vue admin (router, composables, views, components, layouts)
- `src/components/` — Composants Astro/Vue partagés (AuthGuard, LoginModal, UserAuth, Hero…)
- `src/layouts/` — Layouts Astro (BaseLayout, SiteLayout, AdminLayout)
- `src/pages/` — Pages Astro + `_app.ts` (setup PrimeVue)
- `src/styles/global.css` — Tailwind v4 + DaisyUI (thèmes `djinn` / `darkdjinn`)
- `src/config/index.ts` — `apiBaseUrl`

## PocketBase

- Port local : `8092` (`pnpm db`)
- Collections avec `viewRule: null` = superadmin uniquement → mettre `""` pour les collections accessibles via `expand`
- Auth stockée dans `sessionStorage` (`userJwt`) ET dans `localStorage` (pb.authStore interne)
- Migrations : créer un fichier horodaté dans `pb/pb_migrations/`, redémarrer PocketBase pour appliquer

## Points d'attention connus

- **Vue Router guard** : utiliser le pattern `return false` (pas le paramètre `next`) pour éviter `Invalid navigation guard`
- **DaisyUI drawer admin** : doit avoir `h-full` et un parent avec hauteur explicite (`h-[calc(100vh-5rem)]`)
- **AdminLayout** : utilise `BaseLayout` directement (sans footer), pas `SiteLayout`
- **`pb.authStore`** : si `localStorage` vidé, restaurer depuis `userJwt` sessionStorage avant `refreshAuth()`
