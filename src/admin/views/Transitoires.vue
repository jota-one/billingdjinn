<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold flex items-center gap-2 mb-2">
      <span class="i-fa-solid-arrows-left-right text-xl"></span>
      Transitoires
    </h2>
    <p class="text-base-content/50 text-sm mb-6">
      Écritures dont l'année fiscale diffère de l'année de la date d'encaissement.
    </p>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <div v-else-if="groups.length === 0" class="alert">
      <span class="i-fa-solid-info-circle"></span>
      Aucun compte de régularisation enregistré. Les transitoires apparaissent ici lorsqu'une
      écriture porte un exercice fiscal différent de son année de date.
    </div>

    <div v-else class="flex flex-col gap-10">
      <div v-for="group in groups" :key="group.year">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span class="i-fa-solid-calendar-alt text-base-content/40"></span>
          Exercice {{ group.year }}
          <span class="badge badge-neutral badge-sm font-normal">
            {{ group.entrants.length + group.sortants.length }} écriture{{
              group.entrants.length + group.sortants.length !== 1 ? 's' : ''
            }}
          </span>
        </h3>

        <!-- Entrants -->
        <div v-if="group.entrants.length > 0" class="mb-6">
          <h4
            class="text-xs font-semibold text-base-content/50 uppercase tracking-widest mb-2 flex items-center gap-1.5"
          >
            <span class="i-fa-solid-arrow-right-to-bracket text-success text-sm"></span>
            Entrants — cash encaissé avant {{ group.year }}
          </h4>
          <div class="card bg-base-200">
            <table class="table table-sm">
              <thead>
                <tr class="text-base-content/50">
                  <th>Date (cash)</th>
                  <th>Description</th>
                  <th>Catégorie</th>
                  <th class="text-right">Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in group.entrants" :key="entry.id">
                  <td class="font-mono text-sm whitespace-nowrap">{{ formatDate(entry.date) }}</td>
                  <td>{{ entry.description }}</td>
                  <td>
                    <span v-if="entry.expand?.category_id?.name" class="badge badge-ghost badge-sm">{{
                      entry.expand?.category_id?.name
                    }}</span>
                    <span v-else class="text-base-content/30">—</span>
                  </td>
                  <td
                    class="text-right font-mono font-medium whitespace-nowrap"
                    :class="entry.amount >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ fmtAmount(entry.amount) }}
                  </td>
                  <td class="text-right">
                    <RouterLink :to="`/ledger/${entry.id}`" class="btn btn-ghost btn-xs">
                      <span class="i-fa-solid-pen"></span>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-xs text-base-content/40">Total entrants</td>
                  <td
                    class="text-right font-mono font-semibold whitespace-nowrap"
                    :class="sumOf(group.entrants) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ fmtAmount(sumOf(group.entrants)) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Sortants -->
        <div v-if="group.sortants.length > 0">
          <h4
            class="text-xs font-semibold text-base-content/50 uppercase tracking-widest mb-2 flex items-center gap-1.5"
          >
            <span class="i-fa-solid-arrow-right-from-bracket text-warning text-sm"></span>
            Sortants — cash encaissé après {{ group.year }}
          </h4>
          <div class="card bg-base-200">
            <table class="table table-sm">
              <thead>
                <tr class="text-base-content/50">
                  <th>Date (cash)</th>
                  <th>Description</th>
                  <th>Catégorie</th>
                  <th class="text-right">Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in group.sortants" :key="entry.id">
                  <td class="font-mono text-sm whitespace-nowrap">{{ formatDate(entry.date) }}</td>
                  <td>{{ entry.description }}</td>
                  <td>
                    <span v-if="entry.expand?.category_id?.name" class="badge badge-ghost badge-sm">{{
                      entry.expand?.category_id?.name
                    }}</span>
                    <span v-else class="text-base-content/30">—</span>
                  </td>
                  <td
                    class="text-right font-mono font-medium whitespace-nowrap"
                    :class="entry.amount >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ fmtAmount(entry.amount) }}
                  </td>
                  <td class="text-right">
                    <RouterLink :to="`/ledger/${entry.id}`" class="btn btn-ghost btn-xs">
                      <span class="i-fa-solid-pen"></span>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-xs text-base-content/40">Total sortants</td>
                  <td
                    class="text-right font-mono font-semibold whitespace-nowrap"
                    :class="sumOf(group.sortants) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ fmtAmount(sumOf(group.sortants)) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import useLedger from '@/admin/composables/useLedger'
import type { TLedgerEntry } from '@/admin/composables/useLedger'

const { entries, loadEntries } = useLedger()
const loading = ref(true)

onMounted(async () => {
  try {
    await loadEntries()
  } finally {
    loading.value = false
  }
})

const transitoires = computed(() =>
  entries.value.filter(e => {
    if (!e.fiscal_year) {
      return false
    }
    return e.fiscal_year !== parseInt(e.date.substring(0, 4))
  }),
)

interface TransitoireGroup {
  year: number
  entrants: TLedgerEntry[]
  sortants: TLedgerEntry[]
}

const groups = computed<TransitoireGroup[]>(() => {
  const byYear = new Map<number, TransitoireGroup>()
  for (const entry of transitoires.value) {
    const y = entry.fiscal_year!
    if (!byYear.has(y)) {
      byYear.set(y, { year: y, entrants: [], sortants: [] })
    }
    const group = byYear.get(y)!
    const cashYear = parseInt(entry.date.substring(0, 4))
    if (cashYear < y) {
      group.entrants.push(entry)
    } else {
      group.sortants.push(entry)
    }
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year)
})

const sumOf = (entries: TLedgerEntry[]) => entries.reduce((s, e) => s + e.amount, 0)

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
</script>
