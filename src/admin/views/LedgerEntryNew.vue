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
      <LedgerEntryForm v-model:form="form" :saving="saving" @submit="save" />
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import PbErrorToast from '../components/PbErrorToast.vue'
import LedgerEntryForm from '../components/LedgerEntryForm.vue'
import useLedger from '../composables/useLedger'
import usePbErrorToast from '../composables/usePbErrorToast'

const { createEntry } = useLedger()
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
  fiscal_year: null as number | null,
})

const save = async () => {
  saving.value = true
  try {
    const created = await createEntry({ ...form.value })
    toast.add({
      severity: 'success',
      summary: 'Enregistré',
      detail: "L'écriture a été créée.",
      life: 3000,
    })
    router.push({ path: '/ledger', query: { focus: created.id } })
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}
</script>
