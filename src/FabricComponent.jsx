// src/Canvas.tsx
import React, { useEffect, useRef } from "react";
import { Canvas, Rect, Line } from "fabric";

const FabricComponent = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // Function to draw the grid dynamically based on zoom and pan
  const drawGrid = (canvas) => {
    const gridSize = 50;
    const zoom = canvas.getZoom();
    const width = canvas.getWidth() / zoom;
    const height = canvas.getHeight() / zoom;
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const panX = vpt[4] / zoom;
    const panY = vpt[5] / zoom;

    // Remove existing grid lines
    canvas.getObjects().forEach((obj) => {
      if (!obj.selectable) {
        canvas.remove(obj);
      }
    });

    // Draw vertical grid lines
    for (let x = panX % gridSize; x < width + panX; x += gridSize) {
      canvas.add(
        new Line([x, -height, x, height * 2], {
          stroke: "#ccc",
          selectable: false,
          evented: false,
        })
      );
    }

    // Draw horizontal grid lines
    for (let y = panY % gridSize; y < height + panY; y += gridSize) {
      canvas.add(
        new Line([-width, y, width * 2, y], {
          stroke: "#ccc",
          selectable: false,
          evented: false,
        })
      );
    }

    // Ensure grid lines are at the back by re-adding selectable objects
    const selectableObjects = canvas.getObjects().filter((obj) => obj.selectable);
    selectableObjects.forEach((obj) => {
      canvas.remove(obj);
      canvas.add(obj); // Re-adding moves it to the top
    });
  };

  useEffect(() => {
    let canvas = null;

    if (canvasRef.current && !fabricCanvasRef.current) {
      canvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#f0f0f0",
        selection: true, // Enable object selection
      });
      fabricCanvasRef.current = canvas;

      // Panning logic (infinite canvas)
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      canvas.on("mouse:down", (opt) => {
        const evt = opt.e ;
        if (!opt.target) { // Only pan if no object is selected
          isDragging = true;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      });

      canvas.on("mouse:move", (opt) => {
        if (isDragging) {
          const evt = opt.e ;
          const deltaX = evt.clientX - lastPosX;
          const deltaY = evt.clientY - lastPosY;
          const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
          vpt[4] += deltaX; // Pan horizontally
          vpt[5] += deltaY; // Pan vertically
          canvas.setViewportTransform(vpt);
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          canvas.requestRenderAll();
        }
      });

      canvas.on("mouse:up", () => {
        isDragging = false;
      });

      // Zoom logic
      canvas.on("mouse:wheel", (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.max(0.1, Math.min(zoom, 5)); // Limit zoom between 0.1x and 5x
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
        canvas.requestRenderAll();
      });

      // Optimize grid rendering
      let lastZoom = canvas.getZoom();
      let lastVpt = canvas.viewportTransform?.slice() || [1, 0, 0, 1, 0, 0];
      canvas.on("after:render", () => {
        const currentZoom = canvas.getZoom();
        const currentVpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        if (
          currentZoom !== lastZoom ||
          currentVpt[4] !== lastVpt[4] ||
          currentVpt[5] !== lastVpt[5]
        ) {
          drawGrid(canvas);
          lastZoom = currentZoom;
          lastVpt = currentVpt.slice();
        }
      });

      // Initial grid render
      drawGrid(canvas);
    }

    // Cleanup on unmount
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

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
      });
      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.setActiveObject(rect);
      fabricCanvasRef.current.requestRenderAll();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        style={{ position: "absolute", top: 10, left: 10, zIndex: 999 }}
        onClick={addRectangle}
      >
        Add Rectangle
      </button>
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0 }} />
    </div>
  );
};

export default FabricComponent;