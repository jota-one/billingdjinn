import { ref } from 'vue'
import config from '../../config'
import PocketBase from 'pocketbase'

export interface TRole {
  id: string
  name: string
  slug: string
  created: string
  updated: string
}

export default function useRoles() {
  const pb = new PocketBase(config.apiBaseUrl)

  const roles = ref<TRole[]>([])

  const loadRoles = async () => {
    roles.value = await pb.collection('roles').getFullList<TRole>({
      sort: 'name',
    })
  }

  return {
    roles,
    loadRoles,
  }
}
