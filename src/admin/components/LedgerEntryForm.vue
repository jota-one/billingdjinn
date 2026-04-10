<template>
  <div>
    <div v-if="invoiceLinked" class="alert alert-info mb-5 text-sm">
      <span class="i-fa-solid-link"></span>
      Cette écriture a été créée automatiquement lors de l'encaissement d'une facture.
    </div>

    <form @submit.prevent="$emit('submit')" class="flex flex-col gap-5">

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Date -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Date <span class="text-error">*</span></span>
          </label>
          <input
            v-model="form.date"
            type="date"
            required
            class="input input-bordered w-full"
          />
        </div>

        <!-- Catégorie -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Catégorie</span>
          </label>
          <select v-model="form.category" class="select select-bordered w-full">
            <option value="">— aucune —</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Montant -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Montant <span class="text-error">*</span></span>
          </label>
          <InputNumber
            v-model="form.amount"
            :max-fraction-digits="2"
            locale="fr-CH"
            placeholder="0.00"
            class="w-full"
            :input-class="form.amount !== null && form.amount < 0 ? 'text-error' : form.amount !== null && form.amount > 0 ? 'text-success' : ''"
          />
          <span class="label-text-alt text-base-content/40 mt-1">Positif = entrée, négatif = sortie</span>
        </div>
      </div>

      <!-- Année fiscale -->
      <div class="form-control max-w-xs">
        <label class="label">
          <span class="label-text font-semibold">
            Année fiscale
            <span v-if="isTransitoire" class="badge badge-warning badge-sm ml-2">Transitoire</span>
          </span>
        </label>
        <input
          v-model.number="form.fiscal_year"
          type="number"
          min="2000"
          max="2099"
          :placeholder="inferredYear.toString()"
          class="input input-bordered w-full"
        />
        <span class="label-text-alt text-base-content/40 mt-1">
          Laisser vide si identique à l'année de la date. À renseigner uniquement pour les comptes de régularisation (transitoires).
        </span>
      </div>

      <!-- Description -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Description <span class="text-error">*</span></span>
        </label>
        <InputText
          v-model="form.description"
          placeholder="Ex. Salaire mars 2026"
          required
          class="w-full"
        />
      </div>

      <!-- Vérifiée -->
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" v-model="form.is_checked" class="toggle toggle-success" />
          <span class="label-text font-semibold">Écriture vérifiée</span>
        </label>
        <p class="text-xs text-base-content/40 pl-1">
          Cochez une fois que cette écriture a été confirmée dans vos relevés bancaires.
        </p>
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
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import useSettings from '../composables/useSettings'
import type { TLedgerEntryForm } from '../composables/useLedger'

defineProps<{ saving: boolean; invoiceLinked?: boolean }>()
defineEmits<{ submit: [] }>()

const form = defineModel<TLedgerEntryForm>('form', { required: true })

const { settings, loadSettings } = useSettings()
onMounted(() => loadSettings())

const categories = computed(() => (settings.value?.ledger_categories ?? []).map(c => c.name))

const inferredYear = computed(() => {
  if (form.value.date) return parseInt(form.value.date.substring(0, 4))
  return new Date().getFullYear()
})

const isTransitoire = computed(() =>
  !!form.value.fiscal_year && form.value.fiscal_year !== inferredYear.value
)
</script>
