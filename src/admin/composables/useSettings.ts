import { ref } from 'vue'
import config from '../../config'
import PocketBase from 'pocketbase'

export interface TSettings {
  id: string
  company_name: string
  address?: string
  phone?: string
  email?: string
  bank_account?: string
  logo?: string
  tva_enabled?: boolean
  tva_number?: string
  tva_rate?: number
  hourly_rate?: number
  payment_terms?: number
  currency?: string
  created: string
  updated: string
}

export interface TSettingsForm {
  company_name: string
  address?: string
  phone?: string
  email?: string
  bank_account?: string
  logo?: File | null
  tva_enabled?: boolean
  tva_number?: string
  tva_rate?: number | null
  hourly_rate?: number | null
  payment_terms?: number | null
  currency?: string
}

export default function useSettings() {
  const pb = new PocketBase(config.apiBaseUrl)

  const settings = ref<TSettings | null>(null)

  const loadSettings = async () => {
    try {
      settings.value = await pb.collection('company_settings').getFirstListItem<TSettings>('')
    } catch {
      settings.value = null
    }
  }

  const updateSettings = async (payload: TSettingsForm) => {
    if (!settings.value) return

    const formData = new FormData()
    formData.append('company_name', payload.company_name.trim())

    if (payload.address !== undefined) {
      formData.append('address', payload.address)
    }
    if (payload.phone !== undefined) {
      formData.append('phone', payload.phone)
    }
    if (payload.email !== undefined) {
      formData.append('email', payload.email)
    }
    if (payload.bank_account !== undefined) {
      formData.append('bank_account', payload.bank_account)
    }
    if (payload.logo instanceof File) {
      formData.append('logo', payload.logo)
    }
    formData.append('tva_enabled', String(Boolean(payload.tva_enabled)))
    if (payload.tva_number !== undefined) {
      formData.append('tva_number', payload.tva_number)
    }
    if (payload.tva_rate !== null && payload.tva_rate !== undefined) {
      formData.append('tva_rate', String(payload.tva_rate))
    }
    if (payload.hourly_rate !== null && payload.hourly_rate !== undefined) {
      formData.append('hourly_rate', String(payload.hourly_rate))
    }
    if (payload.payment_terms !== null && payload.payment_terms !== undefined) {
      formData.append('payment_terms', String(payload.payment_terms))
    }
    if (payload.currency) {
      formData.append('currency', payload.currency)
    }

    settings.value = await pb
      .collection('company_settings')
      .update<TSettings>(settings.value.id, formData)
  }

  const getLogoUrl = (s: TSettings): string => {
    if (!s.logo) return ''
    return `${config.apiBaseUrl}/api/files/company_settings/${s.id}/${s.logo}`
  }

  return {
    settings,
    loadSettings,
    updateSettings,
    getLogoUrl,
  }
}
