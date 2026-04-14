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
    <ClientForm />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClientForm from '@/admin/components/ClientForm.vue'
</script>
