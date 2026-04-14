<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/ledger" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-pen text-xl"></span>
        {{ form.description || "Modifier l'écriture" }}
      </h2>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <div v-else class="card bg-base-200 p-6 max-w-2xl">
      <LedgerEntryForm
        v-model:form="form"
        :saving="saving"
        :invoice-id="entry?.invoice"
        :invoice-number="entry?.expand?.invoice?.invoice_number"
        @submit="save"
      />
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import PbErrorToast from '../components/PbErrorToast.vue'
import LedgerEntryForm from '../components/LedgerEntryForm.vue'
import useLedger from '../composables/useLedger'
import usePbErrorToast from '../composables/usePbErrorToast'
import type { TLedgerEntry } from '../composables/useLedger'

const { loadEntry, updateEntry } = useLedger()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const entryId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const entry = ref<TLedgerEntry | null>(null)

const form = ref({
  date: '',
  description: '',
  category: '',
  amount: null as number | null,
  is_checked: false,
  fiscal_year: null as number | null,
})

const save = async () => {
  saving.value = true
  try {
    await updateEntry(entryId, { ...form.value, invoice: entry.value?.invoice })
    toast.add({
      severity: 'success',
      summary: 'Enregistré',
      detail: "L'écriture a été mise à jour.",
      life: 3000,
    })
    router.push({ path: '/ledger', query: { focus: entryId } })
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const loaded = await loadEntry(entryId)
    entry.value = loaded
    form.value = {
      date: loaded.date ? loaded.date.substring(0, 10) : '',
      description: loaded.description || '',
      category: loaded.category || '',
      amount: loaded.amount ?? null,
      is_checked: loaded.is_checked ?? false,
      fiscal_year: loaded.fiscal_year || null,
    }
  } finally {
    loading.value = false
  }
})
</script>
