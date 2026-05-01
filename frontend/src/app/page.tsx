'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/game')
  }, [router])

  return (
    <div className='flex h-screen items-center justify-center bg-zinc-950'>
      <div className='h-6 w-6 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
    </div>
  )
}
