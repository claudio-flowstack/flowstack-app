/**
 * Exports the canvas viewport as a PNG file by serializing
 * the inner SVG to an image and drawing it on a 2x-resolution canvas.
 */
export function exportCanvasToPng(
  viewportEl: HTMLDivElement,
  fileName: string,
): void {
  const svg = viewportEl.querySelector('svg')
  if (!svg) {
    console.warn('[exportPng] No SVG element found inside viewport.')
    return
  }

  const { width, height } = svg.getBoundingClientRect()
  const scale = 2

  // Serialize the SVG to a string
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  // Load the SVG into an Image, then draw on canvas
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, width, height)

    URL.revokeObjectURL(url)

    // Trigger download
    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
    link.href = pngUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  img.onerror = () => {
    console.error('[exportPng] Failed to load SVG as image.')
    URL.revokeObjectURL(url)
  }

  img.src = url
}
