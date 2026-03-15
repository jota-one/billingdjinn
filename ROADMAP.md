# RoadMap du projet billing djinn

Ce document maintient la liste des changements planifiés pour le projet et sert de référence partagée pour la priorisation, le périmètre et l'avancement.

Format recommandé pour le suivi: `- [AAAA-MM-JJ] Titre — note courte`.

## Améliorations, refactorings

Liste des petites améliorations et refactorings potentiels.

- Colonnes HT/TTC dans la liste des factures — actuellement `—`, à calculer via une view PocketBase (agrégation sur `invoice_lines`)


## Nouvelles fonctionnalités

### Personnalisation des labels de facture
Objet `labels` dans `company_settings` (JSON) permettant de surcharger les textes du PDF : entêtes de colonnes (Description, Qté, Prix unit., Total), sections (À l'attention de, Notes), totaux (Total HT, TVA, Total TTC), mentions de paiement. Utile pour les factures bilingues ou par convention client.

### Personnalisation du layout de facture
Templates PDF prédéfinis (ex. `template_id` dans `company_settings`) : organisation de l'entête (logo gauche/droite/centré), densité (compact vs aéré), éventuellement couleur d'accent. À préciser : nombre de templates, options exposées.

### Dashboard / accueil
Une page d'accueil avec un aperçu de la situation financière: factures en attente, CA du mois en cours, CA de l'année, montants ouverts. À implémenter en dernier — nécessite que clients, factures et statuts soient en place pour avoir de la donnée à remonter.


## Historique (fait)

- [2026-03-15] Import / Export CSV — export et import CSV pour clients et factures. Moteur générique (`useImportExport`) + composables spécifiques. Format dénormalisé pour les factures (une ligne par ligne de facture, groupées par `invoice_number` à l'import).
- [2026-03-14] Export PDF + immutabilité — génération PDF via `pdfmake` (logo base64, lignes, TVA, totaux, IBAN). Snapshots `client_snapshot` / `company_snapshot` (JSON) gelés au passage en "Envoyée". Formulaire verrouillé dès lors, statut seul reste modifiable (retour à Brouillon impossible).
- [2026-03-14] Factures — CRUD complet (liste, création, édition) avec lignes de facture, TVA surchargeable, numérotation auto `YYYY-NNN` (pratique, non légalement requis en CH), statuts (brouillon/envoyée/payée), date d'échéance calculée depuis `payment_terms`. Collections PocketBase `invoices` + `invoice_lines`.
- [2026-03-13] Gestion des clients — CRUD complet avec liste DataTable, pages `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id`. Collection PocketBase `clients` + ajout `payment_terms` aux settings entreprise.
- [2026-03-12] Settings de l'entreprise — page `/admin/settings` avec form complet (nom, adresse, téléphone, email, IBAN, logo, TVA, taux horaire). Collection PocketBase `company_settings` singleton + migrations.
