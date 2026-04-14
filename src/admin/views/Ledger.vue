<template>
  <div class="h-full flex flex-col p-8 gap-4">
    <h2 class="text-2xl font-bold shrink-0 flex items-center gap-2">
      <span class="i-fa-solid-book text-xl"></span>
      Grand Livre
    </h2>
    <div class="card flex-1 flex flex-col min-h-0" ref="tableWrapper">
      <div class="shrink-0 flex items-center justify-between gap-2 pb-3">
        <LedgerFilters
          v-model:selected-years="filterYears"
          v-model:selected-categories="filterCategories"
          :available-years="availableYears"
          :available-categories="availableCategories"
        />
        <div class="flex gap-2 shrink-0">
          <Button
            label="Import / Export"
            icon="i-fa6-solid-file-arrow-up"
            size="small"
            severity="secondary"
            @click="showImportExportModal = true"
          />
          <RouterLink to="/ledger/reconcile">
            <Button
              label="Réconciliation"
              icon="i-fa6-solid-scale-balanced"
              size="small"
              severity="secondary"
            />
          </RouterLink>
          <RouterLink to="/ledger/bulk">
            <Button
              label="Saisie en série"
              icon="i-fa-solid-calendar-plus"
              size="small"
              severity="secondary"
            />
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
        scrollable
        scrollHeight="flex"
        table-style="min-width: 48rem"
      >
        <Column style="width: 1.5rem; padding: 0">
          <template #body="{ data }">
            <span v-if="data.isPastBoundary" class="ledger-sep-above">{{
              sortOrder === 1 ? 'passé' : 'futur'
            }}</span>
            <span v-if="data.isFirstFuture" class="ledger-sep-below">{{
              sortOrder === 1 ? 'futur' : 'passé'
            }}</span>
          </template>
        </Column>
        <Column field="date" header="Date" sortable style="width: 110px">
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <Column field="category_id" header="Catégorie" style="width: 140px">
          <template #body="{ data }">{{ data.expand?.category_id?.name || '—' }}</template>
        </Column>
        <Column field="description" header="Description">
          <template #body="{ data }">
            <span>{{ data.description }}</span>
            <span
              v-if="!data.is_checked && isPast(data.date)"
              class="badge badge-warning badge-sm ml-2"
              >À vérifier</span
            >
            <span v-else-if="isFuture(data.date)" class="badge badge-ghost badge-sm ml-2"
              >Prévu</span
            >
          </template>
        </Column>
        <Column field="amount" header="Montant" style="width: 130px; text-align: right">
          <template #body="{ data }">
            <span
              :class="data.amount >= 0 ? 'text-success' : 'text-error'"
              class="font-mono font-medium whitespace-nowrap"
            >
              {{ fmtAmount(data.amount) }}
            </span>
          </template>
        </Column>
        <Column field="balance" header="Solde" style="width: 130px; text-align: right">
          <template #body="{ data }">
            <span
              :class="data.balance >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'"
              class="font-mono whitespace-nowrap"
            >
              {{ fmtAmount(data.balance) }}
            </span>
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
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
          <span
            class="ml-4 font-mono font-semibold whitespace-nowrap"
            :class="finalBalance >= 0 ? 'text-success' : 'text-error'"
          >
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
import { RouterLink, useRoute } from 'vue-router'
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

type LedgerEntryWithBoundary = TLedgerEntry & { isPastBoundary?: boolean; isFirstFuture?: boolean }

const { entries, loadEntries, deleteEntry, markChecked } = useLedger()
const { isExporting, isImporting, exportToCSV, importFromCSV } = useLedgerImportExport()
const route = useRoute()

const tableWrapper = ref<HTMLElement | null>(null)

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
  entries.value.forEach(e => {
    const name = e.expand?.category_id?.name
    if (name) {
      cats.add(name)
    }
  })
  return [...cats].sort()
})

const entriesWithBalance = computed<LedgerEntryWithBoundary[]>(() => {
  const chronological = [...entries.value].sort((a, b) => {
    const d = a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    if (d !== 0) {
      return d
    }
    return (a.created ?? '') < (b.created ?? '') ? -1 : 1
  })
  let balance = 0
  let filtered = chronological.map(e => {
    balance += e.amount
    return { ...e, balance } as LedgerEntryWithBoundary & { balance: number }
  })
  if (filterYears.value.length > 0) {
    filtered = filtered.filter(e =>
      filterYears.value.includes(e.fiscal_year || parseInt(e.date.substring(0, 4))),
    )
  }
  if (filterCategories.value.length > 0) {
    filtered = filtered.filter(e =>
      filterCategories.value.includes(e.expand?.category_id?.name ?? ''),
    )
  }
  const dir = sortOrder.value ?? 1
  filtered = filtered.sort((a, b) => {
    const av = (a as any)[sortField.value] ?? ''
    const bv = (b as any)[sortField.value] ?? ''
    const primary = av < bv ? -1 : av > bv ? 1 : 0
    if (primary !== 0) {
      return primary * dir
    }
    const sec =
      (a.created ?? '') < (b.created ?? '') ? -1 : (a.created ?? '') > (b.created ?? '') ? 1 : 0
    return sec * dir
  })
  // Ajout du flag de séparation passé/futur — uniquement quand on trie par date
  if (sortField.value === 'date') {
    let boundaryIdx = -1
    for (let i = 1; i < filtered.length; i++) {
      if (isPast(filtered[i - 1].date) !== isPast(filtered[i].date)) {
        boundaryIdx = i - 1
        break
      }
    }
    if (boundaryIdx !== -1) {
      filtered[boundaryIdx] = { ...filtered[boundaryIdx], isPastBoundary: true }
      const neighborIdx = boundaryIdx + 1
      if (neighborIdx >= 0 && neighborIdx < filtered.length) {
        filtered[neighborIdx] = { ...filtered[neighborIdx], isFirstFuture: true }
      }
    }
  }
  return filtered as LedgerEntryWithBoundary[]
})

const finalBalance = computed(() => {
  return entries.value.reduce((sum, e) => sum + e.amount, 0)
})

const fmtAmount = (n: number): string => {
  const sign = n >= 0 ? '+' : '−'
  const abs = Math.abs(n)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const formattedInt =
    Number(intPart) >= 10000 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : intPart
  return `${sign} ${formattedInt}.${decPart}`
}

const formatDate = (date?: string) => {
  if (!date) {
    return '—'
  }
  return dayjs(date).format('DD.MM.YYYY')
}

const isPast = (date?: string) => !!date && dayjs(date).isBefore(dayjs(), 'day')
const isFuture = (date?: string) => !!date && dayjs(date).isAfter(dayjs(), 'day')

const rowClass = (data: LedgerEntryWithBoundary) => {
  const transitoire =
    data.fiscal_year && data.fiscal_year !== parseInt(data.date.substring(0, 4))
      ? 'row-transitoire'
      : ''
  const separator = data.isPastBoundary ? 'ledger-row-separator' : ''
  return [transitoire, separator].filter(Boolean).join(' ')
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
  if (!entryToDelete.value) {
    return
  }
  await deleteEntry(entryToDelete.value.id)
  await loadEntries()
  showDeleteModal.value = false
  entryToDelete.value = null
}

const scrollToTarget = () => {
  const focusId = route.query.focus as string | undefined
  const list = entriesWithBalance.value
  if (!list.length) {
    return
  }

  let idx: number
  if (focusId) {
    idx = list.findIndex(e => e.id === focusId)
  } else {
    const todayMs = new Date().setHours(0, 0, 0, 0)
    let closest = 0
    let closestDiff = Infinity
    list.forEach((e, i) => {
      const diff = Math.abs(new Date(e.date.substring(0, 10)).getTime() - todayMs)
      if (diff < closestDiff) {
        closestDiff = diff
        closest = i
      }
    })
    idx = closest
  }

  if (idx === -1) {
    return
  }
  const rows = tableWrapper.value?.querySelectorAll('tbody tr')
  const row = rows?.[idx] as HTMLElement | undefined
  if (!row) {
    return
  }

  const scrollContainer = tableWrapper.value?.querySelector(
    '.p-datatable-table-container',
  ) as HTMLElement | null
  if (!scrollContainer) {
    return
  }

  const offset =
    row.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top -
    scrollContainer.clientHeight / 2 +
    row.clientHeight / 2
  scrollContainer.scrollTop += offset
}

onMounted(async () => {
  await loadEntries()
  setTimeout(scrollToTarget, 100)
})
</script>

<style scoped>
:deep(.p-datatable-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(tr.row-transitoire > td:not(:first-child)) {
  background-color: color-mix(in oklch, var(--color-warning) 12%, transparent);
}

/* Première colonne : transparente, sans bordure — slot pour le séparateur */
:deep(.p-datatable-header-cell:first-child),
:deep(.p-datatable-tbody > tr > td:first-child) {
  background: transparent !important;
  border: none !important;
  padding: 0;
  position: relative;
}

/* Ligne de séparation : trait épais en bas */
:deep(.ledger-row-separator > td) {
  border-bottom: 4px solid var(--color-primary, #2563eb);
}
/* Restaurer le border-bottom sur la 1ère cellule (écrasé par border: none) */
:deep(.p-datatable-tbody > tr.ledger-row-separator > td:first-child) {
  border-bottom: 4px solid var(--color-primary, #2563eb) !important;
}

:deep(.ledger-sep-above),
:deep(.ledger-sep-below) {
  position: absolute;
  left: 50%;
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-base-content, #64748b);
  letter-spacing: 0.1em;
  writing-mode: vertical-rl;
  user-select: none;
  opacity: 0.7;
  transform: translateX(-50%) rotate(180deg);
  pointer-events: none;
}

:deep(.ledger-sep-above) {
  bottom: 6px;
}
:deep(.ledger-sep-below) {
  top: 6px;
}
</style>
