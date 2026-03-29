<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/ledger" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-calendar-plus text-xl"></span>
        Saisie en série
      </h2>
    </div>

    <!-- Step indicator -->
    <ul class="steps mb-8 max-w-2xl w-full">
      <li class="step" :class="currentStep >= 1 ? 'step-primary' : ''">Écriture</li>
      <li class="step" :class="currentStep >= 2 ? 'step-primary' : ''">Récurrence</li>
      <li class="step" :class="currentStep >= 3 ? 'step-primary' : ''">Fin</li>
      <li class="step" :class="currentStep >= 4 ? 'step-primary' : ''">Aperçu</li>
    </ul>

    <div class="card bg-base-200 p-6 max-w-2xl">

      <!-- ── Step 1 : Écriture ───────────────────────────────────────── -->
      <div v-if="currentStep === 1">
        <h3 class="font-semibold text-lg mb-4">Écriture de base</h3>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold">Date de début <span class="text-error">*</span></span></label>
              <input v-model="entry.startDate" type="date" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold">Catégorie</span></label>
              <select v-model="entry.category" class="select select-bordered w-full">
                <option value="">— aucune —</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-semibold">Montant <span class="text-error">*</span></span></label>
              <InputNumber
                v-model="entry.amount"
                :max-fraction-digits="2"
                locale="fr-CH"
                placeholder="0.00"
                class="w-full"
                :input-class="entry.amount !== null && entry.amount < 0 ? 'text-error' : entry.amount !== null && entry.amount > 0 ? 'text-success' : ''"
              />
              <span class="label-text-alt text-base-content/40 mt-1">Positif = entrée, négatif = sortie</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-semibold">Description <span class="text-error">*</span></span></label>
            <InputText v-model="entry.description" placeholder="Ex. Salaire — Pierre Dupont" class="w-full" />
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <Button label="Suivant" icon="i-fa-solid-arrow-right" iconPos="right" :disabled="!step1Valid" @click="currentStep = 2" />
        </div>
      </div>

      <!-- ── Step 2 : Récurrence ────────────────────────────────────── -->
      <div v-else-if="currentStep === 2">
        <h3 class="font-semibold text-lg mb-4">Récurrence</h3>
        <div class="flex flex-col gap-5">

          <div class="form-control max-w-xs">
            <label class="label"><span class="label-text font-semibold">Type</span></label>
            <select v-model="recurrence.type" class="select select-bordered w-full">
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="quarterly">Trimestriel</option>
              <option value="annual">Annuel</option>
            </select>
          </div>

          <!-- Hebdomadaire -->
          <div v-if="recurrence.type === 'weekly'" class="form-control max-w-xs">
            <label class="label"><span class="label-text font-semibold">Jour de la semaine</span></label>
            <select v-model="recurrence.weekday" class="select select-bordered w-full">
              <option :value="1">Lundi</option>
              <option :value="2">Mardi</option>
              <option :value="3">Mercredi</option>
              <option :value="4">Jeudi</option>
              <option :value="5">Vendredi</option>
              <option :value="6">Samedi</option>
              <option :value="7">Dimanche</option>
            </select>
          </div>

          <!-- Mensuel / Trimestriel -->
          <div v-if="recurrence.type === 'monthly' || recurrence.type === 'quarterly'" class="form-control">
            <label class="label"><span class="label-text font-semibold">Jour du mois</span></label>
            <div class="flex flex-col gap-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="recurrence.monthMode" value="fixed" class="radio radio-sm" />
                <span>Jour fixe</span>
              </label>
              <div v-if="recurrence.monthMode === 'fixed'" class="pl-6 flex items-center gap-2">
                <input
                  v-model.number="recurrence.monthDay"
                  type="number" min="1" max="28"
                  class="input input-bordered input-sm w-20"
                />
                <span class="text-sm text-base-content/60">du mois (1–28)</span>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="recurrence.monthMode" value="last" class="radio radio-sm" />
                <span>Dernier jour du mois</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="recurrence.monthMode" value="lastWorkday" class="radio radio-sm" />
                <span>Dernier jour ouvrable</span>
              </label>
            </div>
          </div>

          <!-- Annuel -->
          <div v-if="recurrence.type === 'annual'" class="form-control">
            <label class="label"><span class="label-text font-semibold">Date annuelle</span></label>
            <div class="flex flex-col gap-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="recurrence.annualMode" value="fixed" class="radio radio-sm" />
                <span>Même date chaque année</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="recurrence.annualMode" value="lastWorkday" class="radio radio-sm" />
                <span>Dernier jour ouvrable du mois</span>
              </label>
            </div>
          </div>

        </div>
        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="i-fa-solid-arrow-left" severity="secondary" @click="currentStep = 1" />
          <Button label="Suivant" icon="i-fa-solid-arrow-right" iconPos="right" @click="currentStep = 3" />
        </div>
      </div>

      <!-- ── Step 3 : Fin ───────────────────────────────────────────── -->
      <div v-else-if="currentStep === 3">
        <h3 class="font-semibold text-lg mb-4">Condition de fin</h3>
        <div class="flex flex-col gap-5">
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="endCondition.type" value="count" class="radio radio-sm" />
              <span class="font-semibold">Nombre d'occurrences</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="endCondition.type" value="date" class="radio radio-sm" />
              <span class="font-semibold">Date de fin</span>
            </label>
          </div>

          <div v-if="endCondition.type === 'count'" class="form-control max-w-xs">
            <label class="label"><span class="label-text font-semibold">Nombre d'occurrences</span></label>
            <InputNumber v-model="endCondition.count" :min="1" :max="120" :use-grouping="false" class="w-full" />
          </div>

          <div v-else class="form-control max-w-xs">
            <label class="label"><span class="label-text font-semibold">Date de fin</span></label>
            <input v-model="endCondition.endDate" type="date" :min="entry.startDate" class="input input-bordered w-full" />
          </div>
        </div>
        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="i-fa-solid-arrow-left" severity="secondary" @click="currentStep = 2" />
          <Button label="Aperçu" icon="i-fa-solid-eye" iconPos="right" :disabled="!step3Valid" @click="currentStep = 4" />
        </div>
      </div>

      <!-- ── Step 4 : Aperçu ────────────────────────────────────────── -->
      <div v-else-if="currentStep === 4">
        <h3 class="font-semibold text-lg mb-1">Aperçu</h3>
        <p class="text-base-content/60 text-sm mb-4">
          {{ preview.length }} écriture{{ preview.length !== 1 ? 's' : '' }} à créer
        </p>
        <div class="overflow-y-auto max-h-96 rounded border border-base-300">
          <table class="table table-sm w-full">
            <thead class="sticky top-0 bg-base-200">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in preview" :key="i" class="hover">
                <td class="font-mono text-sm whitespace-nowrap">{{ formatDate(item.date) }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.category || '—' }}</td>
                <td class="text-right font-mono whitespace-nowrap" :class="item.amount >= 0 ? 'text-success' : 'text-error'">
                  {{ fmtAmount(item.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="i-fa-solid-arrow-left" severity="secondary" @click="currentStep = 3" />
          <Button
            label="Créer les écritures"
            icon="i-fa-solid-check"
            :loading="saving"
            @click="createAll"
          />
        </div>
      </div>

    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import dayjs from 'dayjs'
import PbErrorToast from '../components/PbErrorToast.vue'
import useLedger from '../composables/useLedger'
import useSettings from '../composables/useSettings'
import usePbErrorToast from '../composables/usePbErrorToast'

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
type MonthMode = 'fixed' | 'last' | 'lastWorkday'

const { createEntry } = useLedger()
const { settings, loadSettings } = useSettings()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const router = useRouter()

const currentStep = ref(1)
const saving = ref(false)

const entry = reactive({
  startDate: new Date().toISOString().substring(0, 10),
  description: '',
  category: '',
  amount: null as number | null,
})

const recurrence = reactive({
  type: 'monthly' as RecurrenceType,
  weekday: 1,
  monthMode: 'fixed' as MonthMode,
  monthDay: 1,
  annualMode: 'fixed' as 'fixed' | 'lastWorkday',
})

const endCondition = reactive({
  type: 'count' as 'date' | 'count',
  endDate: '',
  count: 12,
})

const categories = computed(() => settings.value?.ledger_categories ?? [])

const step1Valid = computed(() =>
  !!entry.startDate && !!entry.description.trim() && entry.amount !== null
)

const step3Valid = computed(() => {
  if (endCondition.type === 'date') return !!endCondition.endDate && endCondition.endDate > entry.startDate
  return (endCondition.count ?? 0) > 0
})

// ── Date generation ───────────────────────────────────────────────────────────

function lastWorkday(d: dayjs.Dayjs): dayjs.Dayjs {
  const last = d.endOf('month').startOf('day')
  const dow = last.day() // 0=Sun, 6=Sat
  if (dow === 6) return last.subtract(1, 'day')
  if (dow === 0) return last.subtract(2, 'day')
  return last
}

function applyMonthMode(d: dayjs.Dayjs): dayjs.Dayjs {
  if (recurrence.monthMode === 'last') return d.endOf('month').startOf('day')
  if (recurrence.monthMode === 'lastWorkday') return lastWorkday(d)
  const day = Math.min(recurrence.monthDay || 1, d.daysInMonth())
  return d.date(day)
}

function firstOccurrence(): dayjs.Dayjs {
  const start = dayjs(entry.startDate)

  if (recurrence.type === 'weekly') {
    // First matching weekday strictly AFTER start date
    const targetDow = recurrence.weekday === 7 ? 0 : recurrence.weekday
    const diff = (targetDow - start.day() + 7) % 7
    return start.add(diff === 0 ? 7 : diff, 'day')
  }

  if (recurrence.type === 'monthly' || recurrence.type === 'quarterly') {
    const candidate = applyMonthMode(start)
    if (!candidate.isBefore(start, 'day')) return candidate
    const step = recurrence.type === 'quarterly' ? 3 : 1
    return applyMonthMode(start.add(step, 'month'))
  }

  if (recurrence.type === 'annual' && recurrence.annualMode === 'lastWorkday') {
    const candidate = lastWorkday(start)
    if (!candidate.isBefore(start, 'day')) return candidate
    return lastWorkday(start.add(1, 'year'))
  }

  return start // daily, annual fixed
}

function nextOccurrence(current: dayjs.Dayjs): dayjs.Dayjs {
  switch (recurrence.type) {
    case 'daily': return current.add(1, 'day')
    case 'weekly': return current.add(7, 'day')
    case 'monthly': return applyMonthMode(current.add(1, 'month'))
    case 'quarterly': return applyMonthMode(current.add(3, 'month'))
    case 'annual':
      return recurrence.annualMode === 'lastWorkday'
        ? lastWorkday(current.add(1, 'year'))
        : current.add(1, 'year')
  }
}

function generateDates(): string[] {
  const dates: string[] = []
  let current = firstOccurrence()
  const MAX = 500

  if (endCondition.type === 'count') {
    for (let i = 0; i < (endCondition.count ?? 1) && i < MAX; i++) {
      dates.push(current.format('YYYY-MM-DD'))
      current = nextOccurrence(current)
    }
  } else {
    const end = dayjs(endCondition.endDate)
    while (!current.isAfter(end) && dates.length < MAX) {
      dates.push(current.format('YYYY-MM-DD'))
      current = nextOccurrence(current)
    }
  }
  return dates
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function labelSuffix(date: string): string {
  const d = dayjs(date)
  if (recurrence.type === 'monthly') return ` - ${MONTHS_FR[d.month()]} ${d.year()}`
  if (recurrence.type === 'quarterly') return ` - Q${Math.ceil((d.month() + 1) / 3)} ${d.year()}`
  return ''
}

const preview = computed(() => {
  if (currentStep.value < 4) return []
  return generateDates().map(date => ({
    date,
    description: entry.description + labelSuffix(date),
    category: entry.category,
    amount: entry.amount ?? 0,
  }))
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (d: string) => dayjs(d).format('DD.MM.YYYY')

const fmtAmount = (n: number) => {
  const sign = n >= 0 ? '+' : '−'
  const abs = Math.abs(n)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const formatted = Number(intPart) >= 10000 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : intPart
  return `${sign} ${formatted}.${decPart}`
}

// ── Save ──────────────────────────────────────────────────────────────────────

const createAll = async () => {
  saving.value = true
  try {
    for (const item of preview.value) {
      await createEntry({
        date: item.date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        is_checked: false,
        fiscal_year: null,
      })
    }
    toast.add({ severity: 'success', summary: 'Créé', detail: `${preview.value.length} écriture(s) créée(s).`, life: 3000 })
    router.push('/ledger')
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => loadSettings())
</script>
