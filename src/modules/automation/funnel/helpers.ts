import type { FunnelElement, FunnelConnection, PortDirection } from '../domain/types'
import { PORT_DIR, SNAP_THRESHOLD } from './constants'

// ── Port-Position ───────────────────────────────────────────────────────────
// Berechnet die absolute Position eines Ports an einem Element

export function getPortPosition(
  element: FunnelElement,
  port: PortDirection,
): { x: number; y: number } {
  switch (port) {
    case 'top':
      return { x: element.x + element.width / 2, y: element.y }
    case 'right':
      return { x: element.x + element.width, y: element.y + element.height / 2 }
    case 'bottom':
      return { x: element.x + element.width / 2, y: element.y + element.height }
    case 'left':
      return { x: element.x, y: element.y + element.height / 2 }
  }
}

// ── Bezier-Verbindungspfad ──────────────────────────────────────────────────
// SVG-Pfad (kubische Bezier-Kurve) zwischen zwei Elementen

export function getFunnelConnectionPath(
  from: FunnelElement,
  fromPort: PortDirection,
  to: FunnelElement,
  toPort: PortDirection,
): string {
  const p1 = getPortPosition(from, fromPort)
  const p2 = getPortPosition(to, toPort)
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const offset = Math.max(60, dist * 0.35)
  const d1 = PORT_DIR[fromPort]
  const d2 = PORT_DIR[toPort]
  return `M ${p1.x} ${p1.y} C ${p1.x + d1[0] * offset} ${p1.y + d1[1] * offset}, ${p2.x + d2[0] * offset} ${p2.y + d2[1] * offset}, ${p2.x} ${p2.y}`
}

// ── Temporärer Verbindungspfad (beim Ziehen) ────────────────────────────────
// SVG-Pfad vom Element-Port zur aktuellen Mausposition

export function getTempConnectionPath(
  from: FunnelElement,
  fromPort: PortDirection,
  toX: number,
  toY: number,
): string {
  const p1 = getPortPosition(from, fromPort)
  const dist = Math.hypot(toX - p1.x, toY - p1.y)
  const offset = Math.max(60, dist * 0.35)
  const d1 = PORT_DIR[fromPort]
  return `M ${p1.x} ${p1.y} C ${p1.x + d1[0] * offset} ${p1.y + d1[1] * offset}, ${toX} ${toY}, ${toX} ${toY}`
}

// ── Gerader Pfad ────────────────────────────────────────────────────────────

export function getStraightPath(
  from: FunnelElement,
  fromPort: PortDirection,
  to: FunnelElement,
  toPort: PortDirection,
): string {
  const p1 = getPortPosition(from, fromPort)
  const p2 = getPortPosition(to, toPort)
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`
}

// ── Stufen-/Ellbogenpfad ────────────────────────────────────────────────────

export function getStepPath(
  from: FunnelElement,
  fromPort: PortDirection,
  to: FunnelElement,
  toPort: PortDirection,
): string {
  const p1 = getPortPosition(from, fromPort)
  const p2 = getPortPosition(to, toPort)

  // Horizontaler Port -> vertikal -> horizontal
  if (fromPort === 'right' || fromPort === 'left') {
    const midX = (p1.x + p2.x) / 2
    return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`
  }

  // Vertikaler Port -> horizontal -> vertikal
  const midY = (p1.y + p2.y) / 2
  return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`
}

// ── Bildschirm- zu Canvas-Koordinaten ───────────────────────────────────────

export function screenToCanvas(
  screenX: number,
  screenY: number,
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  }
}

// ── Raster-Snap ─────────────────────────────────────────────────────────────

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// ── Alle Elemente in den sichtbaren Bereich einpassen ───────────────────────

export function computeFitToScreen(
  elements: FunnelElement[],
  containerWidth: number,
  containerHeight: number,
  padding = 60,
): { zoom: number; pan: { x: number; y: number } } {
  if (elements.length === 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } }
  }

  // Bounding-Box aller Elemente berechnen
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    if (el.x < minX) minX = el.x
    if (el.y < minY) minY = el.y
    if (el.x + el.width > maxX) maxX = el.x + el.width
    if (el.y + el.height > maxY) maxY = el.y + el.height
  }

  const contentW = maxX - minX
  const contentH = maxY - minY

  // Zoom so wählen, dass alles inkl. Padding reinpasst
  const availW = containerWidth - padding * 2
  const availH = containerHeight - padding * 2
  const zoom = Math.min(1, availW / contentW, availH / contentH)

  // Pan so setzen, dass der Inhalt zentriert ist
  const pan = {
    x: (containerWidth - contentW * zoom) / 2 - minX * zoom,
    y: (containerHeight - contentH * zoom) / 2 - minY * zoom,
  }

  return { zoom, pan }
}

// ── Snap-Hilfslinien berechnen ──────────────────────────────────────────────
// Vergleicht das gezogene Element mit allen anderen und gibt Hilfslinien zurück

export function computeSnapGuides(
  draggingId: string,
  dragX: number,
  dragY: number,
  elements: FunnelElement[],
  threshold = SNAP_THRESHOLD,
): { guides: { axis: 'x' | 'y'; pos: number }[]; snappedX: number; snappedY: number } {
  const others = elements.filter((el) => el.id !== draggingId)
  const dragging = elements.find((el) => el.id === draggingId)
  const dragW = dragging?.width ?? 200
  const dragH = dragging?.height ?? 80

  const guides: { axis: 'x' | 'y'; pos: number }[] = []
  let snappedX = dragX
  let snappedY = dragY

  const dragCX = dragX + dragW / 2
  const dragCY = dragY + dragH / 2

  let bestDx = threshold + 1
  let bestDy = threshold + 1

  for (const other of others) {
    const oCX = other.x + other.width / 2
    const oCY = other.y + other.height / 2

    // Linke Kante an linke Kante
    const dLeft = Math.abs(dragX - other.x)
    if (dLeft < bestDx) {
      bestDx = dLeft
      snappedX = other.x
      guides.push({ axis: 'x', pos: other.x })
    }

    // Mitte an Mitte (vertikal)
    const dCenterX = Math.abs(dragCX - oCX)
    if (dCenterX < bestDx) {
      bestDx = dCenterX
      snappedX = oCX - dragW / 2
      guides.push({ axis: 'x', pos: oCX })
    }

    // Rechte Kante an rechte Kante
    const dRight = Math.abs((dragX + dragW) - (other.x + other.width))
    if (dRight < bestDx) {
      bestDx = dRight
      snappedX = other.x + other.width - dragW
      guides.push({ axis: 'x', pos: other.x + other.width })
    }

    // Obere Kante an obere Kante
    const dTop = Math.abs(dragY - other.y)
    if (dTop < bestDy) {
      bestDy = dTop
      snappedY = other.y
      guides.push({ axis: 'y', pos: other.y })
    }

    // Mitte an Mitte (horizontal)
    const dCenterY = Math.abs(dragCY - oCY)
    if (dCenterY < bestDy) {
      bestDy = dCenterY
      snappedY = oCY - dragH / 2
      guides.push({ axis: 'y', pos: oCY })
    }

    // Untere Kante an untere Kante
    const dBottom = Math.abs((dragY + dragH) - (other.y + other.height))
    if (dBottom < bestDy) {
      bestDy = dBottom
      snappedY = other.y + other.height - dragH
      guides.push({ axis: 'y', pos: other.y + other.height })
    }
  }

  // Nur Guides innerhalb des Schwellwerts behalten
  if (bestDx > threshold) snappedX = dragX
  if (bestDy > threshold) snappedY = dragY

  const filteredGuides = guides.filter((g) => {
    if (g.axis === 'x') return bestDx <= threshold
    return bestDy <= threshold
  })

  return { guides: filteredGuides, snappedX, snappedY }
}

// ── Pfad-Mittelpunkt (fuer Label-Positionierung) ──────────────────────────

export function getFunnelPathMidpoint(
  from: FunnelElement,
  fromPort: PortDirection,
  to: FunnelElement,
  toPort: PortDirection,
  style: 'bezier' | 'straight' | 'step' = 'bezier',
): { x: number; y: number } {
  const p1 = getPortPosition(from, fromPort)
  const p2 = getPortPosition(to, toPort)

  if (style === 'straight') {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }

  if (style === 'step') {
    const midX = (p1.x + p2.x) / 2
    return { x: midX, y: (p1.y + p2.y) / 2 }
  }

  // Bezier: de Casteljau bei t=0.5
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const offset = Math.max(60, dist * 0.35)
  const d1 = PORT_DIR[fromPort]
  const d2 = PORT_DIR[toPort]
  const cp1x = p1.x + d1[0] * offset
  const cp1y = p1.y + d1[1] * offset
  const cp2x = p2.x + d2[0] * offset
  const cp2y = p2.y + d2[1] * offset
  const t = 0.5
  const mt = 0.5
  return {
    x: mt ** 3 * p1.x + 3 * mt ** 2 * t * cp1x + 3 * mt * t ** 2 * cp2x + t ** 3 * p2.x,
    y: mt ** 3 * p1.y + 3 * mt ** 2 * t * cp1y + 3 * mt * t ** 2 * cp2y + t ** 3 * p2.y,
  }
}
