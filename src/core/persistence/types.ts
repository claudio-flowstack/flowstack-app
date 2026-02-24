/**
 * Repository Pattern — die zentrale Abstraktionsschicht für Datenzugriff.
 *
 * Jedes Modul bekommt Repositories die dieses Interface implementieren.
 * Aktuell: localStorage. Später: Supabase, REST API, GraphQL.
 *
 * Der Entwickler tauscht NUR die Implementation aus.
 * Kein UI-Code ändert sich.
 */

export interface Repository<T extends { id: string }> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(item: Omit<T, 'id'> & { id?: string }): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  query?(filter: Partial<T>): Promise<T[]>
}

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  keys(): Promise<string[]>
}
