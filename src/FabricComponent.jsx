"use client"

import { useEffect, useRef } from "react"
import { Canvas, Rect, Line, StaticCanvas, Pattern } from "fabric"

const FabricComponent = () => {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)

  // Constants for zoom limits
  const ZOOM_MIN = 0.2
  const ZOOM_MAX = 5

  // Padding values
  const PADDING_TOP = 50
  const PADDING_LEFT = 50
  const PADDING_RIGHT = 50

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

    // Create grid lines
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

      // Make every 5th line darker
      if (i % 5 === 0) {
        horizontal.set({ stroke: "#a9a9a9" }) // Darker light gray
        vertical.set({ stroke: "#a9a9a9" })
      }
    }

    // Function to get coefficient based on zoom level
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

    // Return function to update grid based on zoom
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

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Initialize canvas with adjusted dimensions for left and right padding
      const canvas = new Canvas(canvasRef.current, {
        width: window.innerWidth - PADDING_LEFT - PADDING_RIGHT,
        height: window.innerHeight - PADDING_TOP,
        backgroundColor: "#ffffff", // White background
        selection: true,
      })

      fabricCanvasRef.current = canvas

      // Create grid pattern
      const grid = createGridPattern(canvas)

      // Initialize grid with zoom level 1
      grid.updateForZoom(1)

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

        // Adjust zoom factor based on wheel direction
        zoom *= 0.999 ** delta

        // Limit zoom
        zoom = Math.max(ZOOM_MIN, Math.min(zoom, ZOOM_MAX))

        // Zoom to point
        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom)

        // Update grid pattern for new zoom level
        grid.updateForZoom(zoom)
      })

      // Handle window resize with padding
      const handleResize = () => {
        canvas.setDimensions({
          width: window.innerWidth - PADDING_LEFT - PADDING_RIGHT,
          height: window.innerHeight - PADDING_TOP,
        })
        canvas.requestRenderAll()
      }

      window.addEventListener("resize", handleResize)

      // Cleanup on unmount
      return () => {
        window.removeEventListener("resize", handleResize)
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
        }
      }
    }
  }, [])

  // Function to add a rectangle
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
    <div style={{ position: "relative" }}>
      <button style={{ position: "absolute", top: 20, left: 20, zIndex: 999 }} onClick={addRectangle}>
        Add Rectangle
      </button>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: PADDING_TOP,
          left: PADDING_LEFT,
          right: PADDING_RIGHT, 
        }}
      />
    </div>
  )
}

export default FabricComponent