<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/invoices" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-file-invoice-dollar text-xl"></span>
        {{ form.invoice_number || 'Facture' }}
      </h2>
      <span v-if="invoiceStatus" class="badge badge-sm" :class="STATUS_BADGE[invoiceStatus]">
        {{ STATUS_LABELS[invoiceStatus] }}
      </span>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <template v-else>
      <!-- Bannière verrouillée -->
      <div v-if="isLocked" class="alert alert-warning mb-6">
        <span class="i-fa-solid-lock text-lg"></span>
        <span>
          Cette facture est <strong>verrouillée</strong> — statut <em>{{ STATUS_LABELS[invoiceStatus!] }}</em>.
          Le contenu ne peut plus être modifié. Seul le statut reste modifiable.
        </span>
      </div>

      <InvoiceForm
        v-model:form="form"
        v-model:lines="lines"
        :clients="clients"
        :readonly="isLocked"
        :currency="effectiveCurrency"
      />

      <!-- Conversion de devise -->
      <div v-if="showConversionField" class="card bg-base-200 p-6 max-w-2xl mt-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Montant HT en {{ settings?.currency || 'CHF' }}</span>
            <span class="label-text-alt text-base-content/40">Facture en {{ effectiveCurrency }}</span>
          </label>
          <InputNumber
            v-model="form.converted_amount"
            :min="0"
            mode="currency"
            :currency="settings?.currency || 'CHF'"
            :max-fraction-digits="2"
            locale="fr-CH"
            placeholder="—"
            class="w-full"
          />
          <p class="text-xs text-base-content/50 mt-1">Équivalent HT dans la devise principale. À renseigner après encaissement.</p>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          label="Télécharger PDF"
          icon="i-fa-solid-file-pdf"
          severity="secondary"
          :loading="pdfLoading"
          @click="downloadPdf"
        />
        <Button
          type="button"
          :label="isLocked ? 'Mettre à jour le statut' : 'Enregistrer'"
          icon="i-fa-solid-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import PbErrorToast from '../components/PbErrorToast.vue'
import InvoiceForm from '../components/InvoiceForm.vue'
import usePbErrorToast from '../composables/usePbErrorToast'
import useInvoices, {
  STATUS_BADGE,
  STATUS_LABELS,
  type TInvoice,
  type TInvoiceForm,
  type TInvoiceLine,
  type TInvoiceLineForm,
  type TInvoiceStatus,
} from '../composables/useInvoices'
import useClients from '../composables/useClients'
import useSettings from '../composables/useSettings'
import { downloadInvoicePdf } from '../composables/useInvoicePdf'

const { loadInvoice, loadInvoiceLines, updateInvoice } = useInvoices()
const { clients, loadClients } = useClients()
const { settings, loadSettings } = useSettings()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const route = useRoute()

const invoiceId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const pdfLoading = ref(false)
const invoiceRef = ref<TInvoice | null>(null)
const invoiceStatus = ref<TInvoiceStatus | null>(null)
const hasSnapshot = ref(false)

const isLocked = computed(() => invoiceStatus.value !== null && invoiceStatus.value !== 'draft')

const effectiveCurrency = computed(() => {
  if (invoiceRef.value?.company_snapshot?.currency) return invoiceRef.value.company_snapshot.currency
  const client = clients.value.find(c => c.id === form.value.client)
  return client?.currency || settings.value?.currency || 'CHF'
})

const showConversionField = computed(() =>
  effectiveCurrency.value !== (settings.value?.currency || 'CHF'),
)

const form = ref<TInvoiceForm>({
  client: '',
  invoice_number: '',
  date: '',
  due_date: '',
  status: 'draft',
  tva_enabled: false,
  tva_rate: null,
  notes: '',
  converted_amount: null,
})

const lines = ref<TInvoiceLineForm[]>([])

const save = async () => {
  saving.value = true
  try {
    const wasJustLocked = invoiceStatus.value === 'draft' && form.value.status !== 'draft'
    await updateInvoice(
      invoiceId,
      form.value,
      lines.value.filter(l => l.description.trim()),
      invoiceStatus.value!,
      hasSnapshot.value,
    )
    invoiceStatus.value = form.value.status
    hasSnapshot.value = hasSnapshot.value || form.value.status !== 'draft'
    // Reload to get snapshot data populated by the server
    if (wasJustLocked) invoiceRef.value = await loadInvoice(invoiceId)
    toast.add({ severity: 'success', summary: 'Enregistré', detail: 'La facture a été mise à jour.', life: 3000 })
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

const downloadPdf = async () => {
  if (!invoiceRef.value) return
  pdfLoading.value = true
  try {
    const invoiceForPdf = {
      ...invoiceRef.value,
      ...form.value,
      tva_rate: form.value.tva_rate ?? undefined,
    }
    const linesForPdf = lines.value.map(l => ({ ...l, invoice: invoiceId })) as TInvoiceLine[]
    await downloadInvoicePdf(invoiceForPdf, linesForPdf, 'graphic')
  } catch (e) {
    showPbError(e)
  } finally {
    pdfLoading.value = false
  }
}

onMounted(async () => {
  try {
    const [invoice, existingLines] = await Promise.all([
      loadInvoice(invoiceId),
      loadInvoiceLines(invoiceId),
      loadClients(),
      loadSettings(),
    ])
    invoiceStatus.value = invoice.status
    hasSnapshot.value = !!invoice.client_snapshot
    invoiceRef.value = invoice
    form.value = {
      client: invoice.client,
      invoice_number: invoice.invoice_number,
      date: invoice.date ? invoice.date.substring(0, 10) : '',
      due_date: invoice.due_date ? invoice.due_date.substring(0, 10) : '',
      status: invoice.status,
      tva_enabled: invoice.tva_enabled ?? false,
      tva_rate: invoice.tva_rate ?? null,
      notes: invoice.notes || '',
      converted_amount: invoice.converted_amount || null,
    }
    lines.value = existingLines.map(l => ({
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
    }))
  } finally {
    loading.value = false
  }
})
</script>
