<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/ledger" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-plus text-xl"></span>
        Nouvelle écriture
      </h2>
    </div>

    <div class="card bg-base-200 p-6 max-w-2xl">
      <form @submit.prevent="save" class="flex flex-col gap-5">

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
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PbErrorToast from '../components/PbErrorToast.vue'
import useLedger from '../composables/useLedger'
import useSettings from '../composables/useSettings'
import usePbErrorToast from '../composables/usePbErrorToast'

const { createEntry } = useLedger()
const { settings, loadSettings } = useSettings()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const router = useRouter()

const saving = ref(false)

const form = ref({
  date: new Date().toISOString().substring(0, 10),
  description: '',
  category: '',
  amount: null as number | null,
  is_checked: false,
})

const categories = computed(() => settings.value?.ledger_categories ?? [])

const save = async () => {
  saving.value = true
  try {
    await createEntry({ ...form.value })
    toast.add({ severity: 'success', summary: 'Enregistré', detail: 'L\'écriture a été créée.', life: 3000 })
    router.push('/ledger')
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => loadSettings())
</script>
