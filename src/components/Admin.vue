<template>
  <Sidebar>
    <router-view></router-view>
  </Sidebar>
</template>

<script setup lang="ts">
import { onBeforeMount, getCurrentInstance, type App } from 'vue'
import router from '@/admin/router'
import Sidebar from '@/admin/layouts/Sidebar.vue'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

onBeforeMount(() => {
  const app = getCurrentInstance()?.appContext.app as App
  app.directive('focus', {
    mounted(el) {
      el.focus()
    },
  })
  app.use(router)
  app.use(ToastService)
  app.directive('tooltip', Tooltip)
})
</script>
