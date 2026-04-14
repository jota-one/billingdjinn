/**
 * Persona: Nexo Conseil Sàrl
 * Petite agence de conseil (3 personnes). Assujettie TVA.
 * 3 clients en retainer + projets ad-hoc. ~8 factures/mois sur 18 mois.
 * Ratio charges/revenus cible : ~80% (bénéfice ~20%).
 */
import { MONTH_NAMES_FR } from '../helpers.js'

export const config = {
  monthsBack: 18,
  taxes: true,

  company: {
    company_name: 'Nexo Conseil Sàrl',
    address: 'Rue de la Préfecture 8, 1700 Fribourg',
    phone: '+41 26 422 88 00',
    email: 'info@nexo-conseil.ch',
    bank_account: 'CH93 0076 2011 6238 5295 7',
    tva_enabled: true,
    tva_rate: 8.1,
    tva_number: 'CHE-412.345.678 TVA',
    payment_terms: 30,
    currency: 'CHF',
  },

  categories: [
    'Revenu', 'Frais', 'Salaire', 'AVS', 'LPP', 'LAA',
    'Assurance', 'TVA', 'Fiduciaire', 'Mastercard', 'Impôt',
  ],

  profitCenters: [
    { name: 'Conseil',   color: '#3b82f6' },
    { name: 'Formation', color: '#22c55e' },
  ],
  // Pas d'allocationKeys → tout passe par le ratio CA (Tier 3)

  clients: [
    // Retainer clients (fixed monthly amount)
    {
      name: 'Hôpital fribourgeois HFR',
      address: 'Route des Pensionnats 2-6, 1708 Fribourg',
      email: 'achats@h-fr.ch',
      phone: '+41 26 426 70 00',
      payment_terms: 30,
      retainer: { description: 'Mandat de conseil stratégique mensuel', amount: 2500 },
    },
    {
      name: 'Banque Cantonale de Fribourg',
      address: 'Boulevard de Pérolles 1, 1700 Fribourg',
      email: 'fournisseurs@bcf.ch',
      phone: '+41 26 350 71 11',
      payment_terms: 45,
      retainer: { description: 'Mandat de conseil mensuel', amount: 3200 },
    },
    {
      name: 'Migros Fribourg',
      address: 'Route de Moncor 18, 1752 Villars-sur-Glâne',
      email: 'admin.fr@migros.ch',
      phone: '+41 26 460 85 00',
      payment_terms: 30,
      retainer: { description: 'Accompagnement transformation digitale', amount: 1800 },
    },
    // Ad-hoc clients
    {
      name: 'EcoFrib SA',
      address: 'Route de Villars 88, 1700 Fribourg',
      email: 'direction@ecofrib.ch',
      phone: '+41 26 456 78 90',
      payment_terms: 30,
    },
    {
      name: 'Sarine Développement',
      address: 'Rue de Romont 12, 1700 Fribourg',
      email: 'contact@sarine-dev.ch',
      phone: '+41 26 321 55 44',
      payment_terms: 30,
    },
    {
      name: 'Alpine Software AG',
      address: 'Bahnhofstrasse 42, 3000 Bern',
      email: 'projects@alpine-software.ch',
      phone: '+41 31 567 89 01',
      payment_terms: 30,
      currency: 'EUR', // invoiced in EUR
    },
    {
      name: 'Müller Holding GmbH',
      address: 'Industriestrasse 7, 3175 Flamatt',
      email: 'rechnungen@mueller-holding.ch',
      phone: '+41 31 741 23 45',
      payment_terms: 45,
    },
  ],

  invoicesPerMonth: { min: 5, max: 9 },
  linesPerInvoice: { min: 2, max: 6 },

  lineTemplates: [
    { description: 'Analyse stratégique', qMin: 1, qMax: 1, pMin: 2200, pMax: 5500 },
    { description: 'Atelier de co-construction', qMin: 1, qMax: 2, pMin: 1800, pMax: 3200 },
    { description: 'Journée de formation', qMin: 1, qMax: 2, pMin: 1600, pMax: 2200 },
    { description: 'Heures de conseil', qMin: 4, qMax: 16, pMin: 180, pMax: 220 },
    { description: 'Rapport et livrables', qMin: 1, qMax: 1, pMin: 800, pMax: 2500 },
    { description: 'Frais de déplacement', qMin: 1, qMax: 1, pMin: 120, pMax: 450 },
  ],
  lineWeights: [25, 20, 15, 20, 15, 5],

  charges: [
    // 3 salaires — niveaux bruts réalistes pour une agence de conseil fribourgeoise
    // Cible ratio charges/revenus ~80% (revenus TTC ~630 k CHF/an)
    {
      description: (y, m) => `Salaire — directeur associé ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'Salaire',
      amountMin: 12500,
      amountMax: 13200,
      dayOfMonth: 25,
      every: 'month',
    },
    {
      description: (y, m) => `Salaire — consultant senior ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'Salaire',
      amountMin: 10300,
      amountMax: 10800,
      dayOfMonth: 25,
      every: 'month',
    },
    {
      description: (y, m) => `Salaire — consultant junior ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'Salaire',
      amountMin: 8500,
      amountMax: 9000,
      dayOfMonth: 25,
      every: 'month',
    },
    {
      description: (y, m) => `Charges AVS/AI/APG patronales ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'AVS',
      amountMin: 1650,
      amountMax: 1760,
      dayOfMonth: 28,
      every: 'month',
    },
    {
      description: (y, m) => `LPP part patronale ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'LPP',
      amountMin: 2500,
      amountMax: 2650,
      dayOfMonth: 28,
      every: 'month',
    },
    {
      description: (y, m) => `LAA part patronale ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'LAA',
      amountMin: 310,
      amountMax: 335,
      dayOfMonth: 28,
      every: 'month',
    },
    {
      description: 'Décompte TVA trimestriel',
      category: 'TVA',
      amountMin: 11000,
      amountMax: 14000,
      dayOfMonth: 20,
      every: 'quarter',
    },
    {
      description: 'Honoraires fiduciaire',
      category: 'Fiduciaire',
      amountMin: 2200,
      amountMax: 2600,
      dayOfMonth: 15,
      every: 'half-year',
    },
    {
      description: 'Frais Mastercard entreprise',
      category: 'Mastercard',
      amountMin: 200,
      amountMax: 600,
      dayOfMonth: 5,
      every: 'month',
    },
    {
      description: 'Frais généraux et abonnements',
      category: 'Frais',
      amountMin: 100,
      amountMax: 350,
      every: 'month',
      count: { min: 1, max: 2 },
    },
    {
      description: 'Assurance responsabilité civile professionnelle',
      category: 'Assurance',
      amountMin: 800,
      amountMax: 950,
      dayOfMonth: 10,
      every: 'half-year',
    },
  ],
}
