<template>
  <div class="flex flex-col gap-5">
    <!-- En-tête -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">En-tête</p>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="key in headerKeys" :key="key" class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS[key] }}</span></label
          >
          <InputText
            :model-value="modelValue[key] ?? ''"
            @update:model-value="update(key, $event)"
            :placeholder="placeholders[key]"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Métadonnées -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">
        Métadonnées
      </p>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="key in metaKeys" :key="key" class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS[key] }}</span></label
          >
          <InputText
            :model-value="modelValue[key] ?? ''"
            @update:model-value="update(key, $event)"
            :placeholder="placeholders[key]"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Colonnes du tableau -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">
        Colonnes du tableau
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="key in colKeys" :key="key" class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS[key] }}</span></label
          >
          <InputText
            :model-value="modelValue[key] ?? ''"
            @update:model-value="update(key, $event)"
            :placeholder="placeholders[key]"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Sections -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">
        Sections
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div v-for="key in sectionKeys" :key="key" class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS[key] }}</span></label
          >
          <InputText
            :model-value="modelValue[key] ?? ''"
            @update:model-value="update(key, $event)"
            :placeholder="placeholders[key]"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Totaux -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">Totaux</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div v-for="key in totalKeys" :key="key" class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS[key] }}</span></label
          >
          <InputText
            :model-value="modelValue[key] ?? ''"
            @update:model-value="update(key, $event)"
            :placeholder="placeholders[key]"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Paiement -->
    <div>
      <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">
        Paiement
      </p>
      <div class="flex flex-col gap-3">
        <div class="form-control">
          <label class="label"
            ><span class="label-text text-xs">{{ KEY_LABELS.iban }}</span></label
          >
          <InputText
            :model-value="modelValue.iban ?? ''"
            @update:model-value="update('iban', $event)"
            :placeholder="placeholders.iban"
            class="w-full"
            size="small"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text text-xs">{{ KEY_LABELS.payment_mention }}</span>
            <span class="label-text-alt text-base-content/40">Variable&nbsp;: {date}</span>
          </label>
          <InputText
            :model-value="modelValue.payment_mention ?? ''"
            @update:model-value="update('payment_mention', $event)"
            :placeholder="placeholders.payment_mention"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { DEFAULT_LABELS } from '@/admin/utils/invoice-labels'
import type { TInvoiceLabels } from '@/admin/types/invoice-labels'

const props = withDefaults(
  defineProps<{
    modelValue: TInvoiceLabels
    placeholders?: Required<TInvoiceLabels>
  }>(),
  {
    placeholders: () => ({ ...DEFAULT_LABELS }),
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: TInvoiceLabels]
}>()

const headerKeys: (keyof TInvoiceLabels)[] = ['invoice_title', 'draft']
const metaKeys: (keyof TInvoiceLabels)[] = ['date', 'due_date']
const colKeys: (keyof TInvoiceLabels)[] = [
  'col_description',
  'col_qty',
  'col_unit_price',
  'col_total',
]
const sectionKeys: (keyof TInvoiceLabels)[] = ['section_attention', 'section_notes']
const totalKeys: (keyof TInvoiceLabels)[] = ['total_ht', 'total_tva', 'total_ttc']

const KEY_LABELS: Record<keyof TInvoiceLabels, string> = {
  invoice_title: 'Titre',
  draft: 'Brouillon',
  date: 'Date',
  due_date: 'Échéance',
  iban: 'IBAN (préfixe)',
  col_description: 'Description',
  col_qty: 'Quantité',
  col_unit_price: 'Prix unit.',
  col_total: 'Total',
  section_attention: "À l'attention de",
  section_notes: 'Notes',
  total_ht: 'Total HT',
  total_tva: 'TVA',
  total_ttc: 'Total TTC',
  payment_mention: 'Mention de paiement',
}

const update = (key: keyof TInvoiceLabels, val: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
</script>
