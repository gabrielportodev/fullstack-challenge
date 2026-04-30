import { Suspense } from 'react'
import { CallbackHandler } from './callback-handler'

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center bg-zinc-950'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500' />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
