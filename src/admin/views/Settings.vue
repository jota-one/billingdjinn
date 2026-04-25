<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span class="i-fa-solid-building text-xl"></span>
      Settings de l'entreprise
    </h2>

    <div v-if="!settings" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <div v-else class="card bg-base-200 p-6 max-w-2xl">
      <form @submit.prevent="save" class="flex flex-col gap-5">
        <!-- Logo -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Logo</span></label>
          <div class="flex items-center gap-4">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              alt="Logo"
              class="w-20 h-20 object-contain rounded border border-base-300 bg-base-100"
            />
            <div
              v-else
              class="w-20 h-20 bg-base-300 rounded flex items-center justify-center border border-base-300"
            >
              <span class="i-fa-solid-image text-2xl text-base-content/30"></span>
            </div>
            <input
              type="file"
              accept="image/*"
              class="file-input file-input-bordered file-input-sm"
              @change="onLogoChange"
            />
          </div>
        </div>

        <!-- Nom de l'entreprise -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">
              Nom de l'entreprise <span class="text-error">*</span>
            </span>
          </label>
          <InputText v-model="form.company_name" placeholder="Acme Inc." required class="w-full" />
        </div>

        <!-- Adresse structurée -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Rue</span></label>
          <InputText v-model="form.street" placeholder="Rue de la Paix 1" class="w-full" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-semibold">NPA</span></label>
            <InputText v-model="form.zip" placeholder="1000" class="w-full" />
          </div>
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text font-semibold">Ville</span></label>
            <InputText v-model="form.city" placeholder="Lausanne" class="w-full" />
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Pays</span></label>
          <InputText v-model="form.country" placeholder="CH" class="w-full" />
        </div>

        <!-- Téléphone / Email -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-semibold">Téléphone</span></label>
            <InputText v-model="form.phone" placeholder="+41 21 123 45 67" class="w-full" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-semibold">Email</span></label>
            <InputText
              v-model="form.email"
              type="email"
              placeholder="contact@entreprise.ch"
              class="w-full"
            />
          </div>
        </div>

        <!-- IBAN -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Compte bancaire (IBAN)</span>
          </label>
          <InputText
            v-model="form.bank_account"
            placeholder="CH56 0483 5012 3456 7800 9"
            class="w-full"
          />
        </div>

        <!-- Taux horaire / Délai de paiement / Devise -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Taux horaire standard</span>
            </label>
            <InputNumber
              v-model="form.hourly_rate"
              :min="0"
              mode="currency"
              :currency="form.currency || 'CHF'"
              :max-fraction-digits="2"
              suffix=" /h"
              locale="fr-CH"
              placeholder="100"
              class="w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Délai de paiement (jours)</span>
            </label>
            <InputNumber
              v-model="form.payment_terms"
              :min="0"
              only-int
              suffix=" jours"
              placeholder="30"
              class="w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Devise par défaut</span>
            </label>
            <select v-model="form.currency" class="select select-bordered w-full">
              <option value="CHF">CHF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <!-- TVA -->
        <div class="form-control gap-3">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="form.tva_enabled" class="toggle toggle-primary" />
            <span class="label-text font-semibold">Affilié à la TVA</span>
          </label>
          <div v-if="form.tva_enabled" class="flex flex-col gap-3 pl-1">
            <div class="form-control">
              <label class="label"><span class="label-text">Numéro TVA</span></label>
              <InputText
                v-model="form.tva_number"
                placeholder="CHE-123.456.789 TVA"
                class="w-full"
              />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Taux TVA (%)</span></label>
              <InputNumber
                v-model="form.tva_rate"
                :min="0"
                :max="100"
                :max-fraction-digits="2"
                suffix=" %"
                placeholder="8,1"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Labels de facture -->
        <div class="form-control">
          <div class="divider mt-2 mb-0"></div>
          <label class="label mt-2"
            ><span class="label-text font-semibold">Template de facture</span></label
          >
          <p class="text-xs text-base-content/50 mb-2">
            Définit le modèle PDF utilisé pour toutes les factures.
            Les templates QR incluent le bordereau de paiement QR suisse.
          </p>
          <select v-model="form.invoice_template" class="select select-bordered w-full">
            <option v-for="t in availableTemplates" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Labels de facture -->
        <div class="form-control">
          <div class="divider mt-2 mb-0"></div>
          <label class="label mt-2"
            ><span class="label-text font-semibold">Labels de facture</span></label
          >
          <p class="text-xs text-base-content/50 mb-4">
            Personnalisez les textes du PDF. Laissez vide pour utiliser les valeurs par défaut.
          </p>
          <InvoiceLabelsEditor v-model="form.labels" />
        </div>

        <!-- Actions -->
        <div class="flex justify-end mt-2">
          <Button
            type="submit"
            label="Enregistrer"
            icon="i-fa-solid-save"
            size="small"
            :loading="saving"
          />
        </div>
      </form>
    </div>

    <!-- Centres de profit -->
    <div class="card bg-base-200 p-6 max-w-2xl mt-6">
      <h3 class="font-semibold text-lg mb-1">Centres de profit</h3>
      <p class="text-xs text-base-content/50 mb-4">
        Définissez vos centres de profit pour la comptabilité analytique. Chaque centre peut
        recevoir une couleur utilisée dans les graphiques.
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="pc in profitCenters"
          :key="pc.id"
          class="border border-base-300 rounded-lg p-3 flex flex-col gap-2"
        >
          <div class="flex gap-2 items-center">
            <input
              v-if="profitCenterDrafts[pc.id]"
              type="color"
              v-model="profitCenterDrafts[pc.id].color"
              class="w-9 h-9 rounded cursor-pointer border border-base-300 bg-base-100 p-0.5"
            />
            <InputText
              v-if="profitCenterDrafts[pc.id]"
              v-model="profitCenterDrafts[pc.id].name"
              placeholder="Nom du centre"
              class="flex-1"
            />
            <Button
              type="button"
              icon="i-fa-solid-save"
              size="small"
              severity="secondary"
              :loading="savingProfitCenterId === pc.id"
              v-tooltip.top="'Sauvegarder'"
              @click="saveProfitCenter(pc.id)"
            />
            <button
              type="button"
              class="btn btn-xs btn-ghost text-error"
              @click="removeProfitCenter(pc.id)"
            >
              <span class="i-fa6-solid-trash"></span>
            </button>
          </div>
        </div>

        <div class="flex gap-2 mt-1">
          <input
            type="color"
            v-model="newProfitCenterColor"
            class="w-9 h-9 rounded cursor-pointer border border-base-300 bg-base-100 p-0.5"
          />
          <InputText
            v-model="newProfitCenterName"
            placeholder="Nouveau centre de profit..."
            class="flex-1"
            @keydown.enter.prevent="addProfitCenter"
          />
          <Button
            type="button"
            label="Ajouter"
            icon="i-fa-solid-plus"
            size="small"
            severity="secondary"
            :loading="addingProfitCenter"
            @click="addProfitCenter"
          />
        </div>
      </div>
    </div>

    <!-- Catégories Grand Livre -->
    <div class="card bg-base-200 p-6 max-w-2xl mt-6">
      <h3 class="font-semibold text-lg mb-1">Catégories du Grand Livre</h3>
      <p class="text-xs text-base-content/50 mb-4">
        Définissez les catégories et leurs patterns de détection automatique.<br />
        Un pattern peut être une chaîne de texte (recherche insensible à la casse) ou une regex
        au format <code class="font-mono">/pattern/flags</code>.
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="border border-base-300 rounded-lg p-3 flex flex-col gap-2"
        >
          <div class="flex gap-2 items-center">
            <InputText
              v-if="categoryDrafts[cat.id]"
              v-model="categoryDrafts[cat.id].name"
              placeholder="Nom de la catégorie"
              class="flex-1"
            />
            <Button
              type="button"
              icon="i-fa-solid-save"
              size="small"
              severity="secondary"
              :loading="savingCategoryId === cat.id"
              v-tooltip.top="'Sauvegarder'"
              @click="saveCategory(cat.id)"
            />
            <button
              type="button"
              class="btn btn-xs btn-ghost"
              :class="
                usedCategoryIds.has(cat.id)
                  ? 'text-base-content/30 cursor-not-allowed'
                  : 'text-error'
              "
              v-tooltip.top="{
                value: 'Catégorie utilisée dans le ledger',
                disabled: !usedCategoryIds.has(cat.id),
              }"
              @click="removeCategory(cat.id)"
            >
              <span class="i-fa6-solid-trash"></span>
            </button>
          </div>

          <div v-if="categoryDrafts[cat.id]" class="pl-1 flex flex-col gap-1">
            <p
              v-if="
                categoryDrafts[cat.id].patterns.length > 0 ||
                newPatternInputs[cat.id] !== undefined
              "
              class="text-xs font-medium text-base-content/50"
            >
              Patterns de détection automatique
            </p>
            <div
              v-for="(p, j) in categoryDrafts[cat.id].patterns"
              :key="j"
              class="flex gap-2 items-center"
            >
              <InputText
                v-model="categoryDrafts[cat.id].patterns[j]"
                class="flex-1"
                style="font-family: monospace; font-size: 0.8rem"
                placeholder="/regex/ ou texte à chercher"
              />
              <button
                type="button"
                class="btn btn-xs btn-ghost text-error"
                @click="removePattern(cat.id, j)"
              >
                <span class="i-fa6-solid-xmark"></span>
              </button>
            </div>
            <div v-if="newPatternInputs[cat.id] !== undefined" class="flex gap-2 mt-1">
              <InputText
                v-model="newPatternInputs[cat.id]"
                placeholder="Pattern..."
                class="flex-1"
                style="font-family: monospace; font-size: 0.8rem"
                @keydown.enter.prevent="addPattern(cat.id)"
              />
              <button
                type="button"
                class="btn btn-xs btn-ghost"
                :class="
                  newPatternInputs[cat.id]?.trim()
                    ? 'text-success'
                    : 'text-base-content/30 cursor-not-allowed'
                "
                @click="addPattern(cat.id)"
              >
                <span class="i-fa-solid-check"></span>
              </button>
            </div>
            <button
              v-else
              type="button"
              class="text-xs text-base-content/40 text-left hover:text-base-content/70 transition-colors mt-1"
              @click="newPatternInputs[cat.id] = ''"
            >
              + Ajouter des patterns de détection
            </button>
          </div>

          <!-- Clés de répartition analytique -->
          <div v-if="profitCenters.length && categoryDrafts[cat.id]" class="pl-1 flex flex-col gap-2 mt-1">
            <div v-if="categoryDrafts[cat.id].allocation_keys.length > 0">
              <p class="text-xs font-medium text-base-content/50 mb-1">Clés de répartition analytique</p>
              <div
                v-for="(key, ki) in categoryDrafts[cat.id].allocation_keys"
                :key="ki"
                class="flex gap-2 items-center mb-1"
              >
                <select
                  v-model="key.profit_center_id"
                  class="select select-bordered select-sm flex-1"
                >
                  <option value="">— choisir —</option>
                  <option v-for="pc in profitCenters" :key="pc.id" :value="pc.id">
                    {{ pc.name }}
                  </option>
                </select>
                <InputNumber
                  v-model="key.percentage"
                  suffix=" %"
                  :min="0"
                  :max="100"
                  :max-fraction-digits="1"
                  class="w-28"
                />
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-error"
                  @click="removeAllocationKey(cat.id, ki)"
                >
                  <span class="i-fa6-solid-xmark"></span>
                </button>
              </div>
              <p
                v-if="allocationKeySum(cat.id) !== 100"
                class="text-xs text-warning mt-1"
              >
                Total : {{ allocationKeySum(cat.id) }}% (doit être 100%)
              </p>
            </div>
            <button
              type="button"
              class="text-xs text-base-content/40 text-left hover:text-base-content/70 transition-colors"
              @click="addAllocationKey(cat.id)"
            >
              + Ajouter une clé de répartition analytique
            </button>
          </div>
        </div>

        <div class="flex gap-2 mt-1">
          <InputText
            v-model="newCategoryName"
            placeholder="Nouvelle catégorie..."
            class="flex-1"
            @keydown.enter.prevent="addCategory"
          />
          <Button
            type="button"
            label="Ajouter"
            icon="i-fa-solid-plus"
            size="small"
            severity="secondary"
            :loading="addingCategory"
            @click="addCategory"
          />
        </div>
      </div>
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PbErrorToast from '@/admin/components/PbErrorToast.vue'
import InvoiceLabelsEditor from '@/admin/components/InvoiceLabelsEditor.vue'
import usePbErrorToast from '@/admin/composables/usePbErrorToast'
import useSettings from '@/admin/composables/useSettings'
import useCategories from '@/admin/composables/useCategories'
import useProfitCenters from '@/admin/composables/useProfitCenters'
import useLedger from '@/admin/composables/useLedger'
import { templates } from '@/admin/invoice-templates'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'
import type { TAllocationKey } from '@/admin/types/allocation-key'

const { settings, loadSettings, updateSettings, getLogoUrl } = useSettings()
const { categories, loadCategories, createCategory, updateCategory, deleteCategory } =
  useCategories()
const { profitCenters, loadProfitCenters, createProfitCenter, updateProfitCenter, deleteProfitCenter } =
  useProfitCenters()
const { loadUsedCategoryIds } = useLedger()
const { showPbError } = usePbErrorToast()
const toast = useToast()

const TEMPLATE_LABELS: Record<string, string> = {
  default: 'Classique',
  graphic: 'Graphique',
  'qr-default': 'Classique + QR',
  'qr-graphic': 'Graphique + QR',
}

const availableTemplates = Object.keys(templates).map(key => ({
  value: key,
  label: TEMPLATE_LABELS[key] ?? key,
}))

const saving = ref(false)
const logoFile = ref<File | null>(null)
const newCategoryName = ref('')
const addingCategory = ref(false)
const savingCategoryId = ref<string | null>(null)
const newPatternInputs = reactive<Record<string, string>>({})
const usedCategoryIds = ref<Set<string>>(new Set())

const newProfitCenterName = ref('')
const newProfitCenterColor = ref('#3b82f6')
const addingProfitCenter = ref(false)
const savingProfitCenterId = ref<string | null>(null)

/** Local drafts for editing categories before saving */
const categoryDrafts = reactive<Record<string, { name: string; patterns: string[]; allocation_keys: TAllocationKey[] }>>({})

/** Local drafts for editing profit centers before saving */
const profitCenterDrafts = reactive<Record<string, { name: string; color: string }>>({})

watch(
  categories,
  cats => {
    for (const cat of cats) {
      if (!(cat.id in categoryDrafts)) {
        categoryDrafts[cat.id] = {
          name: cat.name,
          patterns: [...cat.patterns],
          allocation_keys: cat.allocation_keys ? cat.allocation_keys.map(k => ({ ...k })) : [],
        }
      }
    }
  },
  { immediate: true },
)

watch(
  profitCenters,
  pcs => {
    for (const pc of pcs) {
      if (!(pc.id in profitCenterDrafts)) {
        profitCenterDrafts[pc.id] = { name: pc.name, color: pc.color }
      }
    }
  },
  { immediate: true },
)

const form = ref({
  company_name: '',
  street: '',
  zip: '',
  city: '',
  country: 'CH',
  phone: '',
  email: '',
  bank_account: '',
  hourly_rate: null as number | null,
  payment_terms: null as number | null,
  currency: 'CHF',
  invoice_template: 'default',
  tva_enabled: false,
  tva_number: '',
  tva_rate: null as number | null,
  labels: {} as TInvoiceLabels,
})

// ── Category management ──────────────────────────────────────────────────────

const addCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name || categories.value.some(c => c.name === name)) {
    return
  }
  addingCategory.value = true
  try {
    await createCategory(name, [])
    newCategoryName.value = ''
  } catch (e) {
    showPbError(e)
  } finally {
    addingCategory.value = false
  }
}

const saveCategory = async (id: string) => {
  const draft = categoryDrafts[id]
  if (!draft) { return }
  savingCategoryId.value = id
  try {
    await updateCategory(id, draft.name, draft.patterns, draft.allocation_keys)
    toast.add({ severity: 'success', summary: 'Catégorie sauvegardée', life: 2000 })
  } catch (e) {
    showPbError(e)
  } finally {
    savingCategoryId.value = null
  }
}

const removeCategory = async (id: string) => {
  if (usedCategoryIds.value.has(id)) {
    const cat = categories.value.find(c => c.id === id)
    toast.add({
      severity: 'warn',
      summary: 'Catégorie utilisée',
      detail: `"${cat?.name}" est utilisée dans le ledger et ne peut pas être supprimée.`,
      life: 4000,
    })
    return
  }
  try {
    await deleteCategory(id)
    delete categoryDrafts[id]
  } catch (e) {
    showPbError(e)
  }
}

const addPattern = (catId: string) => {
  const pattern = (newPatternInputs[catId] ?? '').trim()
  if (pattern && categoryDrafts[catId]) {
    categoryDrafts[catId].patterns.push(pattern)
  }
  delete newPatternInputs[catId]
}

const removePattern = (catId: string, patIdx: number) => {
  categoryDrafts[catId]?.patterns.splice(patIdx, 1)
}

const allocationKeySum = (catId: string): number => {
  const keys = categoryDrafts[catId]?.allocation_keys ?? []
  return Math.round(keys.reduce((s, k) => s + (k.percentage ?? 0), 0) * 10) / 10
}

const addAllocationKey = (catId: string) => {
  if (categoryDrafts[catId]) {
    categoryDrafts[catId].allocation_keys.push({ profit_center_id: '', percentage: 0 })
  }
}

const removeAllocationKey = (catId: string, idx: number) => {
  categoryDrafts[catId]?.allocation_keys.splice(idx, 1)
}

// ── Profit center management ─────────────────────────────────────────────────

const addProfitCenter = async () => {
  const name = newProfitCenterName.value.trim()
  if (!name || profitCenters.value.some(pc => pc.name === name)) { return }
  addingProfitCenter.value = true
  try {
    await createProfitCenter(name, newProfitCenterColor.value)
    newProfitCenterName.value = ''
    newProfitCenterColor.value = '#3b82f6'
  } catch (e) {
    showPbError(e)
  } finally {
    addingProfitCenter.value = false
  }
}

const saveProfitCenter = async (id: string) => {
  const draft = profitCenterDrafts[id]
  if (!draft) { return }
  savingProfitCenterId.value = id
  try {
    await updateProfitCenter(id, draft.name, draft.color)
    toast.add({ severity: 'success', summary: 'Centre sauvegardé', life: 2000 })
  } catch (e) {
    showPbError(e)
  } finally {
    savingProfitCenterId.value = null
  }
}

const removeProfitCenter = async (id: string) => {
  try {
    await deleteProfitCenter(id)
    delete profitCenterDrafts[id]
  } catch (e) {
    showPbError(e)
  }
}

// ── Settings form ────────────────────────────────────────────────────────────

const logoUrl = computed(() => {
  if (logoFile.value) {
    return URL.createObjectURL(logoFile.value)
  }
  if (settings.value) {
    return getLogoUrl(settings.value)
  }
  return ''
})

const onLogoChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    logoFile.value = input.files[0]
  }
}

const save = async () => {
  saving.value = true
  try {
    await updateSettings({
      ...form.value,
      logo: logoFile.value,
    })
    logoFile.value = null
    toast.add({
      severity: 'success',
      summary: 'Enregistré',
      detail: 'Les paramètres ont été sauvegardés.',
      life: 3000,
    })
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadSettings(),
    loadCategories(),
    loadProfitCenters(),
    loadUsedCategoryIds().then(ids => {
      usedCategoryIds.value = ids
    }),
  ])
  if (settings.value) {
    form.value = {
      company_name: settings.value.company_name || '',
      street: settings.value.street || '',
      zip: settings.value.zip || '',
      city: settings.value.city || '',
      country: settings.value.country || 'CH',
      phone: settings.value.phone || '',
      email: settings.value.email || '',
      bank_account: settings.value.bank_account || '',
      hourly_rate: settings.value.hourly_rate ?? null,
      payment_terms: settings.value.payment_terms ?? null,
      currency: settings.value.currency || 'CHF',
      invoice_template: settings.value.invoice_template || 'default',
      tva_enabled: settings.value.tva_enabled ?? false,
      tva_number: settings.value.tva_number || '',
      tva_rate: settings.value.tva_rate ?? null,
      labels: settings.value.labels ?? {},
    }
  }
})
</script>
