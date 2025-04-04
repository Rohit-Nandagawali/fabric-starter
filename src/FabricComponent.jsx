"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, Rect, Line, StaticCanvas, Pattern } from "fabric"

const FabricComponent = () => {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [zoomLevel, setZoomLevel] = useState(1) // State for zoom level
  const [coords, setCoords] = useState({ left: 0, right: 0, top: 0, bottom: 0 }) // State for visible coordinates

  // Constants for zoom limits
  const ZOOM_MIN = 0.2
  const ZOOM_MAX = 5

  // Margin values
  const MARGIN_TOP = "15vh"
  const MARGIN_SIDES = "15vw"

  // Grid options
  const gridOptions = {
    lineCount: 25,
    distance: 15,
    param: {
      stroke: "#d3d3d3", // Light gray
      strokeWidth: 1,
      selectable: false,
    },
  }

  // Create grid pattern
  const createGridPattern = (canvas) => {
    const staticCanvas = new StaticCanvas()
    staticCanvas.setHeight(gridOptions.distance * gridOptions.lineCount)
    staticCanvas.setWidth(gridOptions.distance * gridOptions.lineCount)

    const lines = []

    for (let i = 0; i < gridOptions.lineCount; i++) {
      const distance = i * gridOptions.distance
      const horizontal = new Line(
        [distance, 0, distance, gridOptions.lineCount * gridOptions.distance],
        gridOptions.param
      )
      const vertical = new Line(
        [0, distance, gridOptions.lineCount * gridOptions.distance, distance],
        gridOptions.param
      )

      lines.push([vertical, horizontal])
      staticCanvas.add(horizontal)
      staticCanvas.add(vertical)

      if (i % 5 === 0) {
        horizontal.set({ stroke: "#a9a9a9" }) // Darker light gray
        vertical.set({ stroke: "#a9a9a9" })
      }
    }

    const getCoefficient = (zoom) => {
      let coefficient = gridOptions.distance
      let min = ZOOM_MIN
      while (min < ZOOM_MAX) {
        if (min <= zoom) {
          coefficient = gridOptions.distance / min
        }
        min *= 5
      }
      return coefficient
    }

    return {
      updateForZoom: (zoom) => {
        const coefficient = getCoefficient(zoom)
        const distance = coefficient * zoom

        staticCanvas.setHeight(distance * gridOptions.lineCount)
        staticCanvas.setWidth(distance * gridOptions.lineCount)

        lines.forEach(([verticalLine, horizontalLine], i) => {
          verticalLine.set({
            top: i * distance,
            width: distance * gridOptions.lineCount,
          })
          verticalLine.setCoords()

          horizontalLine.set({
            left: i * distance,
            height: distance * gridOptions.lineCount,
          })
          horizontalLine.setCoords()
        })

        const pattern = new Pattern({
          source: staticCanvas.toCanvasElement(),
          repeat: "repeat",
        })

        pattern.patternTransform = [1 / zoom, 0, 0, 1 / zoom, 0, 0]
        canvas.set("backgroundColor", pattern)
        canvas.requestRenderAll()
      },
    }
  }

  // Calculate visible coordinates
  const updateVisibleCoords = (canvas) => {
    const zoom = canvas.getZoom()
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    const width = canvas.getWidth()
    const height = canvas.getHeight()

    const left = -vpt[4] / zoom
    const right = left + width / zoom
    const top = -vpt[5] / zoom
    const bottom = top + height / zoom

    setCoords({ left, right, top, bottom })
  }

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Calculate canvas dimensions based on margins
      const topMargin = window.innerHeight * 0.15 // 15vh
      const sideMargin = window.innerWidth * 0.15 // 15vw
      const canvasWidth = window.innerWidth - 2 * sideMargin
      const canvasHeight = window.innerHeight - topMargin

      const canvas = new Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        selection: true,
      })
      fabricCanvasRef.current = canvas

      const grid = createGridPattern(canvas)
      grid.updateForZoom(1) // Initial zoom
      setZoomLevel(1)
      updateVisibleCoords(canvas)

      // Panning logic
      let isDragging = false
      let lastPosX = 0
      let lastPosY = 0

      canvas.on("mouse:down", (opt) => {
        const evt = opt.e
        if (!opt.target) {
          isDragging = true
          lastPosX = evt.clientX
          lastPosY = evt.clientY
          canvas.setCursor("grabbing")
        }
      })

      canvas.on("mouse:move", (opt) => {
        if (isDragging) {
          const evt = opt.e
          const deltaX = evt.clientX - lastPosX
          const deltaY = evt.clientY - lastPosY

          canvas.relativePan({ x: deltaX, y: deltaY })
          lastPosX = evt.clientX
          lastPosY = evt.clientY
          updateVisibleCoords(canvas) // Update coords on pan
        }
      })

      canvas.on("mouse:up", () => {
        isDragging = false
        canvas.setCursor("default")
      })

      // Zoom logic
      canvas.on("mouse:wheel", (opt) => {
        const evt = opt.e
        evt.preventDefault()
        evt.stopPropagation()

        const delta = evt.deltaY
        let zoom = canvas.getZoom()
        zoom *= 0.999 ** delta
        zoom = Math.max(ZOOM_MIN, Math.min(zoom, ZOOM_MAX))

        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom)
        grid.updateForZoom(zoom)
        setZoomLevel(zoom) // Update zoom level display
        updateVisibleCoords(canvas) // Update coords on zoom
      })

      // Handle window resize
      const handleResize = () => {
        const topMargin = window.innerHeight * 0.15
        const sideMargin = window.innerWidth * 0.15
        const canvasWidth = window.innerWidth - 2 * sideMargin
        const canvasHeight = window.innerHeight - topMargin

        canvas.setDimensions({
          width: canvasWidth,
          height: canvasHeight,
        })
        canvas.requestRenderAll()
        updateVisibleCoords(canvas) // Update coords on resize
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
        }
      }
    }
  }, [])

  const addRectangle = () => {
    if (fabricCanvasRef.current) {
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: "blue",
        selectable: true,
      })
      fabricCanvasRef.current.add(rect)
      fabricCanvasRef.current.setActiveObject(rect)
      fabricCanvasRef.current.requestRenderAll()
    }
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Information Card - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 999,
          background: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div>Zoom: {zoomLevel.toFixed(2)}x</div>
        <div>Left: {coords.left.toFixed(0)}</div>
        <div>Right: {coords.right.toFixed(0)}</div>
        <div>Top: {coords.top.toFixed(0)}</div>
        <div>Bottom: {coords.bottom.toFixed(0)}</div>
      </div>

      {/* Add Rectangle Button - Left Side */}
      <button
        style={{
          position: "absolute",
          top: "10%",
          left: "20px",
          zIndex: 999,
          padding: "10px 15px",
          background: "#4285f4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          transform: "translateY(-50%)",
        }}
        onClick={addRectangle}
      >
        Add Rectangle
      </button>

      {/* Canvas with margins */}
      <div
        style={{
          position: "absolute",
          top: MARGIN_TOP,
          left: MARGIN_SIDES,
          right: MARGIN_SIDES,
          bottom: 0,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  )
}

export default FabricComponent