<template>
  <div class="flex flex-wrap items-center gap-2">
    <MultiSelect
      v-model="selectedYears"
      :options="availableYears"
      placeholder="Toutes les années"
      :max-selected-labels="3"
      size="small"
      class="w-52"
    />
    <MultiSelect
      v-model="selectedCategories"
      :options="availableCategories"
      placeholder="Toutes les catégories"
      :max-selected-labels="3"
      size="small"
      class="w-60"
    />
    <button
      v-if="hasActiveFilters"
      class="btn btn-xs btn-ghost text-base-content/50"
      title="Réinitialiser les filtres"
      @click="reset"
    >
      <span class="i-fa-solid-xmark"></span>
      Réinitialiser
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MultiSelect from 'primevue/multiselect'

const selectedYears = defineModel<number[]>('selectedYears', { default: () => [] })
const selectedCategories = defineModel<string[]>('selectedCategories', { default: () => [] })

defineProps<{
  availableYears: number[]
  availableCategories: string[]
}>()

const hasActiveFilters = computed(
  () => selectedYears.value.length > 0 || selectedCategories.value.length > 0,
)

const reset = () => {
  selectedYears.value = []
  selectedCategories.value = []
}
</script>
