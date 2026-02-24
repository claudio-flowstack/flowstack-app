/**
 * Lightweight Event Bus für Cross-Module Kommunikation.
 *
 * Module dürfen NICHT direkt voneinander importieren.
 * Stattdessen: Events emittieren und subscriben.
 *
 * Beispiel:
 *   eventBus.emit('content:created', { id: '123', title: 'New Post' })
 *   eventBus.on('content:created', (data) => updateKpiMetrics(data))
 */

type EventCallback<T = unknown> = (data: T) => void

class EventBus {
  private listeners = new Map<string, Set<EventCallback>>()

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const typedCallback = callback as EventCallback
    this.listeners.get(event)!.add(typedCallback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(typedCallback)
    }
  }

  emit<T = unknown>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data)
      } catch (e) {
        console.error(`[EventBus] Error in handler for "${event}":`, e)
      }
    })
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event)
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
