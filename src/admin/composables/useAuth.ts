import { useSessionStorage } from '@vueuse/core'
import PocketBase from 'pocketbase'
import { ref, computed } from 'vue'
import config from '@/config'

const pb = new PocketBase(config.apiBaseUrl)

const userJwt = useSessionStorage('userJwt', '')
const impersonatorJwt = useSessionStorage('impersonatorJwt', '')
const user = ref<any>({})

// Si pb.authStore (localStorage) a été vidé mais que sessionStorage a encore le JWT,
// on restaure pb.authStore pour que isValid et les appels authentifiés fonctionnent.
// On décode le JWT pour avoir un model minimal (id) et déclencher loadUserWithRoles via onChange.
if (userJwt.value && !pb.authStore.isValid) {
  try {
    const payload = JSON.parse(atob(userJwt.value.split('.')[1]))
    pb.authStore.save(userJwt.value, {
      id: payload.id,
      collectionId: '_pb_users_auth_',
      collectionName: 'users',
    } as any)
  } catch {
    pb.authStore.save(userJwt.value, null)
  }
}

// Charge l'utilisateur avec expand:roles pour déterminer les slugs
const loadUserWithRoles = async (model: any) => {
  if (!model?.id) {
    return
  }
  try {
    const full = await pb.collection('users').getOne(model.id, {
      expand: 'roles',
    })
    user.value = full
  } catch (e) {
    console.error('Failed to load user with roles', e)
    user.value = model // fallback minimal
  }
}

pb.authStore.onChange((_, model) => {
  if (model !== null) {
    void loadUserWithRoles(model)
  }
}, true)

export default function useAuth() {
  const login = async (auth: { email: string; password: string }) => {
    try {
      const authData = await pb.collection('users').authWithPassword(auth.email, auth.password, {
        expand: 'roles',
      })
      userJwt.value = authData.token
      user.value = authData.record
      return authData.token
    } catch (e: any) {
      return { error: true, message: e.message }
    }
  }

  // Rafraîchit la session et recharge les rôles (utile au rechargement de page)
  const refreshAuth = async () => {
    // Restauration défensive : si pb.authStore est vide mais sessionStorage a le JWT
    if (!pb.authStore.isValid && userJwt.value) {
      pb.authStore.save(userJwt.value, null)
    }
    if (!pb.authStore.isValid) {
      return null
    }
    try {
      const data = await pb.collection('users').authRefresh({ expand: 'roles' })
      userJwt.value = data.token
      user.value = data.record
      return data
    } catch (e) {
      console.error('Auth refresh failed', e)
      return null
    }
  }

  const logout = () => {
    pb.authStore.clear()
    userJwt.value = ''
    user.value = {}
  }

  const isAuthenticated = computed(() => !!userJwt.value && userJwt.value.length > 0)
  const roles = computed(() => user.value?.expand?.roles ?? [])
  const isAdmin = computed(() => roles.value.some((r: any) => r?.slug === 'admin'))
  const isImpersonating = computed(() => !!impersonatorJwt.value)

  const impersonate = async (userId: string) => {
    const authData = await pb.send(`/api/custom/impersonate/${userId}`, { method: 'POST' })
    impersonatorJwt.value = userJwt.value
    pb.authStore.save(authData.token, authData.record)
    userJwt.value = authData.token
    window.location.href = '/'
  }

  const exitImpersonation = async () => {
    const adminJwt = impersonatorJwt.value
    impersonatorJwt.value = ''
    pb.authStore.save(adminJwt, null)
    userJwt.value = adminJwt
    await refreshAuth()
    window.location.href = '/admin'
  }

  return {
    isAuthenticated,
    isAdmin,
    isImpersonating,
    login,
    logout,
    refreshAuth,
    impersonate,
    exitImpersonation,
    pb,
    user,
    userJwt,
  }
}
