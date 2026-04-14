<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/clients" class="btn btn-ghost btn-sm">
        <span class="i-fa-solid-arrow-left"></span>
      </RouterLink>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="i-fa-solid-user-pen text-xl"></span>
        Modifier le client
      </h2>
    </div>
    <ClientForm :client-id="clientId" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import ClientForm from '@/admin/components/ClientForm.vue'

const route = useRoute()
const clientId = route.params.id as string
</script>
