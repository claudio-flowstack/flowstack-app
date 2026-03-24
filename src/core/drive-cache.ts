/**
 * Global Drive/Gmail Cache — prefetched beim App-Start,
 * damit DriveVault sofort Daten anzeigen kann.
 */

const BACKEND_URL = 'http://localhost:3002'

interface CacheState {
  driveFiles: unknown[]
  emails: unknown[]
  driveFetched: boolean
  gmailFetched: boolean
  driveLoading: boolean
  gmailLoading: boolean
}

const cache: CacheState = {
  driveFiles: [],
  emails: [],
  driveFetched: false,
  gmailFetched: false,
  driveLoading: false,
  gmailLoading: false,
}

const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

export function subscribeDriveCache(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getDriveCache() {
  return cache
}

export async function prefetchDrive() {
  if (cache.driveFetched || cache.driveLoading) return
  cache.driveLoading = true
  notify()
  try {
    const resp = await fetch(`${BACKEND_URL}/api/drive-vault?limit=200`)
    if (resp.ok) {
      const data = await resp.json()
      cache.driveFiles = data.files || []
      cache.driveFetched = true
    }
  } catch {
    // Silently fail — DriveVault will retry when opened
  } finally {
    cache.driveLoading = false
    notify()
  }
}

export async function prefetchGmail() {
  if (cache.gmailFetched || cache.gmailLoading) return
  cache.gmailLoading = true
  notify()
  try {
    const resp = await fetch(`${BACKEND_URL}/api/gmail-vault?limit=50`)
    if (resp.ok) {
      const data = await resp.json()
      cache.emails = data.emails || []
      cache.gmailFetched = true
    }
  } catch {
    // Silently fail
  } finally {
    cache.gmailLoading = false
    notify()
  }
}

export async function refreshDrive(query = '') {
  cache.driveLoading = true
  cache.driveFetched = false
  notify()
  try {
    const params = new URLSearchParams({ limit: '200' })
    if (query) params.set('q', query)
    const resp = await fetch(`${BACKEND_URL}/api/drive-vault?${params}`)
    if (resp.ok) {
      const data = await resp.json()
      cache.driveFiles = data.files || []
      cache.driveFetched = true
    }
  } catch {
    // pass
  } finally {
    cache.driveLoading = false
    notify()
  }
}

export async function refreshGmail(query = '') {
  cache.gmailLoading = true
  cache.gmailFetched = false
  notify()
  try {
    const params = new URLSearchParams({ limit: '50' })
    if (query) params.set('q', query)
    const resp = await fetch(`${BACKEND_URL}/api/gmail-vault?${params}`)
    if (resp.ok) {
      const data = await resp.json()
      cache.emails = data.emails || []
      cache.gmailFetched = true
    }
  } catch {
    // pass
  } finally {
    cache.gmailLoading = false
    notify()
  }
}

export function removeDriveFile(fileId: string) {
  cache.driveFiles = cache.driveFiles.filter((f: any) => f.id !== fileId)
  notify()
}

// Prefetch both on import (runs once when App loads)
prefetchDrive()
prefetchGmail()
