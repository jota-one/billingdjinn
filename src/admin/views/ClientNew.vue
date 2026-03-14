<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/clients" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-user-plus text-xl"></span>
        Nouveau client
      </h2>
    </div>

    <div class="card bg-base-200 p-6 max-w-2xl">
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

        <!-- Taux horaire / Délai de paiement -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Taux horaire (CHF)</span>
              <span class="label-text-alt">Override entreprise</span>
            </label>
            <InputNumber
              v-model="form.hourly_rate"
              :min="0"
              mode="currency"
              currency="CHF"
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
              <span class="label-text-alt">Override entreprise</span>
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

        <!-- Actions -->
        <div class="flex justify-end gap-2 mt-2">
          <RouterLink to="/clients">
            <Button label="Annuler" severity="secondary" size="small" type="button" />
          </RouterLink>
          <Button type="submit" label="Créer le client" icon="i-fa-solid-save" size="small" :loading="saving" />
        </div>

      </form>
    </div>
  </div>
  <PbErrorToast />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PbErrorToast from '../components/PbErrorToast.vue'
import usePbErrorToast from '../composables/usePbErrorToast'
import useClients from '../composables/useClients'

const { createClient } = useClients()
const { showPbError } = usePbErrorToast()
const router = useRouter()

const saving = ref(false)

const form = ref({
  name: '',
  contact_person: '',
  address: '',
  phone: '',
  email: '',
  hourly_rate: null as number | null,
  payment_terms: null as number | null,
  date_acquisition: '',
  notes: '',
})

const save = async () => {
  saving.value = true
  try {
    await createClient({ ...form.value })
    router.push('/clients')
  } catch (e) {
    showPbError(e)
  } finally {
    saving.value = false
  }
}
</script>
