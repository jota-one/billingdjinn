<template>
  <template v-if="isAdmin">
    <li class="text-md font-semibold text-white cursor-pointer">
      <a href="/admin">Admin</a>
    </li>
  </template>
</template>

<script setup lang="ts">
import useAuth from '@admin/composables/useAuth'

const { isAdmin } = useAuth()
</script>
