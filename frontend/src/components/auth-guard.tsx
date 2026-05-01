'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { accessToken, isLoading, initiateLogin } = useAuthStore()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='h-6 w-6 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
      </div>
    )
  }

  if (!accessToken) {
    return (
      fallback ?? (
        <div className='flex items-center justify-center'>
          <Button
            onClick={initiateLogin}
            className='rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400'
          >
            Entrar para jogar
          </Button>
        </div>
      )
    )
  }

  return <>{children}</>
}
