<template>
  <Dialog
    :visible="modelValue"
    modal
    closable
    :style="{ width: '48rem' }"
    @update:visible="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="i-fa-solid-file-arrow-up text-xl"></span>
        <span class="font-bold">{{ title }}</span>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Export -->
      <div class="card bg-base-200 p-4">
        <h3 class="text-base font-semibold mb-3 flex items-center gap-2">
          <span class="i-fa-solid-file-export"></span>
          Export
        </h3>
        <p class="text-sm mb-4">Exporter toutes les données dans un fichier CSV.</p>
        <Button
          label="Exporter en CSV"
          icon="i-fa-solid-download"
          severity="secondary"
          :loading="isExporting"
          :disabled="isExporting || isImporting"
          @click="handleExport"
        />
      </div>

      <!-- Import -->
      <div class="card bg-base-200 p-4">
        <h3 class="text-base font-semibold mb-3 flex items-center gap-2">
          <span class="i-fa-solid-file-import"></span>
          Import
        </h3>
        <p class="text-sm mb-4">
          Importer depuis un fichier CSV. Les enregistrements existants (par ID) seront mis à jour,
          les nouveaux seront créés.
        </p>
        <div class="mb-4">
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv"
            class="file-input file-input-bordered w-full"
            @change="handleFileSelect"
          />
        </div>
        <Button
          label="Importer le fichier"
          icon="i-fa-solid-upload"
          :loading="isImporting"
          :disabled="!selectedFile || isExporting || isImporting"
          @click="handleImport"
        />
      </div>

      <!-- Results -->
      <div v-if="importResult" class="card bg-base-200 p-4">
        <h3 class="text-base font-semibold mb-3 flex items-center gap-2">
          <span class="i-fa-solid-clipboard-check"></span>
          Résultats
        </h3>
        <div class="alert alert-info mb-3">
          <span class="i-fa-solid-list-check"></span>
          <span>
            {{ importResult.processed }} {{ entityLabel }} traité(s) —
            {{ importResult.created }} créé(s), {{ importResult.updated }} mis à jour,
            {{ importResult.unchanged }} inchangé(s)
          </span>
        </div>
        <div v-if="importResult.errors.length === 0" class="alert alert-success">
          <span class="i-fa-solid-check-circle"></span>
          <span>Import terminé sans erreur</span>
        </div>
        <div v-else class="space-y-2">
          <div class="alert alert-error">
            <span class="i-fa-solid-triangle-exclamation"></span>
            <span>{{ importResult.errors.length }} erreur(s)</span>
          </div>
          <div class="overflow-auto max-h-60">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Entrée</th>
                  <th>Erreur</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="err in importResult.errors" :key="err.line">
                  <td>{{ err.line }}</td>
                  <td>{{ err.name }}</td>
                  <td class="text-error">{{ err.error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Help -->
      <div class="card bg-base-100 border border-base-300 p-4">
        <h3 class="text-sm font-semibold mb-2 flex items-center gap-2">
          <span class="i-fa-solid-circle-info"></span>
          Format attendu
        </h3>
        <div class="text-xs space-y-1">
          <p>
            <strong>Colonnes :</strong> <code>{{ columns.join(', ') }}</code>
          </p>
          <p v-if="helpText">{{ helpText }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Fermer"
        severity="secondary"
        :disabled="isExporting || isImporting"
        @click="$emit('update:modelValue', false)"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import type { ImportResult } from '../types/import-export'

const props = defineProps<{
  modelValue: boolean
  title: string
  entityLabel: string
  columns: string[]
  helpText?: string
  isExporting: boolean
  isImporting: boolean
  exportFn: () => Promise<void>
  importFn: (file: File) => Promise<ImportResult>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const toast = useToast()
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const importResult = ref<ImportResult | null>(null)

const handleFileSelect = (e: Event) => {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
  importResult.value = null
}

const handleExport = async () => {
  try {
    await props.exportFn()
    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: 'Fichier CSV téléchargé',
      life: 3000,
    })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: "Erreur d'export", detail: e.message, life: 5000 })
  }
}

const handleImport = async () => {
  if (!selectedFile.value) {
    return
  }
  if (!selectedFile.value.name.endsWith('.csv')) {
    toast.add({
      severity: 'error',
      summary: 'Format invalide',
      detail: 'Fichier .csv attendu',
      life: 4000,
    })
    return
  }
  try {
    const result = await props.importFn(selectedFile.value)
    importResult.value = result
    const summary = `${result.processed} traité(s) — ${result.created} créé(s), ${result.updated} mis à jour, ${result.unchanged} inchangé(s)`
    if (result.errors.length === 0) {
      toast.add({ severity: 'success', summary: 'Import terminé', detail: summary, life: 5000 })
      emit('saved')
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Import partiel',
        detail: `${summary} — ${result.errors.length} erreur(s)`,
        life: 6000,
      })
    }
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    selectedFile.value = null
  } catch (e: any) {
    toast.add({ severity: 'error', summary: "Erreur d'import", detail: e.message, life: 5000 })
  }
}
</script>
