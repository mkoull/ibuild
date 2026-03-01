import { useRef, useCallback } from "react";
import _ from "../../theme/tokens.js";

export default function SignatureCanvas({ width = 500, height = 100, onSign }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);

  const refCb = useCallback(el => {
    if (!el) return;
    canvasRef.current = el;
    const c = el.getContext("2d");
    c.strokeStyle = _.ink;
    c.lineWidth = 2;
    c.lineCap = "round";
    c.lineJoin = "round";
    ctxRef.current = c;
  }, []);

  const getPos = e => {
    const r = canvasRef.current.getBoundingClientRect();
    const ev = e.touches ? e.touches[0] : e;
    return [ev.clientX - r.left, ev.clientY - r.top];
  };

  const start = e => {
    drawing.current = true;
    const [x, y] = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };
  const move = e => {
    if (!drawing.current) return;
    if (e.touches) e.preventDefault();
    const [x, y] = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    if (ctxRef.current && canvasRef.current)
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getData = () => canvasRef.current ? canvasRef.current.toDataURL() : null;

  return { canvasRef, refCb, clear, getData, handlers: {
    onMouseDown: start, onMouseMove: move, onMouseUp: end, onMouseLeave: () => { drawing.current = false; },
    onTouchStart: start, onTouchMove: move, onTouchEnd: end,
  }, width, height };
}
