import type { SystemResource, ResourceFolder } from '../domain/types'

const RESOURCES_KEY = 'flowstack-system-resources'

export function loadResources(): SystemResource[] {
  try {
    const stored = localStorage.getItem(RESOURCES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveResources(resources: SystemResource[]): boolean {
  try {
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources))
    return true
  } catch (e) {
    console.warn('localStorage error saving resources:', e)
    return false
  }
}

export function getResourcesForSystem(systemId: string): SystemResource[] {
  return loadResources().filter(r => r.systemId === systemId)
}

export function addResource(resource: SystemResource): boolean {
  const all = loadResources()
  all.push(resource)
  return saveResources(all)
}

export function updateResource(resourceId: string, updates: Partial<Omit<SystemResource, 'id' | 'systemId'>>): boolean {
  const all = loadResources()
  const idx = all.findIndex(r => r.id === resourceId)
  if (idx < 0) return false
  all[idx] = { ...all[idx]!, ...updates } as SystemResource
  return saveResources(all)
}

export function deleteResource(resourceId: string): boolean {
  const all = loadResources().filter(r => r.id !== resourceId)
  return saveResources(all)
}

// ── Resource Folders ────────────────────────────────────────────

const FOLDERS_KEY = 'flowstack-resource-folders'

export function loadFolders(): ResourceFolder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveFolders(folders: ResourceFolder[]): boolean {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
    return true
  } catch (e) {
    console.warn('localStorage error saving folders:', e)
    return false
  }
}

export function getFoldersForSystem(systemId: string): ResourceFolder[] {
  return loadFolders().filter(f => f.systemId === systemId)
}

export function addFolder(folder: ResourceFolder): boolean {
  const all = loadFolders()
  all.push(folder)
  return saveFolders(all)
}

export function updateFolder(folderId: string, updates: Partial<Omit<ResourceFolder, 'id' | 'systemId'>>): boolean {
  const all = loadFolders()
  const idx = all.findIndex(f => f.id === folderId)
  if (idx < 0) return false
  all[idx] = { ...all[idx]!, ...updates } as ResourceFolder
  return saveFolders(all)
}

export function deleteFolder(folderId: string): boolean {
  const allFolders = loadFolders().filter(f => f.id !== folderId)
  saveFolders(allFolders)
  const allResources = loadResources()
  let changed = false
  for (const r of allResources) {
    if (r.folderId === folderId) { r.folderId = undefined; changed = true }
  }
  if (changed) saveResources(allResources)
  return true
}
