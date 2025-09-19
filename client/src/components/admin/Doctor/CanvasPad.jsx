import React, { useRef, useEffect } from "react";

/**
 * Props:
 * - width (px), height (px)
 * - strokeStyle (color)
 * - lineWidth (number)
 * - onChange? (called on draw)
 * Methods returned via ref:
 * - toDataURL()
 * - clear()
 */
const CanvasPad = React.forwardRef(({ width = 600, height = 300, strokeStyle = "#000", lineWidth = 3, onChange }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const devicePixelRatio = window.devicePixelRatio || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Set canvas display size to match container
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    
    // Set actual size in memory (scaled for retina displays)
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Scale back down using CSS
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    const ctx = canvas.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }, []);

  // expose methods
  React.useImperativeHandle(ref, () => ({
    toDataURL: (type = "image/png", quality = 1.0) => canvasRef.current.toDataURL(type, quality),
    clear: () => {
      const ctx = canvasRef.current.getContext("2d");
      const canvas = canvasRef.current;
      ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
      if (onChange) onChange();
    }
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    if (e.touches && e.touches[0]) {
      return { 
        x: (e.touches[0].clientX - rect.left) * scaleX / devicePixelRatio, 
        y: (e.touches[0].clientY - rect.top) * scaleY / devicePixelRatio 
      };
    }
    return { 
      x: (e.clientX - rect.left) * scaleX / devicePixelRatio, 
      y: (e.clientY - rect.top) * scaleY / devicePixelRatio 
    };
  };

  const handleDown = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const handleMove = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    if (onChange) onChange();
  };

  const handleUp = (e) => {
    drawing.current = false;
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        style={{ touchAction: "none", background: "#fff", display: "block", width: "100%", height: "100%" }}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
      />
    </div>
  );
});

export default CanvasPad;