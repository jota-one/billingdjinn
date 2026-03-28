import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Settings from '../views/Settings.vue'
import Users from '../views/Users.vue'
import Clients from '../views/Clients.vue'
import ClientNew from '../views/ClientNew.vue'
import ClientEdit from '../views/ClientEdit.vue'
import Invoices from '../views/Invoices.vue'
import InvoiceNew from '../views/InvoiceNew.vue'
import InvoiceEdit from '../views/InvoiceEdit.vue'
import Ledger from '../views/Ledger.vue'
import LedgerEntryNew from '../views/LedgerEntryNew.vue'
import LedgerEntryEdit from '../views/LedgerEntryEdit.vue'
import Transitoires from '../views/Transitoires.vue'
import useAuth from '../composables/useAuth'

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
  { path: '/ledger/:id', component: LedgerEntryEdit },
  { path: '/transitoires', component: Transitoires },
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
