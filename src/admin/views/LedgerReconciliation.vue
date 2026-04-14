<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/ledger" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-arrows-rotate text-xl"></span>
        Rapprochement bancaire
      </h2>
    </div>

    <ul class="steps mb-8 max-w-lg w-full">
      <li class="step" :class="step >= 1 ? 'step-primary' : ''">Import</li>
      <li class="step" :class="step >= 2 ? 'step-primary' : ''">Vérification</li>
      <li class="step" :class="step >= 3 ? 'step-primary' : ''">Résultat</li>
    </ul>

    <!-- ── Step 1 : Import ─────────────────────────────────────────── -->
    <div v-if="step === 1" class="max-w-lg">
      <FileUpload
        ref="fileUploadRef"
        mode="advanced"
        accept=".xml"
        :multiple="false"
        :disabled="loading"
        customUpload
        :pt="{ header: { style: 'display:none' }, pcMessage: { root: { class: 'm-3' } } }"
        @select="onFileSelect"
      >
        <template #empty>
          <div
            class="flex flex-col items-center gap-3 py-10 text-base-content/40 cursor-pointer select-none"
            :class="{ 'pointer-events-none': loading }"
            @click="openFilePicker"
          >
            <span
              class="i-fa-solid-file-arrow-up text-5xl"
              :class="{ 'animate-pulse !text-base-content/70': loading }"
            ></span>
            <span class="text-sm">{{
              loading
                ? 'Analyse en cours…'
                : 'Glissez un fichier XML (camt.053) ici ou cliquez pour choisir'
            }}</span>
          </div>
        </template>
      </FileUpload>
      <p v-if="parseError" class="text-error text-sm mt-3">{{ parseError }}</p>
    </div>

    <!-- ── Step 2 : Table de vérification ─────────────────────────── -->
    <div v-else-if="step === 2" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <p class="text-base-content/60 text-sm">
          {{ rows.length }} transaction{{ rows.length !== 1 ? 's' : '' }} &nbsp;&bull;&nbsp;{{
            rows.filter(r => r.action === 'link').length
          }}
          liées &nbsp;&bull;&nbsp;{{ rows.filter(r => r.action === 'create').length }} à créer
          &nbsp;&bull;&nbsp;{{ rows.filter(r => r.action === 'ignore').length }} ignorées
        </p>
        <div class="flex gap-2">
          <Button
            label="Retour"
            icon="i-fa-solid-arrow-left"
            severity="secondary"
            size="small"
            @click="step = 1"
          />
          <Button
            label="Confirmer"
            icon="i-fa-solid-check"
            size="small"
            :loading="confirming"
            @click="confirm"
          />
        </div>
      </div>

      <div class="overflow-auto rounded border border-base-300">
        <table class="table table-sm w-full">
          <thead class="sticky top-0 bg-base-200 z-10">
            <tr>
              <th class="w-28">Date</th>
              <th>Description banque</th>
              <th class="w-32 text-right">Montant</th>
              <th class="w-28">Action</th>
              <th>Correspondance / Création</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in rows"
              :key="i"
              class="hover"
              :class="{ 'opacity-35': row.action === 'ignore' }"
            >
              <td class="font-mono text-xs whitespace-nowrap">
                {{ formatDate(row.bankEntry.date) }}
              </td>
              <td class="text-xs max-w-xs">
                <span class="line-clamp-2" :title="row.bankEntry.description">{{
                  row.bankEntry.description
                }}</span>
              </td>
              <td
                class="text-right font-mono text-sm whitespace-nowrap"
                :class="row.bankEntry.amount >= 0 ? 'text-success' : 'text-error'"
              >
                {{ fmtAmount(row.bankEntry.amount) }}
              </td>
              <td>
                <select v-model="row.action" class="select select-xs select-bordered w-full">
                  <option value="link">Lier</option>
                  <option value="create">Créer</option>
                  <option value="ignore">Ignorer</option>
                </select>
              </td>
              <td>
                <!-- Lier : sélecteur de candidat -->
                <template v-if="row.action === 'link'">
                  <select
                    v-if="row.candidates.length"
                    v-model="row.linkedEntryId"
                    class="select select-xs select-bordered w-full"
                  >
                    <option v-for="c in row.candidates" :key="c.id" :value="c.id">
                      {{ formatDate(c.date) }} — {{ c.description }} ({{ fmtAmount(c.amount) }})
                    </option>
                  </select>
                  <span v-else class="text-xs text-warning flex items-center gap-1">
                    <span class="i-fa-solid-triangle-exclamation"></span>
                    Aucun candidat — sera traité comme "Créer"
                  </span>
                </template>

                <!-- Créer : description + catégorie éditables -->
                <template v-else-if="row.action === 'create'">
                  <div class="flex gap-2 items-center">
                    <InputText
                      v-model="row.editedDescription"
                      class="flex-1"
                      size="small"
                      style="font-size: 0.75rem"
                    />
                    <select
                      v-model="row.editedCategory"
                      class="select select-xs select-bordered w-36 shrink-0"
                    >
                      <option value="">— catégorie —</option>
                      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Step 3 : Résultat ───────────────────────────────────────── -->
    <div v-else-if="step === 3" class="card bg-base-200 p-6 max-w-sm">
      <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
        <span class="i-fa-solid-circle-check text-success text-xl"></span>
        Rapprochement terminé
      </h3>
      <div class="flex flex-col gap-2 mb-6">
        <div class="flex justify-between text-sm">
          <span>Écritures liées</span>
          <span class="font-mono font-semibold">{{ result.linked }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Écritures créées</span>
          <span class="font-mono font-semibold">{{ result.created }}</span>
        </div>
        <div class="flex justify-between text-sm text-base-content/50">
          <span>Ignorées</span>
          <span class="font-mono">{{ result.ignored }}</span>
        </div>
        <div v-if="result.invoiceMatched > 0" class="flex justify-between text-sm text-success">
          <span>Factures marquées payées</span>
          <span class="font-mono font-semibold">{{ result.invoiceMatched }}</span>
        </div>
      </div>
      <RouterLink to="/ledger">
        <Button label="Retour au Grand Livre" icon="i-fa-solid-book" class="w-full" />
      </RouterLink>
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import PbErrorToast from '../components/PbErrorToast.vue'
import useLedger from '../composables/useLedger'
import useSettings from '../composables/useSettings'
import useBankReconciliation from '../composables/useBankReconciliation'
import usePbErrorToast from '../composables/usePbErrorToast'
import camt053 from '../utils/bank-adapters/camt053'

const { entries, loadEntries } = useLedger()
const { settings, loadSettings } = useSettings()
const { rows, confirming, initReconciliation, confirmReconciliation } = useBankReconciliation()
const { showPbError } = usePbErrorToast()
const toast = useToast()

const fileUploadRef = useTemplateRef('fileUploadRef')
const openFilePicker = () => (fileUploadRef.value as any)?.choose()

const step = ref(1)
const loading = ref(false)
const parseError = ref('')
const result = ref({ linked: 0, created: 0, ignored: 0, invoiceMatched: 0 })

const categories = computed(() => (settings.value?.ledger_categories ?? []).map(c => c.name))

const onFileSelect = async (event: { files: File[] }) => {
  const file = event.files[0]
  if (!file) {
    return
  }
  loading.value = true
  parseError.value = ''
  try {
    const text = await file.text()
    const bankEntries = camt053.parse(text)
    if (!bankEntries.length) {
      parseError.value =
        'Aucune transaction détectée. Vérifiez que le fichier est bien un export camt.053 valide.'
      return
    }
    await Promise.all([loadEntries(), loadSettings()])
    initReconciliation(bankEntries, entries.value, settings.value?.ledger_categories ?? [])
    step.value = 2
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : "Erreur lors de l'analyse du fichier."
  } finally {
    loading.value = false
  }
}

const confirm = async () => {
  // Auto-downgrade "link" rows that have no valid candidate
  for (const row of rows.value) {
    if (row.action === 'link' && (!row.linkedEntryId || !row.candidates.length)) {
      row.action = 'create'
    }
  }
  try {
    const res = await confirmReconciliation()
    result.value = res
    step.value = 3
    toast.add({
      severity: 'success',
      summary: 'Rapprochement effectué',
      detail: `${res.linked} liée(s), ${res.created} créée(s), ${res.ignored} ignorée(s)${res.invoiceMatched ? `, ${res.invoiceMatched} facture(s) payée(s)` : ''}.`,
      life: 4000,
    })
  } catch (e) {
    showPbError(e)
  }
}

const formatDate = (d: string) => {
  const [y, m, day] = d.substring(0, 10).split('-')
  return `${day}.${m}.${y}`
}

const fmtAmount = (n: number) => {
  const sign = n >= 0 ? '+' : '−'
  const abs = Math.abs(n)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const formatted =
    Number(intPart) >= 10000 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'") : intPart
  return `${sign} ${formatted}.${decPart}`
}
</script>
