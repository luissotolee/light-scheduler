export function downloadTextFile(
  filename: string,
  text: string,
  mime = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function timestampedName(base: string, ext: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${base}-${stamp}.${ext}`
}
