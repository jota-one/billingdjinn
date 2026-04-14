import { ref } from 'vue'
import config from '@/config'
import PocketBase from 'pocketbase'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'

export interface TClient {
  id: string
  name: string
  address?: string
  email?: string
  phone?: string
  contact_person?: string
  hourly_rate?: number
  payment_terms?: number
  currency?: string
  notes?: string
  date_acquisition?: string
  labels?: TInvoiceLabels
  created: string
  updated: string
}

export interface TClientForm {
  name: string
  address?: string
  email?: string
  phone?: string
  contact_person?: string
  hourly_rate?: number | null
  payment_terms?: number | null
  currency?: string
  notes?: string
  date_acquisition?: string
  labels?: TInvoiceLabels
}

export interface TClientStats {
  id: string
  name: string
  ca_annuel: number
  ca_cumule: number
  last_invoice_date?: string
}

export default function useClients() {
  const pb = new PocketBase(config.apiBaseUrl)

  const clients = ref<TClient[]>([])
  const clientStats = ref<Map<string, TClientStats>>(new Map())

  const loadClients = async () => {
    clients.value = await pb.collection<TClient>('clients').getFullList({
      sort: 'name',
    })
  }

  const loadClientStats = async () => {
    const list = await pb.collection<TClientStats>('client_stats').getFullList()
    clientStats.value = new Map(list.map(s => [s.id, s]))
  }

  const loadClient = async (id: string): Promise<TClient> => {
    return pb.collection<TClient>('clients').getOne(id)
  }

  const createClient = async (payload: TClientForm): Promise<TClient> => {
    return pb.collection<TClient>('clients').create(buildFormData(payload))
  }

  const updateClient = async (id: string, payload: TClientForm): Promise<TClient> => {
    return pb.collection<TClient>('clients').update<TClient>(id, buildFormData(payload))
  }

  const deleteClient = async (id: string): Promise<void> => {
    await pb.collection('clients').delete(id)
  }

  return {
    clients,
    clientStats,
    loadClients,
    loadClientStats,
    loadClient,
    createClient,
    updateClient,
    deleteClient,
  }
}

function buildFormData(payload: TClientForm): FormData {
  const fd = new FormData()
  fd.append('name', payload.name.trim())
  if (payload.address !== undefined) {
    fd.append('address', payload.address)
  }
  if (payload.email !== undefined) {
    fd.append('email', payload.email)
  }
  if (payload.phone !== undefined) {
    fd.append('phone', payload.phone)
  }
  if (payload.contact_person !== undefined) {
    fd.append('contact_person', payload.contact_person)
  }
  if (payload.hourly_rate !== null && payload.hourly_rate !== undefined) {
    fd.append('hourly_rate', String(payload.hourly_rate))
  }
  if (payload.payment_terms !== null && payload.payment_terms !== undefined) {
    fd.append('payment_terms', String(payload.payment_terms))
  }
  if (payload.currency) {
    fd.append('currency', payload.currency)
  }
  if (payload.notes !== undefined) {
    fd.append('notes', payload.notes)
  }
  if (payload.date_acquisition) {
    fd.append('date_acquisition', payload.date_acquisition)
  }
  if (payload.labels !== undefined) {
    fd.append('labels', JSON.stringify(payload.labels))
  }
  return fd
}
