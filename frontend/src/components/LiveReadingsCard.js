import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Responsive, draggable live readings card rendered as a normal HTML element so it
 * naturally resizes with the page. All numeric conversions include safe fallbacks.
 */
const LiveReadingsCard = ({
  isDragging = false,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  liveData = {},
  cellPos,
  boxPosition,
  setBoxPosition,
  zoom = 1,
}) => {
  const navigate = useNavigate();
  const toNumber = (val, divisor = 1) => (Number(val) || 0) / divisor;
  const current = toNumber(liveData?.Current_Avg).toFixed(1);
  const voltLL = toNumber(liveData?.Voltage_L_L_Avg, 1000).toFixed(2);
  const voltLN = toNumber(liveData?.Voltage_L_N_Avg, 1000).toFixed(2);
  const power = toNumber(liveData?.Active_Power_Total).toFixed(2);
  const freq = toNumber(liveData?.Frequency).toFixed(1);
  const energy = toNumber(liveData?.Active_Energy).toFixed(2);

  // Power-factor parsing (handles "0.94 Lagging", numeric, etc.)
  const pfRaw = liveData?.Power_Factor_Total ?? '';
  const pfStr = pfRaw.toString().trim();
  const match = pfStr.match(/[-+]?[0-9]*\.?[0-9]+/);
  const pfNum = match ? parseFloat(match[0]) : null;
  let direction = 'Lag';
  if (/lead/i.test(pfStr)) direction = 'Lead';
  else if (/lag/i.test(pfStr)) direction = 'Lag';
  else if (pfNum !== null && pfNum < 0) direction = 'Lead';
  const pfDisplay = pfNum !== null ? `${Math.abs(pfNum).toFixed(2)} ${direction}` : pfStr || 'N/A';

  // click vs drag handling + internal drag
  const downPos = useRef(null);
  const startBoxPos = useRef(null);
  const draggingRef = useRef(false);

  const onWindowMove = (e) => {
    if (!draggingRef.current || !startBoxPos.current || !downPos.current) return;
    const newX = startBoxPos.current.x + (e.clientX - downPos.current.x);
    const newY = startBoxPos.current.y + (e.clientY - downPos.current.y);
    if (setBoxPosition) setBoxPosition({ x: newX, y: newY });
    if (handleMouseMove) handleMouseMove(e);
  };
  const onWindowUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    window.removeEventListener('mousemove', onWindowMove);
    window.removeEventListener('mouseup', onWindowUp);
    if (handleMouseUp) handleMouseUp(e);
  };

  const handleDown = (e) => {
    downPos.current = { x: e.clientX, y: e.clientY };
    startBoxPos.current = boxPosition ? { ...boxPosition } : { x: 0, y: 0 };
    draggingRef.current = true;
    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('mouseup', onWindowUp);
    if (handleMouseDown) handleMouseDown(e);
  };

  // Clean up listeners on unmount
  useEffect(() => () => {
    window.removeEventListener('mousemove', onWindowMove);
    window.removeEventListener('mouseup', onWindowUp);
  }, []);

  return (
    <div
      onMouseDown={handleDown}
      onDoubleClick={() => navigate('/dashboard')}
      style={{
        width: 'clamp(260px, 22vw, 380px)',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #000',
        borderRadius: 6,
        boxShadow: '2px 2px 6px rgba(0,0,0,0.25)',
        cursor: draggingRef.current ? 'grabbing' : 'grab',
        fontSize: '0.85rem',
        userSelect: 'none',
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          background: '#004d99',
          color: '#fff',
          fontWeight: 'bold',
          padding: '6px 0',
          textAlign: 'center',
          borderRadius: '6px 6px 0 0',
        }}
      >
        Live Readings – Cell 7
      </div>
      <div style={{ padding: '10px 14px', lineHeight: '1.5em' }}>
        <div>Current: {current} A</div>
        <div>Voltage (LL): {voltLL} kV</div>
        <div>Voltage (LN): {voltLN} kV</div>
        <div>Power: {power} MW</div>
        <div>PF: {pfDisplay}</div>
        <div>Freq: {freq} Hz</div>
        <div>Energy: {energy} MWh</div>
      </div>
    </div>
  );
};

export default LiveReadingsCard;
