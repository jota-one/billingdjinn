<template>
  <div class="flex gap-5 items-center">
    <template v-if="!isAuthenticated">
      <button
        class="btn btn-primary px-5 py-2 font-semibold rounded-lg cursor-pointer"
        @click="openLoginModal"
      >
        Connexion
      </button>
      <LoginModal ref="loginModalRef" @login-success="handleLoginSuccess" />
    </template>
    <template v-else>
      <div class="dropdown dropdown-end">
        <button
          tabindex="0"
          role="button"
          class="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
        >
          <div v-if="avatarUrl" class="flex-shrink-0">
            <img
              :src="avatarUrl"
              :alt="user.name"
              class="w-10 h-10 rounded-full object-cover border border-white/30"
            />
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium text-white/70 uppercase tracking-wide">Connecté(e)</span>
            <span class="text-sm font-semibold text-white">{{ user.name }}</span>
          </div>
          <span class="i-fa-solid-chevron-down text-xs text-white/70"></span>
        </button>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-white shadow-lg rounded-box z-[1] w-56 p-2 border border-gray-200 mt-3"
        >
          <li>
            <a href="/profile" class="flex items-center gap-3 text-gray-700 hover:bg-gray-100">
              <span class="i-fa-solid-user text-base"></span>
              <span>Mon compte</span>
            </a>
          </li>
          <li v-if="isImpersonating">
            <button
              @click="exitImpersonation"
              class="flex items-center gap-3 text-amber-600 hover:bg-amber-50 w-full text-left"
            >
              <span class="i-fa-solid-user-secret text-base"></span>
              <span>Reprendre mon compte</span>
            </button>
          </li>
          <li>
            <button
              @click="handleLogout"
              class="flex items-center gap-3 text-red-600 hover:bg-red-50 w-full text-left"
            >
              <span class="i-fa-solid-sign-out-alt text-base"></span>
              <span>Déconnexion</span>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTemplateRef } from 'vue'
import useAuth from '@admin/composables/useAuth'
import config from '@config'
import LoginModal from './LoginModal.vue'

const { isAuthenticated, isImpersonating, user, logout, exitImpersonation } = useAuth()
const loginModalRef = useTemplateRef<InstanceType<typeof LoginModal>>('loginModalRef')

const avatarUrl = computed(() => {
  if (!user.value?.avatar) return ''
  return `${config.apiBaseUrl}/api/files/users/${user.value.id}/${user.value.avatar}`
})

const openLoginModal = () => {
  loginModalRef.value?.open()
}

const handleLoginSuccess = () => {
  // Réactivité automatique
}

const handleLogout = () => {
  logout()
  window.location.reload()
}
</script>
