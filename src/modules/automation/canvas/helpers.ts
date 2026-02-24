import type { SystemNode, NodeConnection, PortDirection } from '../domain/types'
import { NODE_W, NODE_H, PORT_DIR, SNAP_THRESHOLD, nodeW, nodeH } from './constants'

// ── Port Position ───────────────────────────────────────────────────────────

export function getPortPosition(
  node: SystemNode,
  port: PortDirection,
): { x: number; y: number } {
  const w = nodeW(node.type)
  const h = nodeH(node.type)
  switch (port) {
    case 'top':
      return { x: node.x + w / 2, y: node.y }
    case 'right':
      return { x: node.x + w, y: node.y + h / 2 }
    case 'bottom':
      return { x: node.x + w / 2, y: node.y + h }
    case 'left':
      return { x: node.x, y: node.y + h / 2 }
  }
}

// ── Connection Path (Bezier) ────────────────────────────────────────────────

export function getConnectionPath(
  fromNode: SystemNode,
  toNode: SystemNode,
  fromPort: PortDirection = 'right',
  toPort: PortDirection = 'left',
): string {
  const p1 = getPortPosition(fromNode, fromPort)
  const p2 = getPortPosition(toNode, toPort)
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const offset = Math.max(60, dist * 0.35)
  const d1 = PORT_DIR[fromPort]
  const d2 = PORT_DIR[toPort]
  return `M ${p1.x} ${p1.y} C ${p1.x + d1[0] * offset} ${p1.y + d1[1] * offset}, ${p2.x + d2[0] * offset} ${p2.y + d2[1] * offset}, ${p2.x} ${p2.y}`
}

export function getStraightPath(
  fromNode: SystemNode,
  toNode: SystemNode,
  fromPort: PortDirection = 'right',
  toPort: PortDirection = 'left',
): string {
  const p1 = getPortPosition(fromNode, fromPort)
  const p2 = getPortPosition(toNode, toPort)
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`
}

export function getElbowPath(
  fromNode: SystemNode,
  toNode: SystemNode,
  fromPort: PortDirection = 'right',
  toPort: PortDirection = 'left',
): string {
  const p1 = getPortPosition(fromNode, fromPort)
  const p2 = getPortPosition(toNode, toPort)
  const midX = (p1.x + p2.x) / 2
  return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`
}

export function getTempPath(
  fx: number,
  fy: number,
  fromDir: [number, number],
  tx: number,
  ty: number,
): string {
  const dist = Math.hypot(tx - fx, ty - fy)
  const offset = Math.max(60, dist * 0.35)
  return `M ${fx} ${fy} C ${fx + fromDir[0] * offset} ${fy + fromDir[1] * offset}, ${tx} ${ty}, ${tx} ${ty}`
}

// ── Path by Style ───────────────────────────────────────────────────────────

export type CurveStyle = 'bezier' | 'straight' | 'elbow'

export function getPathByStyle(
  fromNode: SystemNode,
  toNode: SystemNode,
  fromPort: PortDirection,
  toPort: PortDirection,
  style: CurveStyle,
): string {
  switch (style) {
    case 'straight':
      return getStraightPath(fromNode, toNode, fromPort, toPort)
    case 'elbow':
      return getElbowPath(fromNode, toNode, fromPort, toPort)
    default:
      return getConnectionPath(fromNode, toNode, fromPort, toPort)
  }
}

// ── Path Midpoint ───────────────────────────────────────────────────────────

export function getPathMidpoint(
  fromNode: SystemNode,
  toNode: SystemNode,
  fromPort: PortDirection = 'right',
  toPort: PortDirection = 'left',
  curveStyle: CurveStyle = 'bezier',
): { x: number; y: number } {
  const p1 = getPortPosition(fromNode, fromPort)
  const p2 = getPortPosition(toNode, toPort)

  if (curveStyle === 'straight') {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }
  if (curveStyle === 'elbow') {
    const midX = (p1.x + p2.x) / 2
    return { x: midX, y: (p1.y + p2.y) / 2 }
  }

  // Bezier: de Casteljau at t=0.5
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

// ── Cycle Detection ─────────────────────────────────────────────────────────

export function wouldCreateCycle(
  connections: NodeConnection[],
  startId: string,
  targetId: string,
): boolean {
  const adj = new Map<string, string[]>()
  for (const c of connections) {
    const list = adj.get(c.from) || []
    list.push(c.to)
    adj.set(c.from, list)
  }
  const visited = new Set<string>()
  const stack = [targetId]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node === startId) return true
    if (visited.has(node)) continue
    visited.add(node)
    for (const next of adj.get(node) || []) stack.push(next)
  }
  return false
}

// ── Auto Layout (BFS Layering) ──────────────────────────────────────────────

export function computeAutoLayout(
  nodes: SystemNode[],
  connections: NodeConnection[],
): SystemNode[] {
  if (nodes.length === 0) return nodes

  const incoming = new Set(connections.map((c) => c.to))
  const startIds = nodes
    .filter((n) => n.type === 'trigger' || !incoming.has(n.id))
    .map((n) => n.id)
  if (startIds.length === 0 && nodes[0]) startIds.push(nodes[0].id)

  const layerMap = new Map<string, number>()
  const queue: { id: string; depth: number }[] = startIds.map((id) => ({
    id,
    depth: 0,
  }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) {
      if ((layerMap.get(id) ?? 0) < depth) layerMap.set(id, depth)
      continue
    }
    visited.add(id)
    layerMap.set(id, depth)
    for (const conn of connections.filter((c) => c.from === id)) {
      queue.push({ id: conn.to, depth: depth + 1 })
    }
  }

  let maxLayer = Math.max(0, ...layerMap.values())
  for (const n of nodes) {
    if (!layerMap.has(n.id)) {
      layerMap.set(n.id, ++maxLayer)
    }
  }

  const layers = new Map<number, string[]>()
  for (const [id, layer] of layerMap) {
    const list = layers.get(layer) || []
    list.push(id)
    layers.set(layer, list)
  }

  // Dynamic column width based on widest node per layer
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const result = new Map<string, { x: number; y: number }>()
  let currentX = 40
  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0])
  for (const [, ids] of sortedLayers) {
    let maxW = 0
    ids.forEach((id) => {
      const n = nodeMap.get(id)
      if (n) maxW = Math.max(maxW, nodeW(n.type))
    })
    ids.forEach((id, idx) => {
      result.set(id, { x: currentX, y: 40 + idx * 108 })
    })
    currentX += maxW + 80
  }

  return nodes.map((n) => {
    const pos = result.get(n.id)
    return pos ? { ...n, x: pos.x, y: pos.y } : n
  })
}

// ── Snap Guide Calculation ──────────────────────────────────────────────────

export interface SnapGuideLine {
  pos: number
  min: number
  max: number
}

interface SnapResult {
  x: SnapGuideLine[]
  y: SnapGuideLine[]
  snapX: number | null
  snapY: number | null
}

export function computeSnapGuides(
  nodes: SystemNode[],
  dragId: string,
  dragX: number,
  dragY: number,
): SnapResult {
  const dragNode = nodes.find((n) => n.id === dragId)
  const others = nodes.filter((n) => n.id !== dragId)
  const guidesX: SnapGuideLine[] = []
  const guidesY: SnapGuideLine[] = []
  let snapX: number | null = null
  let snapY: number | null = null

  const dragW = dragNode ? nodeW(dragNode.type) : NODE_W
  const dragH = dragNode ? nodeH(dragNode.type) : NODE_H
  const dragCX = dragX + dragW / 2
  const dragCY = dragY + dragH / 2
  const PAD = 40

  for (const other of others) {
    const oW = nodeW(other.type)
    const oH = nodeH(other.type)
    const oCX = other.x + oW / 2
    const oCY = other.y + oH / 2

    // Vertical alignment (same X) — guide line runs vertically, bounded by Y range
    if (Math.abs(dragX - other.x) < SNAP_THRESHOLD) {
      snapX = other.x
      const yMin = Math.min(dragY, other.y) - PAD
      const yMax = Math.max(dragY + dragH, other.y + oH) + PAD
      guidesX.push({ pos: other.x, min: yMin, max: yMax })
    }
    if (Math.abs(dragCX - oCX) < SNAP_THRESHOLD) {
      snapX = oCX - dragW / 2
      const yMin = Math.min(dragY, other.y) - PAD
      const yMax = Math.max(dragY + dragH, other.y + oH) + PAD
      guidesX.push({ pos: oCX, min: yMin, max: yMax })
    }

    // Horizontal alignment (same Y) — guide line runs horizontally, bounded by X range
    if (Math.abs(dragY - other.y) < SNAP_THRESHOLD) {
      snapY = other.y
      const xMin = Math.min(dragX, other.x) - PAD
      const xMax = Math.max(dragX + dragW, other.x + oW) + PAD
      guidesY.push({ pos: other.y, min: xMin, max: xMax })
    }
    if (Math.abs(dragCY - oCY) < SNAP_THRESHOLD) {
      snapY = oCY - dragH / 2
      const xMin = Math.min(dragX, other.x) - PAD
      const xMax = Math.max(dragX + dragW, other.x + oW) + PAD
      guidesY.push({ pos: oCY, min: xMin, max: xMax })
    }
  }

  return { x: guidesX, y: guidesY, snapX, snapY }
}

// ── Equal-Spacing Detection ─────────────────────────────────────────────────

export interface EqualSpacingGuide {
  axis: 'x' | 'y'
  positions: number[] // center positions of the equally spaced nodes
  spacing: number
}

export function detectEqualSpacing(
  nodes: SystemNode[],
  dragId: string,
  dragX: number,
  dragY: number,
): EqualSpacingGuide[] {
  const threshold = SNAP_THRESHOLD
  const guides: EqualSpacingGuide[] = []
  const others = nodes.filter((n) => n.id !== dragId)
  if (others.length < 2) return guides

  const dragNode = nodes.find((n) => n.id === dragId)
  const dragW = dragNode ? nodeW(dragNode.type) : NODE_W
  const dragH = dragNode ? nodeH(dragNode.type) : NODE_H
  const dragCX = dragX + dragW / 2
  const dragCY = dragY + dragH / 2

  // Check horizontal equal spacing (nodes sorted by X)
  const hSorted = [...others].sort((a, b) => a.x - b.x)
  for (let i = 0; i < hSorted.length - 1; i++) {
    const a = hSorted[i]!
    const b = hSorted[i + 1]!
    const aCX = a.x + nodeW(a.type) / 2
    const bCX = b.x + nodeW(b.type) / 2
    const spacing = bCX - aCX
    if (Math.abs(dragCX - (aCX - spacing)) < threshold) {
      guides.push({ axis: 'x', positions: [dragCX, aCX, bCX], spacing })
    }
    if (Math.abs(dragCX - (bCX + spacing)) < threshold) {
      guides.push({ axis: 'x', positions: [aCX, bCX, dragCX], spacing })
    }
  }

  // Check vertical equal spacing (nodes sorted by Y)
  const vSorted = [...others].sort((a, b) => a.y - b.y)
  for (let i = 0; i < vSorted.length - 1; i++) {
    const a = vSorted[i]!
    const b = vSorted[i + 1]!
    const aCY = a.y + nodeH(a.type) / 2
    const bCY = b.y + nodeH(b.type) / 2
    const spacing = bCY - aCY
    if (Math.abs(dragCY - (aCY - spacing)) < threshold) {
      guides.push({ axis: 'y', positions: [dragCY, aCY, bCY], spacing })
    }
    if (Math.abs(dragCY - (bCY + spacing)) < threshold) {
      guides.push({ axis: 'y', positions: [aCY, bCY, dragCY], spacing })
    }
  }

  return guides
}
