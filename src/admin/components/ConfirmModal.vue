<template>
  <Dialog v-model:visible="visible" modal :header="title" class="w-[24rem]">
    <div class="py-4">
      <p>{{ message }}</p>
    </div>
    <div class="flex justify-end gap-2 pt-4">
      <Button type="button" label="Annuler" severity="secondary" @click="visible = false" />
      <Button type="button" label="Confirmer" severity="danger" @click="confirm" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps<{
  title: string
  message: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const visible = defineModel<boolean>({ required: true })

const confirm = () => {
  emit('confirm')
  visible.value = false
}
</script>
