<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/invoices" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-file-invoice-dollar text-xl"></span>
        Nouvelle facture
      </h2>
    </div>

    <InvoiceForm v-model:form="form" v-model:lines="lines" :clients="clients" :default-rate="defaultRate" :currency="defaultCurrency" />

    <div class="flex justify-end mt-6">
      <Button
        type="button"
        label="Créer la facture"
        icon="i-fa-solid-save"
        :loading="saving"
        @click="save"
      />
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import PbErrorToast from '../components/PbErrorToast.vue'
import InvoiceForm from '../components/InvoiceForm.vue'
import usePbErrorToast from '../composables/usePbErrorToast'
import useInvoices, { type TInvoiceForm, type TInvoiceLineForm } from '../composables/useInvoices'
import useClients from '../composables/useClients'
import useSettings from '../composables/useSettings'

const { generateInvoiceNumber, createInvoice } = useInvoices()
const { clients, loadClients } = useClients()
const { settings, loadSettings } = useSettings()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const router = useRouter()

const saving = ref(false)

const today = new Date().toISOString().substring(0, 10)

const form = ref<TInvoiceForm>({
  client: '',
  invoice_number: '',
  date: today,
  due_date: '',
  status: 'draft',
  tva_enabled: false,
  tva_rate: null,
  notes: '',
  converted_amount: null,
})

const lines = ref<TInvoiceLineForm[]>([
  { description: '', quantity: 1, unit_price: 0 },
])

const selectedClient = computed(() => clients.value.find(c => c.id === form.value.client))
const defaultRate = computed(() => selectedClient.value?.hourly_rate ?? settings.value?.hourly_rate ?? 0)
const defaultCurrency = computed(() => selectedClient.value?.currency || settings.value?.currency || 'CHF')

const computeDueDate = (baseDate: string, terms: number | undefined): string => {
  if (!baseDate || !terms) return ''
  const due = new Date(baseDate)
  due.setDate(due.getDate() + terms)
  return due.toISOString().substring(0, 10)
}

// Quand le client change : appliquer son tarif horaire sur les lignes vides + recalculer l'échéance
watch(() => form.value.client, () => {
  const client = selectedClient.value
  const rate = client?.hourly_rate ?? settings.value?.hourly_rate ?? 0
  lines.value.forEach(line => {
    if (!line.unit_price) line.unit_price = rate
  })
  const terms = client?.payment_terms ?? settings.value?.payment_terms
  form.value.due_date = computeDueDate(form.value.date, terms)
})

// Quand la date change : recalculer l'échéance
watch(() => form.value.date, (newDate) => {
  const terms = selectedClient.value?.payment_terms ?? settings.value?.payment_terms
  form.value.due_date = computeDueDate(newDate, terms)
})

const save = async () => {
  if (!form.value.client) {
    toast.add({ severity: 'warn', summary: 'Client requis', detail: 'Veuillez sélectionner un client.', life: 3000 })
    return
  }
  saving.value = true
  try {
    await createInvoice(form.value, lines.value.filter(l => l.description.trim()))
    toast.add({ severity: 'success', summary: 'Créée', detail: `Facture ${form.value.invoice_number} créée.`, life: 3000 })
    router.push('/invoices')
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadClients(), loadSettings()])
  form.value.invoice_number = await generateInvoiceNumber()
  if (settings.value) {
    form.value.tva_enabled = settings.value.tva_enabled ?? false
    form.value.tva_rate = settings.value.tva_rate ?? null
    // auto due_date from payment_terms
    if (settings.value.payment_terms) {
      const due = new Date()
      due.setDate(due.getDate() + settings.value.payment_terms)
      form.value.due_date = due.toISOString().substring(0, 10)
    }
  }
})
</script>
