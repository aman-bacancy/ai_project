import { create } from 'zustand'
import type { FilterState, Priority, TaskStatus } from '@/types/app.types'

interface FilterStore {
  filters: Record<string, FilterState>
  getFilters: (viewKey: string) => FilterState
  setFilter: <K extends keyof FilterState>(viewKey: string, key: K, value: FilterState[K]) => void
  resetFilters: (viewKey: string) => void
}

const defaultFilters: FilterState = {
  assignees: [],
  statuses: [],
  priorities: [],
  tags: [],
  dueDateFrom: null,
  dueDateTo: null,
  search: '',
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: {},

  getFilters: (viewKey) => get().filters[viewKey] ?? defaultFilters,

  setFilter: (viewKey, key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [viewKey]: { ...(state.filters[viewKey] ?? defaultFilters), [key]: value },
      },
    })),

  resetFilters: (viewKey) =>
    set((state) => ({
      filters: { ...state.filters, [viewKey]: defaultFilters },
    })),
}))
