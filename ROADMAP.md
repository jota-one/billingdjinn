# RoadMap du projet billing djinn

Ce document maintient la liste des changements planifiés pour le projet et sert de référence partagée pour la priorisation, le périmètre et l'avancement.

Format recommandé pour le suivi: `- [AAAA-MM-JJ] Titre — note courte`.

## Améliorations, refactorings

Liste des petites améliorations et refactorings potentiels.

- Ajouter un petit système de conversion de devises si une facture a été faite dans une autre devise que la devise principale de l'entreprise, histoire de pouvoir remonter des chiffres corrects. Là je suppose que pour la facture en euros que nous avons faite, le montant a bêtement été additionné comme s'il s'agissait de CHF


## Nouvelles fonctionnalités

### Personnalisation des labels de facture
Objet `labels` dans `company_settings` (JSON) permettant de surcharger les textes du PDF : entêtes de colonnes (Description, Qté, Prix unit., Total), sections (À l'attention de, Notes), totaux (Total HT, TVA, Total TTC), mentions de paiement. Utile pour les factures bilingues ou par convention client.

### Personnalisation du layout de facture
Templates PDF prédéfinis (ex. `template_id` dans `company_settings`) : organisation de l'entête (logo gauche/droite/centré), densité (compact vs aéré), éventuellement couleur d'accent. À préciser : nombre de templates, options exposées.


## Historique (fait)

- [2026-03-17] Vue DB `client_stats` — agrégation CA annuel / CA cumulé / dernière facture par client, basée sur `invoice_totals`. Affichage avec tri dans la liste des clients.
- [2026-03-17] Dashboard — formatage CHF (apostrophe à partir de 10'000, point décimal, pas de séparateur sous 10'000) + devise dans les labels des KPI cards.

- [2026-03-15] Devise multi-monnaie — champ `currency` sur `company_settings` et `clients` (override). Cascade vers les snapshots et le PDF. CHF par défaut, options CHF/EUR/USD/GBP.
- [2026-03-15] Import / Export CSV — export et import CSV pour clients et factures. Moteur générique (`useImportExport`) + composables spécifiques. Format dénormalisé pour les factures (une ligne par ligne de facture, groupées par `invoice_number` à l'import).
- [2026-03-14] Export PDF + immutabilité — génération PDF via `pdfmake` (logo base64, lignes, TVA, totaux, IBAN). Snapshots `client_snapshot` / `company_snapshot` (JSON) gelés au passage en "Envoyée". Formulaire verrouillé dès lors, statut seul reste modifiable (retour à Brouillon impossible).
- [2026-03-14] Factures — CRUD complet (liste, création, édition) avec lignes de facture, TVA surchargeable, numérotation auto `YYYY-NNN` (pratique, non légalement requis en CH), statuts (brouillon/envoyée/payée), date d'échéance calculée depuis `payment_terms`. Collections PocketBase `invoices` + `invoice_lines`.
- [2026-03-13] Gestion des clients — CRUD complet avec liste DataTable, pages `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id`. Collection PocketBase `clients` + ajout `payment_terms` aux settings entreprise.
- [2026-03-12] Settings de l'entreprise — page `/admin/settings` avec form complet (nom, adresse, téléphone, email, IBAN, logo, TVA, taux horaire). Collection PocketBase `company_settings` singleton + migrations.
