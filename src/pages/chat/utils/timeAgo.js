export function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  const M = Math.floor(d / 30)
  const Y = Math.floor(d / 365)
  if (s < 60) return `${s}s`
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d < 30) return `${d}d`
  if (M < 12) return `${M}M`
  return `${Y}Y`
}
