<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span class="i-fa-solid-users"></span>
      Utilisateurs
    </h2>
    <div class="card">
      <div class="flex justify-end mb-2">
        <Button
          label="Ajouter un utilisateur"
          icon="i-fa-solid-plus"
          size="small"
          @click="openAddModal"
        />
      </div>
      <DataTable :value="users" sortField="created" :sortOrder="-1" tableStyle="min-width: 50rem">
        <Column style="width: 80px;" :header="''">
          <template #body="slotProps">
            <img
              v-if="slotProps.data.avatar"
              :src="getAvatarUrl(slotProps.data)"
              :alt="slotProps.data.email"
              class="w-12 h-12 object-cover rounded-full"
            />
            <div v-else class="w-12 h-12 bg-base-300 rounded-full flex items-center justify-center">
              <span class="i-fa-solid-user text-xl"></span>
            </div>
          </template>
        </Column>
        <Column field="name" header="Nom" sortable>
          <template #body="slotProps">
            {{ slotProps.data.name || '-' }}
          </template>
        </Column>
        <Column field="email" header="Email" sortable>
          <template #body="slotProps">
            {{ slotProps.data.email }}
          </template>
        </Column>
        <Column field="roles" header="Rôles">
          <template #body="slotProps">
            <div v-if="slotProps.data.expand?.roles?.length" class="flex flex-wrap gap-1">
              <span
                v-for="role in slotProps.data.expand.roles"
                :key="role.id"
                class="badge badge-primary badge-sm"
              >
                {{ role.name }}
              </span>
            </div>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>
        <Column field="verified" header="Vérifié" sortable>
          <template #body="slotProps">
            <span v-if="slotProps.data.verified" class="badge badge-success badge-sm">
              Vérifié
            </span>
            <span v-else class="badge badge-warning badge-sm">Non vérifié</span>
          </template>
        </Column>
        <Column field="created" header="Créé le" sortable>
          <template #body="slotProps">
            <span>{{ formatDate(slotProps.data.created) }}</span>
          </template>
        </Column>
        <Column header="Actions" style="width: 120px;">
          <template #body="slotProps">
            <div class="flex gap-2">
              <button
                class="btn btn-xs btn-ghost"
                title="Modifier"
                @click="editUser(slotProps.data)"
              >
                <span class="i-fa-solid-pen"></span>
              </button>
              <button
                class="btn btn-xs btn-ghost"
                title="Supprimer"
                @click="confirmDelete(slotProps.data)"
              >
                <span class="i-fa-solid-trash"></span>
              </button>
              <button
                v-if="slotProps.data.id !== currentUser?.id"
                class="btn btn-xs btn-ghost"
                title="Impersonate"
                @click="impersonate(slotProps.data.id)"
              >
                <span class="i-fa-solid-user-secret"></span>
              </button>
            </div>
          </template>
        </Column>
        <template #footer>Nombre total d'utilisateurs : {{ users ? users.length : 0 }}</template>
      </DataTable>
    </div>
    <UserAddModal v-model="showAddModal" @saved="loadUsers" />
    <UserEditModal
      v-if="editedUser?.id"
      v-model="showEditModal"
      :user-id="editedUser.id"
      @saved="loadUsers"
    />
    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer l'utilisateur ?"
      :message="deleteMessage"
      @confirm="deleteUserConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import useUsers from '../composables/useUsers'
import useAuth from '../composables/useAuth'
import type { TUser } from '../composables/useUsers'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import UserAddModal from '../components/UserAddModal.vue'
import UserEditModal from '../components/UserEditModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const { users, loadUsers, deleteUser, getAvatarUrl } = useUsers()
const { user: currentUser, impersonate } = useAuth()
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editedUser = ref<TUser | null>(null)
const deleteMessage = ref('')

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('DD MMM YYYY, HH:mm')
}

const openAddModal = () => {
  showAddModal.value = true
}

const editUser = (user: TUser) => {
  editedUser.value = user
  showEditModal.value = true
}

const confirmDelete = (user: TUser) => {
  editedUser.value = user
  deleteMessage.value = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.email}" ?`
  showDeleteModal.value = true
}

const deleteUserConfirmed = async () => {
  if (!editedUser.value) return
  try {
    await deleteUser(editedUser.value.id)
    await loadUsers()
    showDeleteModal.value = false
    editedUser.value = null
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
}

onMounted(loadUsers)
</script>
