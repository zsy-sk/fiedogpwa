export function formatCoord(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(6) : '-'
}

export function resolveMediaSrc(raw) {
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/media/')) return raw
  if (raw.startsWith('/src/assets/img/')) return raw
  return raw
}
