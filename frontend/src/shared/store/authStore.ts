// src/shared/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  firstName?: string // Added this
  lastName?: string  // Added this
  role?: string
}

interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'caresync-auth',
    }
  )
)
