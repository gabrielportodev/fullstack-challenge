'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

export default function Home() {
  const { accessToken, isLoading, initiateLogin } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (accessToken) {
      router.replace('/games/crash-games')
    }
  }, [accessToken, router])

  return (
    <div className='flex h-screen flex-col items-center justify-center gap-6 bg-zinc-950'>
      <h1 className='text-4xl font-bold tracking-tight text-white'>Crash Game</h1>

      {isLoading ? (
        <div className='h-6 w-6 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
      ) : (
        <button
          onClick={initiateLogin}
          className='rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400'
        >
          Entrar para jogar
        </button>
      )}
    </div>
  )
}
