'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

export function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const handleCallback = useAuthStore(s => s.handleCallback)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) {
      console.error('Keycloak error:', params.get('error_description'))
      router.replace('/')
      return
    }

    if (!code || !state) {
      router.replace('/')
      return
    }

    handleCallback(code, state)
      .then(() => router.replace('/'))
      .catch(err => {
        console.error('Auth callback failed:', err)
        router.replace('/')
      })
  }, [params, handleCallback, router])

  return (
    <div className='flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
      <p className='text-sm text-zinc-400'>Autenticando...</p>
    </div>
  )
}
