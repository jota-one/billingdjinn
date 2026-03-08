<template>
  <dialog ref="loginDialog" class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">Connexion</h3>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="votre@email.com"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label class="label">
            <span class="label-text">Mot de passe</span>
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div v-if="errorMessage" class="alert alert-error">
          <span>{{ errorMessage }}</span>
        </div>

        <div class="modal-action">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            {{ loading ? 'Connexion...' : 'Connexion' }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import useAuth from '@admin/composables/useAuth'

const emit = defineEmits<{
  loginSuccess: []
}>()

const { login } = useAuth()

const loginDialog = useTemplateRef<HTMLDialogElement>('loginDialog')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const open = () => {
  loginDialog.value?.showModal()
  email.value = ''
  password.value = ''
  errorMessage.value = ''
}

const close = () => {
  loginDialog.value?.close()
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  const result = await login({
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (typeof result === 'string') {
    // Succès - result est le token
    emit('loginSuccess')
    close()

    // Vérifier s'il y a une URL de retour sauvegardée
    const returnUrl = sessionStorage.getItem('returnUrl')
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl')
      window.location.href = returnUrl
    }
    // Si pas d'URL de retour et qu'on est sur la homepage, recharger
    else if (window.location.pathname === '/') {
      window.location.reload()
    }
  } else if (result.error) {
    errorMessage.value = result.message || 'Erreur lors de la connexion'
  }
}

defineExpose({
  open,
  close,
})
</script>
