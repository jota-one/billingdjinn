<template>
  <div class="p-8">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span class="i-fa-solid-users text-xl"></span>
      Clients
    </h2>
    <div class="card">
      <div class="flex justify-end mb-2">
        <RouterLink to="/clients/new">
          <Button label="Nouveau client" icon="i-fa-solid-plus" size="small" />
        </RouterLink>
      </div>
      <DataTable :value="clients" sort-field="name" :sort-order="1" table-style="min-width: 50rem">
        <Column field="name" header="Nom" sortable>
          <template #body="{ data }">
            <RouterLink :to="`/clients/${data.id}`" class="link link-hover font-medium">
              {{ data.name }}
            </RouterLink>
          </template>
        </Column>
        <Column field="contact_person" header="Contact">
          <template #body="{ data }">{{ data.contact_person || '—' }}</template>
        </Column>
        <Column field="email" header="Email">
          <template #body="{ data }">{{ data.email || '—' }}</template>
        </Column>
        <Column field="phone" header="Téléphone">
          <template #body="{ data }">{{ data.phone || '—' }}</template>
        </Column>
        <Column field="date_acquisition" header="Client depuis" sortable>
          <template #body="{ data }">{{ formatDate(data.date_acquisition) }}</template>
        </Column>
        <Column header="CA annuel" style="width: 110px;">
          <template #body>—</template>
        </Column>
        <Column header="CA cumulé" style="width: 110px;">
          <template #body>—</template>
        </Column>
        <Column header="Dernière facture" style="width: 140px;">
          <template #body>—</template>
        </Column>
        <Column header="Actions" style="width: 90px;">
          <template #body="{ data }">
            <div class="flex gap-2">
              <RouterLink :to="`/clients/${data.id}`">
                <button class="btn btn-xs btn-ghost" title="Modifier">
                  <span class="i-fa-solid-pen"></span>
                </button>
              </RouterLink>
              <button class="btn btn-xs btn-ghost" title="Supprimer" @click="confirmDelete(data)">
                <span class="i-fa-solid-trash"></span>
              </button>
            </div>
          </template>
        </Column>
        <template #footer>{{ clients.length }} client{{ clients.length !== 1 ? 's' : '' }}</template>
      </DataTable>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer le client ?"
      :message="deleteMessage"
      @confirm="deleteConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ConfirmModal from '../components/ConfirmModal.vue'
import useClients from '../composables/useClients'
import type { TClient } from '../composables/useClients'

const { clients, loadClients, deleteClient } = useClients()

const showDeleteModal = ref(false)
const clientToDelete = ref<TClient | null>(null)
const deleteMessage = ref('')

const formatDate = (date?: string) => {
  if (!date) return '—'
  return dayjs(date).format('DD.MM.YYYY')
}

const confirmDelete = (client: TClient) => {
  clientToDelete.value = client
  deleteMessage.value = `Voulez-vous vraiment supprimer le client "${client.name}" ? Cette action est irréversible.`
  showDeleteModal.value = true
}

const deleteConfirmed = async () => {
  if (!clientToDelete.value) return
  await deleteClient(clientToDelete.value.id)
  await loadClients()
  showDeleteModal.value = false
  clientToDelete.value = null
}

onMounted(loadClients)
</script>
