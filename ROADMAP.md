# RoadMap du projet billing djinn

Ce document maintient la liste des changements planifiés pour le projet et sert de référence partagée pour la priorisation, le périmètre et l'avancement.

Format recommandé pour le suivi: `- [AAAA-MM-JJ] Titre — note courte`.

## Améliorations, refactorings

Liste des petites améliorations et refactorings potentiels.

## Nouvelles fonctionnalités

### Personnalisation du layout de facture

Templates PDF prédéfinis (ex. `template_id` dans `company_settings`) : organisation de l'entête (logo gauche/droite/centré), densité (compact vs aéré), éventuellement couleur d'accent. À préciser : nombre de templates, options exposées.

## Historique (fait)

- [2026-04-14] Refactoring catégories du Grand Livre — `ledger.category` (texte libre) remplacé par une relation vers une collection `categories` dédiée (nom + patterns). CRUD des catégories dans les Settings. Migration en deux temps : migrations PocketBase (1776211200 + 1776211201) puis script `migrate-categories.js --commit`, puis migration 1776211202 qui supprime l'ancien champ et recrée la vue `ledger_stats` avec JOIN.

- [2026-04-12] Rapprochement bancaire → matching automatique des factures — Lors de la confirmation d'une réconciliation, les écritures de catégorie « Facture » déclenchent une recherche automatique dans les factures envoyées (scoring date+montant via `invoice_totals`). Si un candidat dépasse le seuil de confiance (0.5), la facture est marquée payée et liée à l'écriture du ledger.

- [2026-04-10] Rapprochement bancaire camt.053 — Import de relevés bancaires XML (ISO 20022), algorithme de matching date+montant avec les écritures du ledger, confirmation en lot. Entrées non matchées créables directement depuis l'import. Adaptateur unique camt.053 (CSV supprimés).

- [2026-04-10] Catégories du ledger avec patterns de détection — Les catégories définissent désormais des patterns (texte ou regex) pour l'attribution automatique lors de l'import. Matching par spécificité (le pattern le plus précis gagne, support multi-mots dans n'importe quel ordre). Suppression bloquée si la catégorie est utilisée dans le ledger.

- [2026-04-10] Vue SQL `ledger_stats` — Vue PocketBase agrégeant crédit/débit par catégorie et exercice fiscal. Stats et vérifications de catégories utilisées passent de N écritures à quelques dizaines de lignes agrégées.

- [2026-04-10] Grand Livre scrollable + séparateur passé/futur — DataTable en `scrollHeight="flex"`, séparateur visuel entre écritures passées et futures (tri par date), correction du `scrollIntoView` qui scrollait la page entière au lieu du tableau.

- [2026-04-01] Amélioration template facture — Template de facture affiné et extraction de labels supplémentaires paramétrables depuis le layout.

- [2026-03-30] Autoscroll Grand Livre — Au chargement, le tableau scrolle automatiquement vers l'entrée la plus proche de la date du jour (ou vers l'entrée focalisée si navigation depuis une autre page).

- [2026-03-29] Saisie en série — wizard 4 étapes pour créer des écritures récurrentes planifiées. Récurrences : journalier, hebdomadaire (choix du jour), mensuel, trimestriel (choix du jour / dernier jour / dernier jour ouvrable), annuel (idem). Date de fin ou nombre d'occurrences. Suffixe automatique sur le libellé (mois pour mensuel, Q1-Q4 pour trimestriel). Aperçu avant validation.

- [2026-03-29] Page Statistiques Grand Livre — KPIs (revenus, charges, résultat, charges sociales AVS+LPP+LAA, ratio charges/revenus). Donut charges par catégorie. Graphique de tendance multi-séries par catégorie sur les 5 dernières années. Sélecteur d'année. Catégorie "Erreur" exclue de tous les calculs.

- [2026-03-29] Filtres Grand Livre — multiselect année et catégorie (persistés en localStorage). Compteur "N sur total" dans le footer. Bouton "Saisie en série" dans la barre d'actions.

- [2026-03-29] Normalisation des catégories — script `scripts/normalize-ledger-categories.js` via API PocketBase (dry-run par défaut, `--commit` pour appliquer). Fusionne les doublons (casse, pluriels), renomme les catégories ad hoc (`Service` → `Fiduciaire`, `unique` → `Constitution`, etc.), met à jour `ledger_categories` dans `company_settings`.

- [2026-03-28] Dashboard par année — dropdown pour sélectionner l'année (courante par défaut, persistée en localStorage). KPIs et graphiques recalculés comme si on était à la fin de l'année choisie. Toggle "année / all time" sur le chart Top clients.
- [2026-03-28] Tri du Grand Livre persisté — sortField et sortOrder sauvegardés en localStorage via @vueuse/core useStorage.
- [2026-03-28] Transitoires (accruals) — champ `fiscal_year` sur les écritures du Grand Livre pour distinguer l'année de l'encaissement de l'année fiscale de rattachement. Attribution automatique à l'encaissement d'une facture (basé sur la date d'émission). Badge "Transitoire" dans le formulaire, mise en évidence visuelle dans le Grand Livre, page dédiée `/transitoires` avec classement entrants/sortants par exercice.

- [2026-03-23] Module Grand Livre — suivi des flux de trésorerie avec solde courant, catégories paramétrables, badge "À vérifier" pour les écritures passées non réconciliées. Import/Export CSV (dates DD.MM.YYYY, montants signés avec séparateur de milliers). Matching intelligent lors du passage d'une facture en "payée" : recherche des écritures planifiées par score date+montant, modal de sélection ou création automatique d'une écriture "Revenu".

- [2026-03-18] Templates PDF — extraction dans un dossier dédié `invoice-templates/` avec import dynamique au runtime (`TemplateName`). Nouveau template `graphic` : grand titre en couleur d'accent, forme décorative (carré + triangle rectangle) en arrière-plan, séparateur, client et métadonnées côte à côte, table avec header coloré et lignes zébrées, totaux fusionnés dans la même table pour alignement parfait.

- [2026-03-17] Conversion de devises — champ `converted_amount` sur `invoices`, éditable même sur facture verrouillée. Dashboard et vues DB utilisent `COALESCE(converted_amount, total_ht)` pour des chiffres cohérents en devise principale.
- [2026-03-17] Personnalisation des labels de facture — champ `labels` JSON sur `company_settings` et `clients`. Merge 3 couches (défaut → entreprise → client). Éditeur `InvoiceLabelsEditor` réutilisable. Intégration dans le PDF via `resolveLabels` + interpolation `label()`.
- [2026-03-17] Vue DB `client_stats` — agrégation CA annuel / CA cumulé / dernière facture par client, basée sur `invoice_totals`. Affichage avec tri dans la liste des clients.
- [2026-03-17] Dashboard — formatage CHF (apostrophe à partir de 10'000, point décimal, pas de séparateur sous 10'000) + devise dans les labels des KPI cards.

- [2026-03-15] Devise multi-monnaie — champ `currency` sur `company_settings` et `clients` (override). Cascade vers les snapshots et le PDF. CHF par défaut, options CHF/EUR/USD/GBP.
- [2026-03-15] Import / Export CSV — export et import CSV pour clients et factures. Moteur générique (`useImportExport`) + composables spécifiques. Format dénormalisé pour les factures (une ligne par ligne de facture, groupées par `invoice_number` à l'import).
- [2026-03-14] Export PDF + immutabilité — génération PDF via `pdfmake` (logo base64, lignes, TVA, totaux, IBAN). Snapshots `client_snapshot` / `company_snapshot` (JSON) gelés au passage en "Envoyée". Formulaire verrouillé dès lors, statut seul reste modifiable (retour à Brouillon impossible).
- [2026-03-14] Factures — CRUD complet (liste, création, édition) avec lignes de facture, TVA surchargeable, numérotation auto `YYYY-NNN` (pratique, non légalement requis en CH), statuts (brouillon/envoyée/payée), date d'échéance calculée depuis `payment_terms`. Collections PocketBase `invoices` + `invoice_lines`.
- [2026-03-13] Gestion des clients — CRUD complet avec liste DataTable, pages `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id`. Collection PocketBase `clients` + ajout `payment_terms` aux settings entreprise.
- [2026-03-12] Settings de l'entreprise — page `/admin/settings` avec form complet (nom, adresse, téléphone, email, IBAN, logo, TVA, taux horaire). Collection PocketBase `company_settings` singleton + migrations.
