# RoadMap du projet billing djinn

Ce document maintient la liste des changements planifiés pour le projet et sert de référence partagée pour la priorisation, le périmètre et l’avancement.

Format recommandé pour le suivi: `- [AAAA-MM-JJ] Titre — note courte`.

## Améliorations, refactorings

Liste des petites améliorations et refactorings potentiels.


## Nouvelles fonctionnalités

### Gestion des clients
Pas de factures sans client. Il faut commencer par gérer les clients. On a besoin d'une UI classique CRUD pour les
clients de notre petite entreprise. Liste avec nom, date acquisition et des colonnes d'aggrégation type "revenu annuel", "revenu cumulé", "date dernière facture" + bien sûr des icônes d'actions (facturer, modifier, supprimer)

On va éviter les modales dans ce projet et privlégier des pages complètes, aussi pour l'ajout et l'édition des entités. Bien entendu, la suppression va se contenter d'une petite modale de confirmation générique.

### Settings de l'entreprise
Un point à mettre en place très rapidement est la page de configuration de l'entreprise qui emet les factures. Il faut qu'on puisse y définir toutes les infos utiles dont on a besoin pour créer une facture, notamment: nom de l'entreprise, adresse, compte bancaire, logo, taxes à appliquer, taux horaire standard (sera probablement adaptable par client, voire plus finement), etc.

### Liste des factures
Dans un logiciel de facturation, ça peut servir de pouvoir lister les factures. Par défaut, on liste de manière anti-chronologique.

## Historique (fait)

- [2026-03-12] Settings de l'entreprise — page `/admin/settings` avec form complet (nom, adresse, téléphone, email, IBAN, logo, TVA, taux horaire). Collection PocketBase `company_settings` singleton + migrations.