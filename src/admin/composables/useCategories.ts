import { ref } from 'vue'
import PocketBase from 'pocketbase'
import config from '@/config'
import type { TCategory } from '@/admin/types/category'
import type { TAllocationKey } from '@/admin/types/allocation-key'

export default function useCategories() {
  const pb = new PocketBase(config.apiBaseUrl)
  const categories = ref<TCategory[]>([])

  const loadCategories = async () => {
    categories.value = await pb.collection<TCategory>('categories').getFullList({ sort: 'name' })
  }

  const createCategory = async (name: string, patterns: string[]): Promise<TCategory> => {
    const record = await pb.collection<TCategory>('categories').create({ name, patterns })
    await loadCategories()
    return record
  }

  const updateCategory = async (
    id: string,
    name: string,
    patterns: string[],
    allocationKeys?: TAllocationKey[],
  ): Promise<TCategory> => {
    const record = await pb
      .collection<TCategory>('categories')
      .update<TCategory>(id, { name, patterns, allocation_keys: allocationKeys ?? [] })
    await loadCategories()
    return record
  }

  const deleteCategory = async (id: string): Promise<void> => {
    await pb.collection('categories').delete(id)
    await loadCategories()
  }

  return { categories, loadCategories, createCategory, updateCategory, deleteCategory }
}
