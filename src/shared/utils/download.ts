export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadTextFile(
  filename: string,
  text: string,
  mime = 'text/csv;charset=utf-8',
): void {
  downloadBlob(filename, new Blob([text], { type: mime }))
}

export function timestampedName(base: string, ext: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${base}-${stamp}.${ext}`
}
