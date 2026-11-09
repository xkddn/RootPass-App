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
  .then((status) => {
    setTimeout(() => useAuthStore.getState().setVaultInitialized(status), 2000) // ← temp
  })
  .catch(() => useAuthStore.getState().setVaultInitialized(false))

export default useAuthStore

