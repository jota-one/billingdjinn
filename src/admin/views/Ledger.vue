<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span class="i-fa-solid-book text-xl"></span>
      Grand Livre
    </h2>
    <div class="card">
      <div class="flex items-center justify-between gap-2 mb-3">
        <LedgerFilters
          v-model:selected-years="filterYears"
          v-model:selected-categories="filterCategories"
          :available-years="availableYears"
          :available-categories="availableCategories"
        />
        <div class="flex gap-2 shrink-0">
          <Button
            label="Import / Export"
            icon="i-fa-solid-file-arrow-up"
            size="small"
            severity="secondary"
            @click="showImportExportModal = true"
          />
          <RouterLink to="/ledger/bulk">
            <Button label="Saisie en série" icon="i-fa-solid-calendar-plus" size="small" severity="secondary" />
          </RouterLink>
          <RouterLink to="/ledger/new">
            <Button label="Nouvelle écriture" icon="i-fa-solid-plus" size="small" />
          </RouterLink>
        </div>
      </div>

      <DataTable
        :value="entriesWithBalance"
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
        :row-class="rowClass"
        table-style="min-width: 48rem"
      >
        <Column field="date" header="Date" sortable style="width: 110px;">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="category" header="Catégorie" style="width: 140px;">
          <template #body="{ data }">{{ data.category || '—' }}</template>
        </Column>
        <Column field="description" header="Description">
          <template #body="{ data }">
            <span>{{ data.description }}</span>
            <span
              v-if="!data.is_checked && isPast(data.date)"
              class="badge badge-warning badge-sm ml-2"
            >À vérifier</span>
            <span
              v-else-if="isFuture(data.date)"
              class="badge badge-ghost badge-sm ml-2"
            >Prévu</span>
          </template>
        </Column>
        <Column field="amount" header="Montant" sortable style="width: 130px; text-align: right;">
          <template #body="{ data }">
            <span :class="data.amount >= 0 ? 'text-success' : 'text-error'" class="font-mono font-medium whitespace-nowrap">
              {{ fmtAmount(data.amount) }}
            </span>
          </template>
        </Column>
        <Column field="balance" header="Solde" style="width: 130px; text-align: right;">
          <template #body="{ data }">
            <span :class="data.balance >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'" class="font-mono whitespace-nowrap">
              {{ fmtAmount(data.balance) }}
            </span>
          </template>
        </Column>
        <Column header="Actions" style="width: 100px;">
          <template #body="{ data }">
            <div class="flex gap-1">
              <button
                v-if="!data.is_checked"
                class="btn btn-xs btn-ghost text-success"
                title="Marquer comme vérifiée"
                @click="checkEntry(data.id)"
              >
                <span class="i-fa-solid-check"></span>
              </button>
              <RouterLink :to="`/ledger/${data.id}`">
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
        <template #footer>
          <span>
            {{ entriesWithBalance.length }} écriture{{ entriesWithBalance.length !== 1 ? 's' : '' }}
            <span v-if="entriesWithBalance.length !== entries.length" class="text-base-content/40">
              (sur {{ entries.length }})
            </span>
          </span>
          <span class="ml-4 font-mono font-semibold whitespace-nowrap" :class="finalBalance >= 0 ? 'text-success' : 'text-error'">
            Solde final : {{ fmtAmount(finalBalance) }}
          </span>
        </template>
      </DataTable>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer l'écriture ?"
      :message="deleteMessage"
      @confirm="deleteConfirmed"
    />

    <ImportExportModal
      v-model="showImportExportModal"
      title="Import / Export du Grand Livre"
      entity-label="écriture"
      :columns="ledgerColumns"
      help-text="Dates au format DD.MM.YYYY. Le montant est signé (négatif = dépense). is_checked : 1 = vérifié, 0 = à vérifier."
      :is-exporting="isExporting"
      :is-importing="isImporting"
      :export-fn="exportToCSV"
      :import-fn="importFromCSV"
      @saved="loadEntries"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ConfirmModal from '../components/ConfirmModal.vue'
import ImportExportModal from '../components/ImportExportModal.vue'
import LedgerFilters from '../components/LedgerFilters.vue'
import useLedger from '../composables/useLedger'
import useLedgerImportExport from '../composables/useLedgerImportExport'
import { getExportableFields } from '../config/ledgerImportExport'
import type { TLedgerEntry } from '../composables/useLedger'

const { entries, loadEntries, deleteEntry, markChecked } = useLedger()
const { isExporting, isImporting, exportToCSV, importFromCSV } = useLedgerImportExport()

const showDeleteModal = ref(false)
const showImportExportModal = ref(false)
const entryToDelete = ref<TLedgerEntry | null>(null)
const deleteMessage = ref('')
const ledgerColumns = getExportableFields().map(f => f.key)
const sortField = useStorage('ledger-sort-field', 'date')
const sortOrder = useStorage('ledger-sort-order', 1)
const filterYears = useStorage<number[]>('ledger-filter-years', [])
const filterCategories = useStorage<string[]>('ledger-filter-categories', [])

const availableYears = computed(() => {
  const years = new Set<number>()
  entries.value.forEach(e => years.add(e.fiscal_year || parseInt(e.date.substring(0, 4))))
  return [...years].sort((a, b) => b - a)
})

const availableCategories = computed(() => {
  const cats = new Set<string>()
  entries.value.forEach(e => { if (e.category) cats.add(e.category) })
  return [...cats].sort()
})

const entriesWithBalance = computed(() => {
  const chronological = [...entries.value].sort((a, b) => {
    const d = a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    if (d !== 0) return d
    return (a.created ?? '') < (b.created ?? '') ? -1 : 1
  })
  let balance = 0
  let filtered = chronological.map(e => {
    balance += e.amount
    return { ...e, balance }
  })
  if (filterYears.value.length > 0)
    filtered = filtered.filter(e => filterYears.value.includes(e.fiscal_year || parseInt(e.date.substring(0, 4))))
  if (filterCategories.value.length > 0)
    filtered = filtered.filter(e => filterCategories.value.includes(e.category))
  const dir = sortOrder.value ?? 1
  return filtered.sort((a, b) => {
    const av = (a as any)[sortField.value] ?? ''
    const bv = (b as any)[sortField.value] ?? ''
    const primary = av < bv ? -1 : av > bv ? 1 : 0
    if (primary !== 0) return primary * dir
    const sec = (a.created ?? '') < (b.created ?? '') ? -1 : (a.created ?? '') > (b.created ?? '') ? 1 : 0
    return sec * dir
  })
})

const finalBalance = computed(() => {
  return entries.value.reduce((sum, e) => sum + e.amount, 0)
})

const fmtAmount = (n: number): string => {
  const sign = n >= 0 ? '+' : '−'
  const abs = Math.abs(n)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const formattedInt = Number(intPart) >= 10000
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'")
    : intPart
  return `${sign} ${formattedInt}.${decPart}`
}

const formatDate = (date?: string) => {
  if (!date) return '—'
  return dayjs(date).format('DD.MM.YYYY')
}

const isPast = (date?: string) => !!date && dayjs(date).isBefore(dayjs(), 'day')
const isFuture = (date?: string) => !!date && dayjs(date).isAfter(dayjs(), 'day')

const rowClass = (data: TLedgerEntry) => {
  if (data.fiscal_year && data.fiscal_year !== parseInt(data.date.substring(0, 4))) {
    return 'row-transitoire'
  }
  return ''
}

const checkEntry = async (id: string) => {
  await markChecked(id)
  await loadEntries()
}

const confirmDelete = (entry: TLedgerEntry) => {
  entryToDelete.value = entry
  deleteMessage.value = `Voulez-vous vraiment supprimer l'écriture « ${entry.description} » ? Cette action est irréversible.`
  showDeleteModal.value = true
}

const deleteConfirmed = async () => {
  if (!entryToDelete.value) return
  await deleteEntry(entryToDelete.value.id)
  await loadEntries()
  showDeleteModal.value = false
  entryToDelete.value = null
}

onMounted(() => loadEntries())
</script>

<style scoped>
:deep(tr.row-transitoire > td) {
  background-color: color-mix(in oklch, var(--color-warning) 12%, transparent);
}
</style>
