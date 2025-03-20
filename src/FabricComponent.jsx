import React, { useEffect, useRef } from "react";
import { Canvas, Rect, Circle, FabricText } from "fabric";

const FabricComponent = () => {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f5f5f5",
    });

    return () => {
      fabricCanvas.current.dispose();
    };
  }, []);

  const addRectangle = () => {
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: "blue",
      width: 150,
      height: 100,
    });
    fabricCanvas.current.add(rect);
  };

  const addCircle = () => {
    const circle = new Circle({
      left: 200,
      top: 200,
      fill: "green",
      radius: 50,
    });
    fabricCanvas.current.add(circle);
  };

  const addText = () => {
    const text = new FabricText("Hello Fabric.js", {
      left: 300,
      top: 150,
      fontSize: 24,
      fill: "black",
    });
    fabricCanvas.current.add(text);
  };

  const clearCanvas = () => {
    fabricCanvas.current.clear();
    fabricCanvas.current.setBackgroundColor("#f5f5f5", fabricCanvas.current.renderAll.bind(fabricCanvas.current));
  };

  const exportImage = () => {
    const dataURL = fabricCanvas.current.toDataURL({
      format: "png",
      quality: 1.0,
    });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas-image.png";
    link.click();
  };

  return (
    <div>
         <div style={{ marginTop: 10 }}>
        <button onClick={addRectangle}>Add Rectangle</button>
        <button onClick={addCircle}>Add Circle</button>
        <button onClick={addText}>Add Text</button>
        <button onClick={clearCanvas}>Clear Canvas</button>
        <button onClick={exportImage}>Export as Image</button>
      </div>
      <canvas ref={canvasRef} />

     
    </div>
  );
};

export default FabricComponent;
