/**
 * StudySync — Whiteboard.js
 * Collaborative canvas with pan/zoom, stroke undo, flowchart shapes, and text tool
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Whiteboard.css';

const PRESET_COLORS = [
  '#1A1A1A', '#EA4335', '#FBBC04', '#34A853',
  '#4285F4', '#9334E6', '#E91E63', '#6C757D'
];

const SHAPE_TOOLS = ['rect', 'circle', 'diamond', 'arrow'];
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export default function Whiteboard({ socket, roomId, userName }) {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const allStrokes = useRef([]);
  const currentStrokeIdRef = useRef(null);

  const [color,        setColor       ] = useState('#1A1A1A');
  const [brushSize,    setBrushSize   ] = useState(3);
  const [tool,         setTool        ] = useState('pen');
  const [pan,          setPan         ] = useState({ x: 0, y: 0 });
  const [scale,        setScale       ] = useState(1);
  const [currentShape, setCurrentShape] = useState(null);


  // ── Draw a single stroke or shape on the canvas ────────────────
  const drawSingleStroke = useCallback((ctx, s) => {
    ctx.save();

    if (s.color === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
    }

    ctx.lineWidth = s.size;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';

    const { x0, y0, x1, y1 } = s;

    if (!s.type || s.type === 'pen' || s.type === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    } else if (s.type === 'rect') {
      ctx.beginPath();
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    } else if (s.type === 'circle') {
      const rx = Math.abs(x1 - x0) / 2;
      const ry = Math.abs(y1 - y0) / 2;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (s.type === 'diamond') {
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, y0);
      ctx.lineTo(x1, cy);
      ctx.lineTo(cx, y1);
      ctx.lineTo(x0, cy);
      ctx.closePath();
      ctx.stroke();
    } else if (s.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const arrowLen = Math.max(12, s.size * 3);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - arrowLen * Math.cos(angle - Math.PI / 6), y1 - arrowLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x1 - arrowLen * Math.cos(angle + Math.PI / 6), y1 - arrowLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, []);

  // ── Redraw all strokes with camera transforms ─────────────────
  const redrawAll = useCallback((strokes, currentPan, currentScale, activeShape) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(currentPan.x, currentPan.y);
    ctx.scale(currentScale, currentScale);

    strokes.forEach(s => drawSingleStroke(ctx, s));

    if (activeShape) {
      drawSingleStroke(ctx, {
        ...activeShape,
        color: color,
        size: brushSize
      });
    }
    ctx.restore();
  }, [drawSingleStroke, color, brushSize]);

  // ── Resize canvas to match parent ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      redrawAll(allStrokes.current, pan, scale, currentShape);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [redrawAll, pan, scale, currentShape]);

  useEffect(() => {
    redrawAll(allStrokes.current, pan, scale, currentShape);
  }, [pan, scale, currentShape, redrawAll]);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('get-whiteboard-state', roomId);

    socket.on('whiteboard-state', (strokes) => {
      allStrokes.current = strokes;
      redrawAll(strokes, pan, scale, currentShape);
    });

    socket.on('draw-update', (stroke) => {
      allStrokes.current.push(stroke);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(scale, scale);
        drawSingleStroke(ctx, stroke);
        ctx.restore();
      }
    });

    socket.on('board-cleared', () => {
      allStrokes.current = [];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    return () => {
      socket.off('whiteboard-state');
      socket.off('draw-update');
      socket.off('board-cleared');
    };
  }, [socket, roomId, drawSingleStroke, redrawAll, pan, scale, currentShape]);

  // ── Coordinate helpers ────────────────────────────────────────
  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function getVirtualPos(e) {
    const pos = getPos(e);
    return { x: (pos.x - pan.x) / scale, y: (pos.y - pan.y) / scale };
  }

  // ── Mouse handlers ────────────────────────────────────────────
  function onMouseDown(e) {
    if (e.target !== canvasRef.current) return;

    drawing.current = true;
    const strokeId = `s-${userName || 'u'}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    currentStrokeIdRef.current = strokeId;

    if (tool === 'pan') {
      lastPos.current = getPos(e);
    } else if (SHAPE_TOOLS.includes(tool)) {
      const vpos = getVirtualPos(e);
      lastPos.current = vpos;
      setCurrentShape({ type: tool, x0: vpos.x, y0: vpos.y, x1: vpos.x, y1: vpos.y, strokeId });
    } else {
      lastPos.current = getVirtualPos(e);
    }
  }

  function onMouseMove(e) {
    if (!drawing.current) return;

    if (tool === 'pan') {
      const curr = getPos(e);
      const prev = lastPos.current;
      setPan(p => ({ x: p.x + (curr.x - prev.x), y: p.y + (curr.y - prev.y) }));
      lastPos.current = curr;
      return;
    }

    const curr = getVirtualPos(e);

    if (SHAPE_TOOLS.includes(tool)) {
      setCurrentShape(prev => prev ? { ...prev, x1: curr.x, y1: curr.y } : null);
      return;
    }

    const prev = lastPos.current;
    const activeColor = tool === 'eraser' ? 'eraser' : color;
    const activeSize  = tool === 'eraser' ? brushSize * 4 : brushSize;

    const ctx = canvasRef.current.getContext('2d');
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);
    drawSingleStroke(ctx, { x0: prev.x, y0: prev.y, x1: curr.x, y1: curr.y, color: activeColor, size: activeSize, type: 'pen' });
    ctx.restore();

    const newStroke = { x0: prev.x, y0: prev.y, x1: curr.x, y1: curr.y, color: activeColor, size: activeSize, strokeId: currentStrokeIdRef.current, type: 'pen' };
    allStrokes.current.push(newStroke);
    socket.emit('drawing', { roomId, ...newStroke });
    lastPos.current = curr;
  }

  function onMouseUp() {
    if (!drawing.current) return;
    drawing.current = false;

    if (currentShape) {
      const finalShape = {
        x0: currentShape.x0, y0: currentShape.y0,
        x1: currentShape.x1, y1: currentShape.y1,
        color: color, size: brushSize,
        strokeId: currentStrokeIdRef.current, type: currentShape.type
      };
      allStrokes.current.push(finalShape);
      socket.emit('drawing', { roomId, ...finalShape });
      setCurrentShape(null);
    }
    currentStrokeIdRef.current = null;
  }

  // ── Zoom ──────────────────────────────────────────────────────
  function handleWheel(e) {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale + delta));
    if (newScale === scale) return;
    const r = newScale / scale;
    setScale(newScale);
    setPan({ x: mouseX - (mouseX - pan.x) * r, y: mouseY - (mouseY - pan.y) * r });
  }

  function zoomIn() {
    const ns = Math.min(MAX_ZOOM, scale + ZOOM_STEP);
    const c = canvasRef.current;
    if (!c) return;
    const cx = c.width / 2, cy = c.height / 2, r = ns / scale;
    setPan(p => ({ x: cx - (cx - p.x) * r, y: cy - (cy - p.y) * r }));
    setScale(ns);
  }

  function zoomOut() {
    const ns = Math.max(MIN_ZOOM, scale - ZOOM_STEP);
    const c = canvasRef.current;
    if (!c) return;
    const cx = c.width / 2, cy = c.height / 2, r = ns / scale;
    setPan(p => ({ x: cx - (cx - p.x) * r, y: cy - (cy - p.y) * r }));
    setScale(ns);
  }

  function handleExport() {
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  const TOOLS = [
    { id: 'pan',     label: '✋', title: 'Pan' },
    { id: 'pen',     label: '✏️', title: 'Pen' },
    { id: 'eraser',  label: '🧽', title: 'Eraser' },
    { id: 'rect',    label: '▭',  title: 'Rectangle' },
    { id: 'circle',  label: '○',  title: 'Circle' },
    { id: 'diamond', label: '◇',  title: 'Diamond' },
    { id: 'arrow',   label: '→',  title: 'Arrow' }
  ];

  const showColors = tool !== 'pan' && tool !== 'eraser';
  const showSize   = tool !== 'pan';

  return (
    <div className="wb">
      {/* ── Unified Toolbar ── */}
      <div className="wb__toolbar">
        {TOOLS.map(t => (
          <button
            key={t.id}
            id={`wb-tool-${t.id}`}
            className={`wb__tool-btn ${tool === t.id ? 'wb__tool-btn--active' : ''}`}
            onClick={() => setTool(t.id)}
            title={t.title}
          >
            {t.label}
          </button>
        ))}

        {showColors && (
          <>
            <span className="wb__divider" />
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`wb__color ${color === c ? 'wb__color--active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </>
        )}

        {showSize && (
          <>
            <span className="wb__divider" />
            <span className="wb__size-label">{brushSize}px</span>
            <input
              type="range" className="wb__size-range"
              min={1} max={24} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
            />
          </>
        )}

        <span className="wb__divider" />
        <button className="wb__action-btn" onClick={() => socket.emit('undo-stroke', roomId)} title="Undo">↶ Undo</button>
        <button className="wb__action-btn" onClick={() => socket.emit('clear-board', roomId)} title="Clear">Clear</button>
        <button className="wb__action-btn wb__action-btn--accent" onClick={handleExport} title="Export">↓ PNG</button>
      </div>

      {/* ── Zoom HUD ── */}
      <div className="wb__zoom-controls">
        <button className="wb__zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
        <button className="wb__zoom-level" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} title="Reset zoom">
          {Math.round(scale * 100)}%
        </button>
        <button className="wb__zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
      </div>

      {/* ── Canvas Area ── */}
      <div className="wb__area">
        <canvas
          ref={canvasRef}
          className={`wb__canvas ${tool === 'pan' ? 'wb__canvas--grab' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
}
