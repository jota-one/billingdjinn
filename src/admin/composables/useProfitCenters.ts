import { ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '@/config'
import type { TProfitCenter } from '@/admin/types/profit-center'

export default function useProfitCenters() {
  const pb = new PocketBase(config.apiBaseUrl)
  const profitCenters = ref<TProfitCenter[]>([])

  const loadProfitCenters = async () => {
    profitCenters.value = await pb
      .collection<TProfitCenter>('profit_centers')
      .getFullList({ sort: 'name' })
  }

  const createProfitCenter = async (name: string, color: string): Promise<TProfitCenter> => {
    const record = await pb.collection<TProfitCenter>('profit_centers').create({ name, color })
    await loadProfitCenters()
    return record
  }

  const updateProfitCenter = async (
    id: string,
    name: string,
    color: string,
  ): Promise<TProfitCenter> => {
    const record = await pb
      .collection<TProfitCenter>('profit_centers')
      .update<TProfitCenter>(id, { name, color })
    await loadProfitCenters()
    return record
  }

  const deleteProfitCenter = async (id: string): Promise<void> => {
    await pb.collection('profit_centers').delete(id)
    await loadProfitCenters()
  }

  return {
    profitCenters,
    loadProfitCenters,
    createProfitCenter,
    updateProfitCenter,
    deleteProfitCenter,
  }
}
