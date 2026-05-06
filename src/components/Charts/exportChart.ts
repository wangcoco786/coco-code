/**
 * Export an SVG element as a PNG image by rendering it to a canvas.
 * Triggers a download with the specified filename.
 */
export function exportChartToPng(svgElement: SVGSVGElement, filename: string): void {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.onload = () => {
    // Use the SVG's viewBox dimensions for canvas size, scaled 2x for retina
    const viewBox = svgElement.viewBox.baseVal
    const canvasWidth = (viewBox.width || svgElement.clientWidth || 400) * 2
    const canvasHeight = (viewBox.height || svgElement.clientHeight || 200) * 2

    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(url)
      return
    }

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw SVG image
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

    // Trigger download
    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = pngUrl
    link.click()

    URL.revokeObjectURL(url)
  }

  img.onerror = () => {
    URL.revokeObjectURL(url)
  }

  img.src = url
}
