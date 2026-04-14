/**
 * Persona: Pascal Favre Design
 * Auto-entrepreneur graphiste. Non assujetti TVA.
 * ~15 petites factures/mois sur 18 mois.
 */
import { MONTH_NAMES_FR } from '../helpers.js'

export const config = {
  monthsBack: 18,
  taxes: true,

  company: {
    company_name: 'Pascal Favre Design',
    address: 'Route de la Forêt 12, 1700 Fribourg',
    phone: '+41 79 123 45 67',
    email: 'p.favre@favredesign.ch',
    bank_account: 'CH56 0483 5012 3456 7800 9',
    tva_enabled: false,
    tva_rate: null,
    tva_number: '',
    payment_terms: 30,
    currency: 'CHF',
    ledger_categories: ['Revenu', 'Frais', 'AVS', 'Assurance', 'Impôt'].map(name => ({
      name,
      patterns: [],
    })),
  },

  clients: [
    {
      name: 'Agence Comète Sàrl',
      address: 'Rue de Lausanne 45, 1700 Fribourg',
      email: 'contact@agence-comete.ch',
      phone: '+41 26 123 11 22',
      payment_terms: 30,
    },
    {
      name: 'EcoFrib SA',
      address: 'Route de Villars 88, 1700 Fribourg',
      email: 'admin@ecofrib.ch',
      phone: '+41 26 456 78 90',
      payment_terms: 30,
    },
    {
      name: 'Boulangerie Dubois',
      address: 'Grand-Rue 14, 1630 Bulle',
      email: 'dubois.boulangerie@bluewin.ch',
      phone: '+41 26 912 34 56',
      payment_terms: 15,
    },
    {
      name: 'Cabinet Meier & Associés',
      address: 'Rue de la Cathédrale 3, 1700 Fribourg',
      email: 'secretariat@meier-assoc.ch',
      phone: '+41 26 321 00 11',
      payment_terms: 45,
    },
  ],

  invoicesPerMonth: { min: 12, max: 20 },
  linesPerInvoice: { min: 1, max: 3 },

  lineTemplates: [
    { description: 'Heures de design graphique', qMin: 2, qMax: 8, pMin: 95, pMax: 110 },
    { description: 'Création identité visuelle', qMin: 1, qMax: 1, pMin: 450, pMax: 900 },
    { description: 'Retouches et corrections', qMin: 1, qMax: 3, pMin: 80, pMax: 180 },
    { description: "Frais d'impression", qMin: 1, qMax: 1, pMin: 80, pMax: 250 },
    { description: 'Mise en page document', qMin: 1, qMax: 4, pMin: 120, pMax: 200 },
  ],
  lineWeights: [40, 15, 25, 10, 10],

  charges: [
    {
      description: (y, m) => `AVS/AI/APG ${MONTH_NAMES_FR[m]} ${y}`,
      category: 'AVS',
      amountMin: 580,
      amountMax: 650,
      dayOfMonth: 15,
      every: 'month',
    },
    {
      description: 'Assurance accidents professionnels',
      category: 'Assurance',
      amountMin: 320,
      amountMax: 380,
      dayOfMonth: 10,
      every: 'quarter',
    },
    {
      description: 'Frais matériel et logiciels',
      category: 'Frais',
      amountMin: 50,
      amountMax: 200,
      every: 'month',
      count: { min: 1, max: 3 },
    },
  ],
}
