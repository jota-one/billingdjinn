<template>
  <div class="flex flex-col gap-6">
    <!-- Informations générales -->
    <div class="card bg-base-200 p-6">
      <h3 class="font-semibold text-lg mb-4">Informations générales</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Client -->
        <div class="form-control sm:col-span-2">
          <label class="label"
            ><span class="label-text font-semibold"
              >Client <span class="text-error">*</span></span
            ></label
          >
          <Select
            v-model="form.client"
            :options="clientOptions"
            option-label="label"
            option-value="value"
            placeholder="Sélectionner un client"
            filter
            :disabled="readonly"
            class="w-full"
          />
        </div>

        <!-- Numéro de facture -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >N° de facture <span class="text-error">*</span></span
            ></label
          >
          <InputText
            v-model="form.invoice_number"
            placeholder="2026-001"
            required
            :disabled="readonly"
            class="w-full"
          />
        </div>

        <!-- Statut -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Statut</span></label>
          <Select
            v-model="form.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

        <!-- Date -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Date <span class="text-error">*</span></span
            ></label
          >
          <input
            v-model="form.date"
            type="date"
            class="input input-bordered w-full"
            required
            :disabled="readonly"
          />
        </div>

        <!-- Date d'échéance -->
        <div class="form-control">
          <label class="label"><span class="label-text font-semibold">Date d'échéance</span></label>
          <input
            v-model="form.due_date"
            type="date"
            class="input input-bordered w-full"
            :disabled="readonly"
          />
        </div>
      </div>
    </div>

    <!-- Lignes de facture -->
    <div class="card bg-base-200 p-6">
      <h3 class="font-semibold text-lg mb-4">Lignes de facture</h3>
      <div class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr>
              <th class="w-full">Description</th>
              <th style="min-width: 90px">Qté</th>
              <th style="min-width: 130px">Prix unit. {{ currency }}</th>
              <th style="min-width: 110px" class="text-right">Total</th>
              <th style="width: 40px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in lines" :key="index">
              <td>
                <InputText
                  v-model="line.description"
                  placeholder="Description de la prestation"
                  class="w-full"
                  size="small"
                  :disabled="readonly"
                />
              </td>
              <td>
                <InputNumber
                  v-model="line.quantity"
                  :min="0"
                  :max-fraction-digits="2"
                  class="w-full"
                  size="small"
                  input-style="width:80px"
                  :disabled="readonly"
                />
              </td>
              <td>
                <InputNumber
                  v-model="line.unit_price"
                  :min="0"
                  :max-fraction-digits="2"
                  mode="currency"
                  :currency="currency"
                  locale="fr-CH"
                  class="w-full"
                  size="small"
                  input-style="width:110px"
                  :disabled="readonly"
                />
              </td>
              <td class="text-right font-mono">
                {{ formatCHF(lineTotal(line)) }}
              </td>
              <td>
                <button
                  v-if="!readonly"
                  type="button"
                  class="btn btn-xs btn-ghost"
                  @click="removeLine(index)"
                >
                  <span class="i-fa-solid-trash text-error"></span>
                </button>
              </td>
            </tr>
            <tr v-if="lines.length === 0">
              <td colspan="5" class="text-center text-base-content/40 py-4">
                Aucune ligne. Ajoutez une prestation.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!readonly" class="mt-3">
        <Button
          type="button"
          label="Ajouter une ligne"
          icon="i-fa-solid-plus"
          size="small"
          severity="secondary"
          @click="addLine"
        />
      </div>
    </div>

    <!-- TVA & Totaux -->
    <div class="card bg-base-200 p-6">
      <h3 class="font-semibold text-lg mb-4">TVA & Totaux</h3>
      <div class="flex flex-col gap-4 max-w-sm ml-auto">
        <!-- TVA toggle -->
        <div class="flex flex-col gap-3">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              v-model="form.tva_enabled"
              class="toggle toggle-primary toggle-sm"
              :disabled="readonly"
            />
            <span class="label-text font-semibold">TVA applicable</span>
          </label>
          <div v-if="form.tva_enabled" class="form-control">
            <label class="label"><span class="label-text">Taux TVA (%)</span></label>
            <InputNumber
              v-model="form.tva_rate"
              :min="0"
              :max="100"
              :max-fraction-digits="2"
              suffix=" %"
              placeholder="8.1"
              :disabled="readonly"
              class="w-full"
            />
          </div>
        </div>

        <!-- Totaux -->
        <div class="divider my-1"></div>
        <div class="flex justify-between text-sm">
          <span class="text-base-content/70">Total HT</span>
          <span class="font-mono">{{ formatCHF(totalHT) }}</span>
        </div>
        <div v-if="form.tva_enabled" class="flex justify-between text-sm">
          <span class="text-base-content/70">TVA ({{ form.tva_rate ?? 0 }}%)</span>
          <span class="font-mono">{{ formatCHF(totalTVA) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base border-t border-base-300 pt-2">
          <span>Total TTC</span>
          <span class="font-mono">{{ formatCHF(totalTTC) }}</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="card bg-base-200 p-6">
      <h3 class="font-semibold text-lg mb-4">Notes</h3>
      <Textarea
        v-model="form.notes"
        placeholder="Conditions particulières, remarques..."
        :rows="3"
        :disabled="readonly"
        class="w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Select from 'primevue/select'
import type { TClient } from '@/admin/composables/useClients'
import {
  STATUS_LABELS,
  type TInvoiceForm,
  type TInvoiceLineForm,
  type TInvoiceStatus,
} from '@/admin/composables/useInvoices'

const props = defineProps<{
  clients: TClient[]
  defaultRate?: number
  readonly?: boolean
  currency?: string
}>()

const form = defineModel<TInvoiceForm>('form', { required: true })
const lines = defineModel<TInvoiceLineForm[]>('lines', { required: true })

const clientOptions = computed(() => props.clients.map(c => ({ label: c.name, value: c.id })))

const allStatusOptions: { label: string; value: TInvoiceStatus }[] = [
  { label: STATUS_LABELS.draft, value: 'draft' },
  { label: STATUS_LABELS.sent, value: 'sent' },
  { label: STATUS_LABELS.paid, value: 'paid' },
]

const statusOptions = computed(() =>
  props.readonly ? allStatusOptions.filter(o => o.value !== 'draft') : allStatusOptions,
)

const lineTotal = (line: TInvoiceLineForm) => (line.quantity || 0) * (line.unit_price || 0)

const totalHT = computed(() => lines.value.reduce((sum, l) => sum + lineTotal(l), 0))
const totalTVA = computed(() => {
  if (!form.value.tva_enabled || !form.value.tva_rate) return 0
  return totalHT.value * (form.value.tva_rate / 100)
})
const totalTTC = computed(() => totalHT.value + totalTVA.value)

const formatCHF = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: props.currency || 'CHF' }).format(
    amount,
  )

const addLine = () => {
  lines.value.push({ description: '', quantity: 1, unit_price: props.defaultRate ?? 0 })
}

const removeLine = (index: number) => {
  lines.value.splice(index, 1)
}
</script>
