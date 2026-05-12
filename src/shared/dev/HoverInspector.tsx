import { useEffect, useRef, useState } from 'react'

type Source = {
  fileName: string
  lineNumber: number
  columnNumber?: number
  componentName: string
  hasSource: boolean
}

type ToastState = { message: string; key: number } | null

type FiberLike = {
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number }
  _debugOwner?: FiberLike | null
  elementType?: unknown
  type?: unknown
  return?: FiberLike | null
  memoizedProps?: Record<string, unknown> | null
  pendingProps?: Record<string, unknown> | null
}

function getFiberFromNode(node: Element): FiberLike | null {
  const key = Object.keys(node).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'),
  )
  return key ? ((node as unknown as Record<string, unknown>)[key] as FiberLike) : null
}

function getComponentName(elementType: unknown): string | null {
  if (typeof elementType === 'function') {
    const c = elementType as { displayName?: string; name?: string }
    return c.displayName || c.name || null
  }
  if (typeof elementType === 'object' && elementType !== null) {
    const c = elementType as { displayName?: string; render?: { displayName?: string; name?: string } }
    if (c.displayName) return c.displayName
    if (c.render) return c.render.displayName || c.render.name || null
  }
  return null
}

function readSource(fiber: FiberLike): Source['fileName'] extends string ? { fileName: string; lineNumber: number; columnNumber?: number } | null : null {
  // Path A: fiber._debugSource
  const ds = fiber._debugSource
  if (ds?.fileName && ds.lineNumber) {
    return { fileName: ds.fileName, lineNumber: ds.lineNumber, columnNumber: ds.columnNumber }
  }
  // Path B: prop __source (Babel transform-react-jsx-source default)
  const fromProps = (fiber.memoizedProps?.__source ?? fiber.pendingProps?.__source) as
    | { fileName?: string; lineNumber?: number; columnNumber?: number }
    | undefined
  if (fromProps?.fileName && fromProps.lineNumber) {
    return { fileName: fromProps.fileName, lineNumber: fromProps.lineNumber, columnNumber: fromProps.columnNumber }
  }
  return null
}

function readDataLoc(node: Element): { fileName: string; lineNumber: number } | null {
  // Walk up from the hovered DOM node to find a data-loc="file:line" attribute,
  // stamped at build time by our babel-data-loc plugin.
  let n: Element | null = node
  while (n) {
    const loc = n.getAttribute?.('data-loc')
    if (loc) {
      const sep = loc.lastIndexOf(':')
      if (sep > 0) {
        const fileName = loc.slice(0, sep)
        const lineNumber = parseInt(loc.slice(sep + 1), 10)
        if (fileName && lineNumber > 0) return { fileName, lineNumber }
      }
    }
    n = n.parentElement
  }
  return null
}

function findSource(startNode: Element): Source | null {
  // Path 0 (preferred): data-loc attribute from babel-data-loc plugin
  const fromDom = readDataLoc(startNode)

  let fiber: FiberLike | null = getFiberFromNode(startNode)
  let firstFunctional: { name: string; fiber: FiberLike } | null = null

  while (fiber) {
    const elementType = fiber.elementType ?? fiber.type
    const name = getComponentName(elementType)
    if (!firstFunctional && name) {
      firstFunctional = { name, fiber }
    }
    if (fromDom && name) {
      return { ...fromDom, componentName: name, hasSource: true }
    }
    const src = readSource(fiber)
    if (src && name) {
      return { ...src, componentName: name, hasSource: true }
    }
    fiber = fiber.return ?? null
  }

  if (fromDom && firstFunctional) {
    return { ...fromDom, componentName: firstFunctional.name, hasSource: true }
  }
  if (firstFunctional) {
    return {
      fileName: '',
      lineNumber: 0,
      componentName: firstFunctional.name,
      hasSource: false,
    }
  }
  return null
}

function shortPath(filePath: string): string {
  const idx = filePath.lastIndexOf('/src/')
  return idx >= 0 ? filePath.slice(idx + 1) : filePath
}

export function HoverInspector({ active }: { active: boolean }) {
  const [hover, setHover] = useState<{ source: Source; rect: DOMRect } | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const lastNodeRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!active) {
      setHover(null)
      lastNodeRef.current = null
      return
    }

    let warned = false
    function onMove(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return
      // skip our own overlay nodes (they have data-flowstack-inspector)
      let n: Element | null = target
      while (n) {
        if (n.getAttribute && n.getAttribute('data-flowstack-inspector') !== null) return
        n = n.parentElement
      }
      if (target === lastNodeRef.current) return
      lastNodeRef.current = target

      const source = findSource(target)
      if (!source) {
        if (!warned) {
          console.warn('[HoverInspector] No React fiber found on element', target)
          warned = true
        }
        setHover(null)
        return
      }
      setHover({ source, rect: target.getBoundingClientRect() })
    }

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return
      let n: Element | null = target
      while (n) {
        if (n.getAttribute && n.getAttribute('data-flowstack-inspector') !== null) return
        n = n.parentElement
      }
      const source = findSource(target)
      if (!source) return
      e.preventDefault()
      e.stopPropagation()

      const text = source.hasSource
        ? `${source.componentName} (${shortPath(source.fileName)}:${source.lineNumber})\n\n[Was soll geändert werden:]\n`
        : `${source.componentName} (Source nicht verfügbar — Component-Name only)\n\n[Was soll geändert werden:]\n`
      void navigator.clipboard.writeText(text).then(() => {
        setToast({ message: `${source.componentName} kopiert`, key: Date.now() })
      })
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setHover(null)
    }

    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [active])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  if (!active) return null

  return (
    <div data-flowstack-inspector="root" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483647 }}>
      {hover && (
        <>
          <div
            data-flowstack-inspector="highlight"
            style={{
              position: 'fixed',
              top: hover.rect.top,
              left: hover.rect.left,
              width: hover.rect.width,
              height: hover.rect.height,
              border: '2px solid #6366f1',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 4,
              pointerEvents: 'none',
            }}
          />
          <div
            data-flowstack-inspector="tooltip"
            style={{
              position: 'fixed',
              top: Math.max(8, hover.rect.top - 64),
              left: hover.rect.left,
              maxWidth: 460,
              background: '#0a0e1a',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'ui-monospace, Menlo, monospace',
              boxShadow: '0 12px 32px -8px rgba(0,0,0,.4)',
              pointerEvents: 'none',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 700, color: '#a5b4fc' }}>{hover.source.componentName}</div>
            <div style={{ opacity: 0.8 }}>
              {hover.source.hasSource ? `${shortPath(hover.source.fileName)}:${hover.source.lineNumber}` : '(kein Filepath verfügbar)'}
            </div>
            <div style={{ marginTop: 4, fontSize: 10, opacity: 0.6 }}>Click → kopieren · Esc/Cmd+Shift+I → aus</div>
          </div>
        </>
      )}
      {toast && (
        <div
          key={toast.key}
          data-flowstack-inspector="toast"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            background: '#10b981',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.3)',
            pointerEvents: 'none',
          }}
        >
          ✓ {toast.message}
        </div>
      )}
      <div
        data-flowstack-inspector="badge"
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          background: '#6366f1',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      >
        🎯 Inspector aktiv (Cmd+Shift+I aus)
      </div>
    </div>
  )
}
