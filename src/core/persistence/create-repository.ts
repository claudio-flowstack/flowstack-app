import type { Repository, StorageAdapter } from './types'

/**
 * Factory: Erstellt ein Repository für einen Datentyp.
 *
 * Aktuell: localStorage via StorageAdapter.
 * Der Entwickler ersetzt dies später durch:
 *   - createSupabaseRepository(tableName)
 *   - createApiRepository(endpoint)
 *
 * Die Stores merken davon NICHTS.
 */
export function createLocalRepository<T extends { id: string }>(
  adapter: StorageAdapter,
  collectionKey: string,
): Repository<T> {
  async function readAll(): Promise<T[]> {
    return (await adapter.get<T[]>(collectionKey)) ?? []
  }

  async function writeAll(items: T[]): Promise<void> {
    await adapter.set(collectionKey, items)
  }

  return {
    async getAll(): Promise<T[]> {
      return readAll()
    },

    async getById(id: string): Promise<T | null> {
      const items = await readAll()
      return items.find((item) => item.id === id) ?? null
    },

    async create(item: Omit<T, 'id'> & { id?: string; user_id?: string }): Promise<T> {
      const items = await readAll()
      const newItem = {
        ...item,
        id: item.id ?? crypto.randomUUID(),
        user_id: (item as Record<string, unknown>).user_id ?? 'local-user',
      } as unknown as T
      items.push(newItem)
      await writeAll(items)
      return newItem
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const items = await readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Item not found: ${id}`)
      const existing = items[index]
      if (!existing) throw new Error(`Item not found: ${id}`)
      const updated = { ...existing, ...data } as T
      items[index] = updated
      await writeAll(items)
      return updated
    },

    async delete(id: string): Promise<void> {
      const items = await readAll()
      const filtered = items.filter((item) => item.id !== id)
      await writeAll(filtered)
    },

    async query(filter: Partial<T>): Promise<T[]> {
      const items = await readAll()
      return items.filter((item) =>
        Object.entries(filter).every(
          ([key, value]) => item[key as keyof T] === value,
        ),
      )
    },
  }
}
