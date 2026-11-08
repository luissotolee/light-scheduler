export function readStorageValue(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorageValue(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStorageValue(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(key)
  } catch {
    // Persistence is best effort; the in-memory state remains authoritative.
  }
}

export function readJson<T>(key: string, validate: (value: unknown) => T | null): T | null {
  const raw = readStorageValue(key)
  if (raw === null) return null

  try {
    return validate(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeStorageValue(key, JSON.stringify(value))
  } catch {
    // Persistence is best effort; serialization failures never surface.
  }
}
