import { useState, useRef, useEffect } from 'react';

const DraggableConnection = ({ x1, y1, x2, y2, children }) => {
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [startX, setStartX] = useState(x1);
  const [startY, setStartY] = useState(y1);
  const [endX, setEndX] = useState(x2);
  const [endY, setEndY] = useState(y2);
  const ref = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setOffsetX(e.clientX - startX);
    setOffsetY(e.clientY - startY);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    
    // Update both start and end points to maintain relative positions
    const deltaX = newX - startX;
    const deltaY = newY - startY;
    
    setStartX(newX);
    setStartY(newY);
    setEndX(endX + deltaX);
    setEndY(endY + deltaY);
  };

  const handleMouseUp = () => {
    setDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (dragging) {
      ref.current.style.cursor = 'grabbing';
    } else {
      ref.current.style.cursor = 'grab';
    }
  }, [dragging]);

  return (
    <g
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#000" strokeWidth="2" />
      {children}
    </g>
  );
};

export default DraggableConnection;
