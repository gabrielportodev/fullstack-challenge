'use client'

import { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore(s => s.restoreSession)
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    restoreSession()
  }, [restoreSession])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
