import { create } from 'zustand'

const useAuthStore = create((set) => ({
  isUnlocked: false,
  isVaultInitialized: null,

  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
  setVaultInitialized: (value) => set({ isVaultInitialized: value })
}))

window.api
  .isVaultInitialized()
  .then((status) => useAuthStore.getState().setVaultInitialized(status))
  .catch(() => useAuthStore.getState().setVaultInitialized(false))

export default useAuthStore
