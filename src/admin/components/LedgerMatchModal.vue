<template>
  <Dialog v-model:visible="visible" modal header="Écriture planifiée trouvée" class="w-[44rem]">
    <div class="py-4">
      <p class="text-sm text-base-content/70 mb-4">
        La facture correspond-elle à l'une de ces écritures planifiées ? Choisissez-en une pour la
        convertir en écriture réelle, ou créez-en une nouvelle.
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="candidate in candidates"
          :key="candidate.id"
          class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ candidate.description }}</div>
            <div class="flex gap-3 text-xs text-base-content/50 mt-1">
              <span>{{ formatDate(candidate.date) }}</span>
              <span v-if="candidate.expand?.category_id?.name">{{ candidate.expand?.category_id?.name }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-mono font-semibold text-success">
              {{ fmtAmount(candidate.amount) }}
            </div>
            <div class="text-xs text-base-content/40 mt-0.5">
              vs {{ fmtAmount(props.invoiceAmount) }}
            </div>
          </div>
          <span class="badge badge-sm shrink-0" :class="scoreBadgeClass(candidate.score)">
            {{ scoreBadgeLabel(candidate.score) }}
          </span>
          <Button label="Lier" icon="i-fa-solid-link" size="small" @click="link(candidate.id)" />
        </div>
      </div>
    </div>

    <div class="flex justify-between gap-2 pt-4 border-t border-base-300">
      <Button type="button" label="Ignorer" severity="secondary" @click="skip" />
      <Button
        type="button"
        label="Créer une nouvelle écriture"
        icon="i-fa-solid-plus"
        severity="secondary"
        @click="createNew"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { TLedgerCandidateEntry } from '@/admin/composables/useLedger'

const props = defineProps<{
  candidates: TLedgerCandidateEntry[]
  invoiceAmount: number
}>()

const emit = defineEmits<{
  (e: 'link', entryId: string): void
  (e: 'create-new'): void
  (e: 'skip'): void
}>()

const visible = defineModel<boolean>({ required: true })

const link = (entryId: string) => {
  visible.value = false
  emit('link', entryId)
}

const createNew = () => {
  visible.value = false
  emit('create-new')
}

const skip = () => {
  visible.value = false
  emit('skip')
}

const formatDate = (date?: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—')

const fmtAmount = (n: number): string => {
  const [int, dec] = Math.abs(n).toFixed(2).split('.')
  const formattedInt = Number(int) >= 10000 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : int
  return `${formattedInt}.${dec}`
}

const scoreBadgeClass = (score: number) => {
  if (score >= 0.7) {
    return 'badge-success'
  }
  if (score >= 0.4) {
    return 'badge-warning'
  }
  return 'badge-neutral'
}

const scoreBadgeLabel = (score: number) => {
  if (score >= 0.7) {
    return 'Haute'
  }
  if (score >= 0.4) {
    return 'Moyenne'
  }
  return 'Basse'
}
</script>
