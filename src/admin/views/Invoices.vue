<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span class="i-fa-solid-file-invoice-dollar text-xl"></span>
      Factures
    </h2>
    <div class="card">
      <div class="flex justify-end gap-2 mb-2">
        <Button
          label="Import / Export"
          icon="i-fa-solid-file-arrow-up"
          size="small"
          severity="secondary"
          @click="showImportExportModal = true"
        />
        <RouterLink to="/invoices/new">
          <Button label="Nouvelle facture" icon="i-fa-solid-plus" size="small" />
        </RouterLink>
      </div>
      <DataTable :value="invoices" sort-field="date" :sort-order="-1" table-style="min-width: 50rem">
        <Column field="invoice_number" header="N° Facture" sortable>
          <template #body="{ data }">
            <RouterLink :to="`/invoices/${data.id}`" class="link link-hover font-mono font-medium">
              {{ data.invoice_number }}
            </RouterLink>
          </template>
        </Column>
        <Column field="client" header="Client">
          <template #body="{ data }">{{ data.expand?.client?.name || '—' }}</template>
        </Column>
        <Column field="date" header="Date" sortable>
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="due_date" header="Échéance">
          <template #body="{ data }">
            <span :class="isOverdue(data) ? 'text-error font-semibold' : ''">
              {{ formatDate(data.due_date) }}
            </span>
          </template>
        </Column>
        <Column header="Total HT" style="width: 110px;" class="text-right">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ formatAmount(data.total_ht) }}</span>
          </template>
        </Column>
        <Column header="Total TTC" style="width: 110px;" class="text-right">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ formatAmount(data.total_ttc) }}</span>
          </template>
        </Column>
        <Column field="status" header="Statut" style="width: 110px;">
          <template #body="{ data }">
            <span class="badge badge-sm" :class="STATUS_BADGE[data.status as TInvoiceStatus]">
              {{ STATUS_LABELS[data.status as TInvoiceStatus] }}
            </span>
          </template>
        </Column>
        <Column header="Actions" style="width: 90px;">
          <template #body="{ data }">
            <div class="flex gap-2">
              <RouterLink :to="`/invoices/${data.id}`">
                <button class="btn btn-xs btn-ghost" title="Modifier">
                  <span class="i-fa-solid-pen"></span>
                </button>
              </RouterLink>
              <button class="btn btn-xs btn-ghost" title="Supprimer" @click="confirmDelete(data)">
                <span class="i-fa-solid-trash"></span>
              </button>
            </div>
          </template>
        </Column>
        <template #footer>{{ invoices.length }} facture{{ invoices.length !== 1 ? 's' : '' }}</template>
      </DataTable>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer la facture ?"
      :message="deleteMessage"
      @confirm="deleteConfirmed"
    />

    <ImportExportModal
      v-model="showImportExportModal"
      title="Import / Export des factures"
      entity-label="facture"
      :columns="invoiceColumns"
      help-text="Une ligne CSV = une ligne de facture. Groupez par invoice_number pour les factures multi-lignes. Dates au format DD.MM.YYYY. status: draft/sent/paid. tva_enabled: oui/non. client_email doit correspondre à un client existant. client_name est présent dans l'export pour la lisibilité uniquement — il est ignoré à l'import."
      :is-exporting="isExporting"
      :is-importing="isImporting"
      :export-fn="exportToCSV"
      :import-fn="importFromCSV"
      @saved="loadInvoiceTotals"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ConfirmModal from '../components/ConfirmModal.vue'
import ImportExportModal from '../components/ImportExportModal.vue'
import useInvoices, { STATUS_BADGE, STATUS_LABELS, type TInvoiceStatus } from '../composables/useInvoices'
import useInvoiceTotals, { type TInvoiceTotal } from '../composables/useInvoiceTotals'
import useInvoicesImportExport, { INVOICE_IMPORT_COLUMNS } from '../composables/useInvoicesImportExport'

const { deleteInvoice } = useInvoices()
const { invoices, loadInvoiceTotals } = useInvoiceTotals()
const { isExporting, isImporting, exportToCSV, importFromCSV } = useInvoicesImportExport()

const showDeleteModal = ref(false)
const showImportExportModal = ref(false)
const invoiceToDelete = ref<TInvoiceTotal | null>(null)
const deleteMessage = ref('')
const invoiceColumns = [...INVOICE_IMPORT_COLUMNS]

const formatDate = (date?: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—')
const formatAmount = (n: number) =>
  new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const isOverdue = (invoice: TInvoiceTotal) => {
  if (!invoice.due_date || invoice.status === 'paid') return false
  return dayjs(invoice.due_date).isBefore(dayjs(), 'day')
}

const confirmDelete = (invoice: TInvoiceTotal) => {
  invoiceToDelete.value = invoice
  deleteMessage.value = `Voulez-vous vraiment supprimer la facture ${invoice.invoice_number} ? Cette action est irréversible.`
  showDeleteModal.value = true
}

const deleteConfirmed = async () => {
  if (!invoiceToDelete.value) return
  await deleteInvoice(invoiceToDelete.value.id)
  await loadInvoiceTotals()
  showDeleteModal.value = false
  invoiceToDelete.value = null
}

onMounted(loadInvoiceTotals)
</script>
