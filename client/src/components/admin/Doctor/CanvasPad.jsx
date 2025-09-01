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
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }, []);

  // expose methods
  React.useImperativeHandle(ref, () => ({
    toDataURL: (type = "image/png", quality = 1.0) => canvasRef.current.toDataURL(type, quality),
    clear: () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (onChange) onChange();
    }
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
    <div style={{ border: "1px solid #ddd", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ touchAction: "none", background: "#fff", display: "block" }}
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
