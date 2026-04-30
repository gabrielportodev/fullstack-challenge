'use client'

import { useAuthStore } from '@/stores/auth.store'

export default function Home() {
  const { accessToken, user, isLoading, initiateLogin, logout } = useAuthStore()

  return (
    <div className='flex h-screen flex-col items-center justify-center gap-6 bg-zinc-950'>
      <h1 className='text-4xl font-bold tracking-tight text-white'>Crash Game</h1>

      {isLoading ? (
        <div className='h-6 w-6 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
      ) : accessToken ? (
        <div className='flex flex-col items-center gap-3'>
          <p className='text-zinc-400'>
            Logado como <span className='font-semibold text-white'>{user?.preferred_username}</span>
          </p>
          <button
            onClick={logout}
            className='rounded-lg border border-zinc-700 px-6 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800'
          >
            Sair
          </button>
        </div>
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
