<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span class="i-fa-solid-file-invoice-dollar text-xl"></span>
      Factures
    </h2>
    <div class="card">
      <div class="flex justify-end mb-2">
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
          <template #body>—</template>
        </Column>
        <Column header="Total TTC" style="width: 110px;" class="text-right">
          <template #body>—</template>
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
import useInvoices, { STATUS_BADGE, STATUS_LABELS, type TInvoice, type TInvoiceStatus } from '../composables/useInvoices'

const { invoices, loadInvoices, deleteInvoice } = useInvoices()

const showDeleteModal = ref(false)
const invoiceToDelete = ref<TInvoice | null>(null)
const deleteMessage = ref('')

const formatDate = (date?: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—')

const isOverdue = (invoice: TInvoice) => {
  if (!invoice.due_date || invoice.status === 'paid') return false
  return dayjs(invoice.due_date).isBefore(dayjs(), 'day')
}

const confirmDelete = (invoice: TInvoice) => {
  invoiceToDelete.value = invoice
  deleteMessage.value = `Voulez-vous vraiment supprimer la facture ${invoice.invoice_number} ? Cette action est irréversible.`
  showDeleteModal.value = true
}

const deleteConfirmed = async () => {
  if (!invoiceToDelete.value) return
  await deleteInvoice(invoiceToDelete.value.id)
  await loadInvoices()
  showDeleteModal.value = false
  invoiceToDelete.value = null
}

onMounted(loadInvoices)
</script>
