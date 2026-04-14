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

        <!-- Adresse -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Adresse</span></label>
          <Textarea
            v-model="form.address"
            placeholder="Rue de la Paix 1&#10;1000 Lausanne"
            :rows="3"
            class="w-full"
          />
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
            ><span class="label-text font-semibold">Labels de facture</span></label
          >
          <p class="text-xs text-base-content/50 mb-4">
            Personnalisez les textes du PDF. Laissez vide pour utiliser les valeurs par défaut.
          </p>
          <InvoiceLabelsEditor v-model="form.labels" />
        </div>

        <!-- Catégories Grand Livre -->
        <div class="form-control">
          <div class="divider mt-2 mb-0"></div>
          <label class="label mt-2"
            ><span class="label-text font-semibold">Catégories du Grand Livre</span></label
          >
          <p class="text-xs text-base-content/50 mb-4">
            Définissez les catégories et leurs patterns de détection automatique.<br />
            Un pattern peut être une chaîne de texte (recherche insensible à la casse) ou une regex
            au format <code class="font-mono">/pattern/flags</code>.
          </p>
          <div class="flex flex-col gap-3">
            <div
              v-for="(cat, i) in form.ledger_categories"
              :key="i"
              class="border border-base-300 rounded-lg p-3 flex flex-col gap-2"
            >
              <div class="flex gap-2 items-center">
                <InputText v-model="cat.name" placeholder="Nom de la catégorie" class="flex-1" />
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  :class="
                    usedCategoryNames.has(cat.name)
                      ? 'text-base-content/30 cursor-not-allowed'
                      : 'text-error'
                  "
                  v-tooltip.top="{
                    value: 'Catégorie utilisée dans le ledger',
                    disabled: !usedCategoryNames.has(cat.name),
                  }"
                  @click="removeCategory(i)"
                >
                  <span class="i-fa6-solid-trash"></span>
                </button>
              </div>
              <div class="pl-1 flex flex-col gap-1">
                <p
                  v-if="cat.patterns.length > 0 || newPatternInputs[i] !== undefined"
                  class="text-xs font-medium text-base-content/50"
                >
                  Patterns de détection automatique
                </p>
                <div v-for="(p, j) in cat.patterns" :key="j" class="flex gap-2 items-center">
                  <InputText
                    v-model="cat.patterns[j]"
                    class="flex-1"
                    style="font-family: monospace; font-size: 0.8rem"
                    placeholder="/regex/ ou texte à chercher"
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost text-error"
                    @click="removePattern(i, j)"
                  >
                    <span class="i-fa6-solid-xmark"></span>
                  </button>
                </div>
                <div v-if="newPatternInputs[i] !== undefined" class="flex gap-2 mt-1">
                  <InputText
                    v-model="newPatternInputs[i]"
                    placeholder="Pattern..."
                    class="flex-1"
                    style="font-family: monospace; font-size: 0.8rem"
                    @keydown.enter.prevent="addPattern(i)"
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost"
                    :class="
                      newPatternInputs[i]?.trim()
                        ? 'text-success'
                        : 'text-base-content/30 cursor-not-allowed'
                    "
                    @click="addPattern(i)"
                  >
                    <span class="i-fa-solid-check"></span>
                  </button>
                </div>
                <button
                  v-else
                  type="button"
                  class="text-xs text-base-content/40 text-left hover:text-base-content/70 transition-colors mt-1"
                  @click="newPatternInputs[i] = ''"
                >
                  + Ajouter des patterns de détection
                </button>
              </div>
            </div>
            <div class="flex gap-2 mt-1">
              <InputText
                v-model="newCategory"
                placeholder="Nouvelle catégorie..."
                class="flex-1"
                @keydown.enter.prevent="addCategory"
              />
              <Button
                type="button"
                label="Ajouter"
                icon="i-fa-solid-save"
                size="small"
                severity="secondary"
                @click="addCategory"
              />
            </div>
          </div>
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
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PbErrorToast from '../components/PbErrorToast.vue'
import InvoiceLabelsEditor from '../components/InvoiceLabelsEditor.vue'
import usePbErrorToast from '../composables/usePbErrorToast'
import useSettings from '../composables/useSettings'
import useLedger from '../composables/useLedger'
import type { TInvoiceLabels } from '../types/invoice-labels'
import type { TLedgerCategory } from '../types/ledger-category'

const { settings, loadSettings, updateSettings, getLogoUrl } = useSettings()
const { loadUsedCategories } = useLedger()
const { showPbError } = usePbErrorToast()
const toast = useToast()

const saving = ref(false)
const logoFile = ref<File | null>(null)
const newCategory = ref('')
const newPatternInputs = reactive<Record<number, string>>({})

const form = ref({
  company_name: '',
  address: '',
  phone: '',
  email: '',
  bank_account: '',
  hourly_rate: null as number | null,
  payment_terms: null as number | null,
  currency: 'CHF',
  tva_enabled: false,
  tva_number: '',
  tva_rate: null as number | null,
  labels: {} as TInvoiceLabels,
  ledger_categories: [] as TLedgerCategory[],
})

const usedCategoryNames = ref<Set<string>>(new Set())

const addCategory = () => {
  const name = newCategory.value.trim()
  if (name && !form.value.ledger_categories.some(c => c.name === name)) {
    form.value.ledger_categories.push({ name, patterns: [] })
  }
  newCategory.value = ''
}

const removeCategory = (index: number) => {
  const name = form.value.ledger_categories[index].name
  if (usedCategoryNames.value.has(name)) {
    toast.add({
      severity: 'warn',
      summary: 'Catégorie utilisée',
      detail: `"${name}" est utilisée dans le ledger et ne peut pas être supprimée.`,
      life: 4000,
    })
    return
  }
  form.value.ledger_categories.splice(index, 1)
  delete newPatternInputs[index]
}

const addPattern = (catIdx: number) => {
  const pattern = (newPatternInputs[catIdx] ?? '').trim()
  if (pattern) {
    form.value.ledger_categories[catIdx].patterns.push(pattern)
  }
  delete newPatternInputs[catIdx]
}

const removePattern = (catIdx: number, patIdx: number) => {
  form.value.ledger_categories[catIdx].patterns.splice(patIdx, 1)
}

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
    loadUsedCategories().then(s => {
      usedCategoryNames.value = s
    }),
  ])
  if (settings.value) {
    form.value = {
      company_name: settings.value.company_name || '',
      address: settings.value.address || '',
      phone: settings.value.phone || '',
      email: settings.value.email || '',
      bank_account: settings.value.bank_account || '',
      hourly_rate: settings.value.hourly_rate ?? null,
      payment_terms: settings.value.payment_terms ?? null,
      currency: settings.value.currency || 'CHF',
      tva_enabled: settings.value.tva_enabled ?? false,
      tva_number: settings.value.tva_number || '',
      tva_rate: settings.value.tva_rate ?? null,
      labels: settings.value.labels ?? {},
      ledger_categories: settings.value.ledger_categories ?? [],
    }
  }
})
</script>
