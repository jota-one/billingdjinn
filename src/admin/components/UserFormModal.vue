<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="userId ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'"
    class="w-[50%]"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="email" class="font-semibold">Email *</label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          placeholder="email@example.com"
          required
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="name" class="font-semibold">Nom complet</label>
        <InputText id="name" v-model="form.name" placeholder="Prénom Nom" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="password" class="font-semibold">
          {{ userId ? 'Nouveau mot de passe' : 'Mot de passe *' }}
        </label>
        <Password
          id="password"
          v-model="form.password"
          :placeholder="userId ? 'Laisser vide pour ne pas changer' : 'Mot de passe'"
          :feedback="false"
          toggleMask
          :required="!userId"
        />
        <p v-if="userId" class="text-sm text-gray-500">
          Laissez vide si vous ne voulez pas changer le mot de passe
        </p>
      </div>

      <div v-if="!userId || form.password" class="flex flex-col gap-2">
        <label for="passwordConfirm" class="font-semibold">
          {{ userId ? 'Confirmer le mot de passe' : 'Confirmer le mot de passe *' }}
        </label>
        <Password
          id="passwordConfirm"
          v-model="form.passwordConfirm"
          placeholder="Confirmer le mot de passe"
          :feedback="false"
          toggleMask
          :required="!userId"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="roles" class="font-semibold">Rôles</label>
        <MultiSelect
          id="roles"
          v-model="form.roles"
          :options="roles"
          optionLabel="name"
          optionValue="id"
          placeholder="Sélectionner des rôles"
          :loading="rolesLoading"
          display="chip"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="avatar" class="font-semibold">Avatar</label>
        <div v-if="currentAvatar" class="flex items-center gap-2 mb-2">
          <img
            :src="currentAvatar"
            alt="Avatar actuel"
            class="w-16 h-16 rounded-full object-cover"
          />
          <span class="text-sm text-gray-500">Avatar actuel</span>
        </div>
        <FileUpload
          mode="basic"
          accept="image/*"
          :maxFileSize="1000000"
          :chooseLabel="userId ? 'Changer l\'avatar' : 'Choisir un avatar'"
          @select="onAvatarSelect"
        />
        <p v-if="form.avatar" class="text-sm text-gray-500">
          {{ userId ? 'Nouveau fichier sélectionné' : 'Fichier sélectionné' }} :
          {{ form.avatar.name }}
        </p>
      </div>
    </div>

    <PbErrorToast />

    <template #footer>
      <div class="flex justify-end gap-2 pt-4">
        <Button type="button" label="Annuler" severity="secondary" @click="visible = false" />
        <Button type="button" label="Enregistrer" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import MultiSelect from 'primevue/multiselect'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import useUsers from '@/admin/composables/useUsers'
import type { TUserForm } from '@/admin/composables/useUsers'
import useRoles from '@/admin/composables/useRoles'
import PbErrorToast from './PbErrorToast.vue'
import usePbErrorToast from '@/admin/composables/usePbErrorToast'

const props = defineProps<{ userId?: string }>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>({ required: true })

const { addUser, updateUser, loadUser, getAvatarUrl } = useUsers()
const { roles, loadRoles } = useRoles()
const { showPbError } = usePbErrorToast()
const saving = ref(false)
const rolesLoading = ref(false)
const currentAvatar = ref('')

const emptyForm = (): TUserForm => ({
  email: '',
  emailVisibility: true,
  password: '',
  passwordConfirm: '',
  name: '',
  avatar: null,
  roles: [],
})

const form = ref<TUserForm>(emptyForm())

const onAvatarSelect = (event: FileUploadSelectEvent) => {
  const files = event.files
  if (files && files.length > 0) {
    form.value.avatar = files[0]
  }
}

const save = async () => {
  if (!form.value.email || (!props.userId && !form.value.password)) {
    alert('Veuillez remplir tous les champs obligatoires')
    return
  }

  if (form.value.password && form.value.password !== form.value.passwordConfirm) {
    alert('Les mots de passe ne correspondent pas')
    return
  }

  saving.value = true

  try {
    if (props.userId) {
      await updateUser(props.userId, form.value)
    } else {
      await addUser(form.value)
      form.value = emptyForm()
    }
    emit('saved')
    visible.value = false
  } catch (err) {
    showPbError(err)
  } finally {
    saving.value = false
  }
}

watch(
  visible,
  async isVisible => {
    if (!isVisible) {
      if (!props.userId) {
        form.value = emptyForm()
      }
      return
    }

    rolesLoading.value = true
    try {
      await loadRoles()
    } finally {
      rolesLoading.value = false
    }

    if (props.userId) {
      const user = await loadUser(props.userId)
      form.value = {
        email: user.email,
        emailVisibility: true,
        password: '',
        passwordConfirm: '',
        name: user.name || '',
        avatar: null,
        roles: user.roles || [],
      }
      currentAvatar.value = getAvatarUrl(user)
    }
  },
  { immediate: true },
)

watch(
  () => props.userId,
  async id => {
    if (id && visible.value) {
      const user = await loadUser(id)
      form.value = {
        email: user.email,
        emailVisibility: true,
        password: '',
        passwordConfirm: '',
        name: user.name || '',
        avatar: null,
        roles: user.roles || [],
      }
      currentAvatar.value = getAvatarUrl(user)
    }
  },
)
</script>
