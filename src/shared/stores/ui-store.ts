import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  demoMode: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  toggleDemoMode: () => void
  setDemoMode: (on: boolean) => void
}

// Read persisted demo mode preference
const DEMO_MODE_KEY = 'flowstack-demo-mode'
const persistedDemoMode = (() => {
  try { return localStorage.getItem(DEMO_MODE_KEY) === 'true' } catch { return true }
})()

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  demoMode: persistedDemoMode,

  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setSidebarMobileOpen: (open) =>
    set({ sidebarMobileOpen: open }),

  toggleDemoMode: () =>
    set((s) => {
      const next = !s.demoMode
      try { localStorage.setItem(DEMO_MODE_KEY, String(next)) } catch { /* noop */ }
      return { demoMode: next }
    }),

  setDemoMode: (on) =>
    set(() => {
      try { localStorage.setItem(DEMO_MODE_KEY, String(on)) } catch { /* noop */ }
      return { demoMode: on }
    }),
}))
