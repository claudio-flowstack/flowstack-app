import type { StorageAdapter } from './types'

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix = 'flowstack') {
    this.prefix = prefix
  }

  private key(k: string): string {
    return `${this.prefix}-${k}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.key(key))
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      console.warn(`[Storage] Failed to read key: ${key}`)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(value))
    } catch (e) {
      console.error(`[Storage] Failed to write key: ${key}`, e)
      throw new Error(`Storage write failed for ${key}`)
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.key(key))
  }

  async keys(): Promise<string[]> {
    const result: string[] = []
    const prefixWithDash = `${this.prefix}-`
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefixWithDash)) {
        result.push(k.slice(prefixWithDash.length))
      }
    }
    return result
  }
}

export const storage = new LocalStorageAdapter()
