export const fmtBRL = (cents: number) =>
  'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtMult = (v: number) => v.toFixed(2) + 'x'

export const multColor = (v: number) => (v < 2 ? 'text-red-400' : v < 5 ? 'text-amber-400' : 'text-emerald-400')

export const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#0891b2', '#0d9488', '#d97706', '#b45309', '#059669']

export const avatarColor = (name: string): string => {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
