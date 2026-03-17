<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/clients" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-user-pen text-xl"></span>
        {{ form.name || 'Modifier le client' }}
      </h2>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-base-content/50">
      <span class="loading loading-spinner loading-sm"></span>
      Chargement...
    </div>

    <div v-else class="card bg-base-200 p-6 max-w-2xl">
      <form @submit.prevent="save" class="flex flex-col gap-5">

        <!-- Nom -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Nom <span class="text-error">*</span></span>
          </label>
          <InputText v-model="form.name" placeholder="Acme SA" required class="w-full" />
        </div>

        <!-- Personne de contact -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Personne de contact</span>
          </label>
          <InputText v-model="form.contact_person" placeholder="Jean Dupont" class="w-full" />
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
            <InputText v-model="form.email" type="email" placeholder="contact@acme.ch" class="w-full" />
          </div>
        </div>

        <!-- Taux horaire / Délai de paiement / Devise -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Taux horaire</span>
            </label>
            <InputNumber
              v-model="form.hourly_rate"
              :min="0"
              mode="currency"
              :currency="form.currency || 'CHF'"
              :max-fraction-digits="2"
              suffix=" /h"
              locale="fr-CH"
              placeholder="—"
              class="w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Délai de paiement</span>
            </label>
            <InputNumber
              v-model="form.payment_terms"
              :min="0"
              :only-int="true"
              suffix=" jours"
              placeholder="—"
              class="w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Devise</span>
            </label>
            <select v-model="form.currency" class="select select-bordered w-full">
              <option value="">— défaut entreprise —</option>
              <option value="CHF">CHF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <!-- Date d'acquisition -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Client depuis</span></label>
          <input
            v-model="form.date_acquisition"
            type="date"
            class="input input-bordered w-full"
          />
        </div>

        <!-- Notes -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Notes internes</span></label>
          <Textarea v-model="form.notes" placeholder="Remarques, contexte..." :rows="3" class="w-full" />
        </div>

        <!-- Labels de facture (override) -->
        <div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg">
          <input type="checkbox" />
          <div class="collapse-title text-sm font-semibold">
            Labels de facture <span class="text-base-content/40 font-normal">(override client)</span>
          </div>
          <div class="collapse-content pt-0">
            <p class="text-xs text-base-content/50 mb-4">Laissez vide pour hériter des labels de l'entreprise.</p>
            <InvoiceLabelsEditor v-model="form.labels" :placeholders="companyLabels" />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end mt-2">
          <Button type="submit" label="Enregistrer" icon="i-fa-solid-save" size="small" :loading="saving" />
        </div>

      </form>
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PbErrorToast from '../components/PbErrorToast.vue'
import InvoiceLabelsEditor from '../components/InvoiceLabelsEditor.vue'
import usePbErrorToast from '../composables/usePbErrorToast'
import useClients from '../composables/useClients'
import useSettings from '../composables/useSettings'
import { resolveLabels } from '../utils/invoice-labels'
import type { TInvoiceLabels } from '../types/invoice-labels'

const { loadClient, updateClient } = useClients()
const { settings, loadSettings } = useSettings()
const { showPbError } = usePbErrorToast()
const toast = useToast()
const route = useRoute()

const clientId = route.params.id as string

const loading = ref(true)
const saving = ref(false)

const form = ref({
  name: '',
  contact_person: '',
  address: '',
  phone: '',
  email: '',
  hourly_rate: null as number | null,
  payment_terms: null as number | null,
  currency: '',
  date_acquisition: '',
  notes: '',
  labels: {} as TInvoiceLabels,
})

const companyLabels = computed(() => resolveLabels(settings.value?.labels))

const save = async () => {
  saving.value = true
  try {
    await updateClient(clientId, { ...form.value })
    toast.add({ severity: 'success', summary: 'Enregistré', detail: 'Le client a été mis à jour.', life: 3000 })
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [client] = await Promise.all([loadClient(clientId), loadSettings()])
    form.value = {
      name: client.name || '',
      contact_person: client.contact_person || '',
      address: client.address || '',
      phone: client.phone || '',
      email: client.email || '',
      hourly_rate: client.hourly_rate ?? null,
      payment_terms: client.payment_terms ?? null,
      currency: client.currency || '',
      date_acquisition: client.date_acquisition ? client.date_acquisition.substring(0, 10) : '',
      notes: client.notes || '',
      labels: client.labels ?? {},
    }
  } finally {
    loading.value = false
  }
})
</script>
