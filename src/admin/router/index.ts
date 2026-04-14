import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/admin/views/Home.vue'
import Settings from '@/admin/views/Settings.vue'
import Users from '@/admin/views/Users.vue'
import Clients from '@/admin/views/Clients.vue'
import ClientNew from '@/admin/views/ClientNew.vue'
import ClientEdit from '@/admin/views/ClientEdit.vue'
import Invoices from '@/admin/views/Invoices.vue'
import InvoiceNew from '@/admin/views/InvoiceNew.vue'
import InvoiceEdit from '@/admin/views/InvoiceEdit.vue'
import Ledger from '@/admin/views/Ledger.vue'
import LedgerEntryNew from '@/admin/views/LedgerEntryNew.vue'
import LedgerEntryEdit from '@/admin/views/LedgerEntryEdit.vue'
import LedgerBulkCreate from '@/admin/views/LedgerBulkCreate.vue'
import LedgerReconciliation from '@/admin/views/LedgerReconciliation.vue'
import Transitoires from '@/admin/views/Transitoires.vue'
import Stats from '@/admin/views/Stats.vue'
import Analytics from '@/admin/views/Analytics.vue'
import useAuth from '@/admin/composables/useAuth'

const routes = [
  { path: '', component: Home },
  { path: '/settings', component: Settings },
  { path: '/users', component: Users },
  { path: '/clients', component: Clients },
  { path: '/clients/new', component: ClientNew },
  { path: '/clients/:id', component: ClientEdit },
  { path: '/invoices', component: Invoices },
  { path: '/invoices/new', component: InvoiceNew },
  { path: '/invoices/:id', component: InvoiceEdit },
  { path: '/ledger', component: Ledger },
  { path: '/ledger/new', component: LedgerEntryNew },
  { path: '/ledger/bulk', component: LedgerBulkCreate },
  { path: '/ledger/reconcile', component: LedgerReconciliation },
  { path: '/ledger/:id', component: LedgerEntryEdit },
  { path: '/transitoires', component: Transitoires },
  { path: '/stats', component: Stats },
  { path: '/analytics', component: Analytics },
]

const baseUrl = (import.meta as any).env?.BASE_URL || '/'

const router = createRouter({
  history: createWebHistory(baseUrl + 'admin/'),
  routes,
})

router.beforeEach(async (_to, _from) => {
  const { isAuthenticated, isAdmin, refreshAuth } = useAuth()

  if (isAuthenticated.value) {
    await refreshAuth()
  }

  if (!isAuthenticated.value || !isAdmin.value) {
    window.location.href = '/'
    return false
  }
})

export default router
