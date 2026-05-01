interface SeedHashProps {
  hash: string
}

export function SeedHash({ hash }: SeedHashProps) {
  return (
    <div className='mx-3 mb-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700'>
      <p className='text-[10px] uppercase tracking-wider text-zinc-500 mb-1'>Seed Hash (Provably Fair)</p>
      <p className='font-mono text-[9px] text-zinc-400 break-all leading-relaxed'>{hash}</p>
    </div>
  )
}
