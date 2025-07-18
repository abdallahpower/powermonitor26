import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Handle,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import breakerMeter from '../assets/breaker_meter.svg';
import './ReactFlowSLD.css';
import LiveReadingsCard from '../components/LiveReadingsCard';
import { DataContext } from '../context/DataContext';

// Custom edge style to match busbar
const edgeTypes = {
  busbarEdge: ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) => {
    const source = { x: sourceX, y: sourceY };
    const target = { x: targetX, y: targetY };

    // Build a simple right-angle path that runs horizontally to a midpoint,
    // then vertically to the target.  This keeps the arrow head flush with the
    // node handle, so the nodes appear attached directly to the arrow tip.
    // We want the arrow tip to sit right on the edge of the node rather than at
    // the centre of the 10×10 handle.  Each handle is 10 px wide, so nudging
    // the coordinates by ±5 px removes the visual gap.
    const sy = source.y;
    const ty = target.y;

    // Draw a symmetric Manhattan path: go vertical to a midpoint between source
    // and target, then horizontal across, then vertical into the target.  This
    // keeps the line centred with respect to both nodes and avoids horizontal
    // entry into a top/bottom handle.
    const midY = (sy + ty) / 2;
    const path = `M ${source.x} ${sy} L ${source.x} ${midY} L ${target.x} ${midY} L ${target.x} ${ty}`;

    return (
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={{ stroke:'#000', strokeWidth:2, fill:'none', ...style }}
        markerEnd={markerEnd}
      />
    );
  }
};

// Helper function to calculate the minimum path using horizontal/vertical segments
const calculatePath = (sx, sy, tx, ty) => {
  // Calculate the middle point
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  // Create the path with minimum segments
  return `M${sx},${sy} 
          H${mx} 
          V${my} 
          H${tx} 
          V${ty}`;
};

const initialNodes = [
  // Group 1 (Cell 7 and its outputs)
  { id: 'cell_7', type: 'cell', data: { label: 'Cell 7 (Feeder)' }, position: { x: 100, y: 100 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_6', type: 'cell', data: { label: 'Cell 6 (Outgoing)' }, position: { x: 0, y: 200 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_9', type: 'cell', data: { label: 'Cell 9 (Outgoing)' }, position: { x: 100, y: 200 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_10', type: 'cell', data: { label: 'Cell 10 (Outgoing)' }, position: { x: 200, y: 200 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_11', type: 'cell', data: { label: 'Cell 11 (Outgoing)' }, position: { x: 300, y: 200 }, style: { width: '60px', height: '60px' } },

  // Group 2 (Cell 4 and its outputs)
  { id: 'cell_4', type: 'cell', data: { label: 'Cell 4 (Feeder)' }, position: { x: 100, y: 400 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_1', type: 'cell', data: { label: 'Cell 1 (Outgoing)' }, position: { x: 0, y: 500 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_2', type: 'cell', data: { label: 'Cell 2 (Outgoing)' }, position: { x: 100, y: 500 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_3', type: 'cell', data: { label: 'Cell 3 (Outgoing)' }, position: { x: 200, y: 500 }, style: { width: '60px', height: '60px' } },
  { id: 'cell_5', type: 'cell', data: { label: 'Cell 5 (Outgoing)' }, position: { x: 300, y: 500 }, style: { width: '60px', height: '60px' } },

  // Horizontal busbars
  { id: 'busbar_7', type: 'busbar', data: { label: 'Group 1 Busbar', orientation: 'horizontal' }, position: { x: 0, y: 200 }, style: { width: '400px', height: '6px' } },
  { id: 'busbar_4', type: 'busbar', data: { label: 'Group 2 Busbar', orientation: 'horizontal' }, position: { x: 0, y: 500 }, style: { width: '400px', height: '6px' } }
].map((n, idx) => ({ ...n, data: { ...n.data, serial: idx + 1 } }));

const ensureSerials = (arr) => arr.map((n, idx) => ({ ...n, data: { ...n.data, serial: n.data?.serial ?? idx + 1 } }));

const initialEdges = [];

function ReactFlowSLD() {
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('sld-nodes');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ensureSerials(initialNodes);
  });
  const [edges, setEdges] = useState(() => {
    const saved = localStorage.getItem('sld-edges');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return initialEdges;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  // Track current zoom to scale live readings dialog
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [connectMode, setConnectMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedForConnection, setSelectedForConnection] = useState([]);
  const [sourceSerial, setSourceSerial] = useState('');
  const [targetSerial, setTargetSerial] = useState('');

  // Live readings overlay state
  const { liveData } = useContext(DataContext);
  const [showLiveBox] = useState(true);
  // currently focused cell for live readings overlay
  const [activeCellId, setActiveCellId] = useState('cell_7');

  // restore saved dialog position (if any)
  const savedPosStr = localStorage.getItem('liveBoxPos');
  let initialBoxPos = { x: 0, y: 0 };
  let savedPosExistsFlag = false;
  if (savedPosStr) {
    try {
      const p = JSON.parse(savedPosStr);
      if (typeof p?.x === 'number' && typeof p?.y === 'number') {
        initialBoxPos = p;
        savedPosExistsFlag = true;
      }
    } catch {}
  }

  const [boxPosition, _setBoxPosition] = useState(initialBoxPos);
  const setBoxPosition = useCallback((pos) => {
    _setBoxPosition(pos);
    localStorage.setItem('liveBoxPos', JSON.stringify(pos));
  }, []);

  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // if we loaded a saved position, treat as user-moved to skip auto align
  const [userMoved, setUserMoved] = useState(savedPosExistsFlag);
  const [cellPagePos, setCellPagePos] = useState(null);



  const updateCellPagePos = useCallback(() => {
    const el = document.querySelector(`.react-flow__node[data-id="${activeCellId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setCellPagePos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  }, []);

  // Sync overlay with viewport movement & track zoom
  const handleViewportMove = useCallback((evt, viewport) => {
    updateCellPagePos();
    if (viewport?.zoom) {
      setZoom(viewport.zoom);
    }
  }, [updateCellPagePos]);

  const handleBoxMouseDown = (e) => {
    setIsDraggingBox(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handleBoxMouseMove = (e) => {
    if (!isDraggingBox) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setBoxPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Attach global mouse listeners so dragging continues outside the box bounds
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingBox) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setBoxPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    const handleUp = () => setIsDraggingBox(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingBox, dragStart]);
  const handleBoxMouseUp = () => {
    setIsDraggingBox(false);
    setUserMoved(true); // stop auto realign after manual placement
  };

  // Auto-position overlay near the active cell when layout changes, unless user has manually moved it
  useEffect(() => {
    if (userMoved) return;
    const focusNode = nodes.find((n) => n.id === activeCellId);
    if (focusNode) {
      setBoxPosition({ x: focusNode.position.x + 140, y: focusNode.position.y + 50 });
    }
  }, [nodes, activeCellId, userMoved]);

  // keep arrow in sync with cell position
  useEffect(() => {
    updateCellPagePos();
  }, [nodes, updateCellPagePos]);
  
  // Build selectable handle list (with role) for dropdowns
  const handleOptions = useMemo(() => {
    const opts = [];
    nodes.forEach((n) => {
      if (n.type === 'cell') {
        // top input
        opts.push({ value: `${n.id}|top`, label: `${n.data.serial}.0 - ${n.data.label} IN`, role: 'target' });
        // bottom output
        opts.push({ value: `${n.id}|bottom`, label: `${n.data.serial}.1 - ${n.data.label} OUT`, role: 'source' });
      } else if (n.type === 'busbar') {
        // top source
        opts.push({ value: `${n.id}|top`, label: `${n.data.serial}.0 - ${n.data.label} SRC`, role: 'source' });
        // five bottom targets
        for (let i = 0; i < 5; i++) {
          opts.push({ value: `${n.id}|bottom-${i}`, label: `${n.data.serial}.${i + 1} - ${n.data.label} PT${i + 1}`, role: 'source' });
        }
      }
    });
    return opts;
  }, [nodes]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  // persist layout
  useEffect(() => {
    localStorage.setItem('sld-nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('sld-edges', JSON.stringify(edges));
  }, [edges]);

  // track selected nodes to support keyboard movement
  const onSelectionChange = ({ nodes: selected }) => {
    setSelectedNodeIds(selected.map((n) => n.id));
  };

  // move selected nodes with arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      const step = 10;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowUp':
          dy = -step;
          break;
        case 'ArrowDown':
          dy = step;
          break;
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        default:
          return;
      }
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setNodes((nds) =>
          nds.map((node) =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
              : node
          )
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, setNodes]);

  const nodeTypes = {
    cell: ({ id, data }) => (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#e6f1ff',
          border: '1px solid #3f51b5',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <Handle type="target" position="top" id="top" style={{ background: '#000', width: 10, height: 10, borderRadius: 5 }} />
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>{data?.label}</span>
        <Handle type="source" position="bottom" id="bottom" style={{ background: '#000', width: 10, height: 10, borderRadius: 5 }} />
      </div>
    ),

    busbar: ({ data }) => {
      const isVertical = data?.orientation === 'vertical';
      const isUp = data?.label?.includes('Up');
      const handlePositions = [2.5, 27.5, 52.5, 77.5];
      return (
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <div style={{ 
            width: isVertical ? '6px' : '100%',
            height: isVertical ? '100%' : '6px',
            backgroundColor: '#000',
            border: '2px solid #333',
            borderRadius: '3px',
            position: 'relative',
            top: isVertical ? (isUp ? '100%' : '0') : '50%',
            left: isVertical ? '50%' : '0',
            transform: isVertical ? (isUp ? 'translateY(-100%)' : 'translateX(-50%)') : 'translateY(-50%)'
          }} />
          {/* Dynamic handles for horizontal busbar */}
          {!isVertical && handlePositions.map((left, idx) => (
            <Handle
              key={`busbar-btm-${idx}`}
              type="source"
              position="bottom"
              id={`bottom-${idx}`}
              style={{ left: `${left}%`, background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }}
            />
          ))}
          {/* Central target handle for feeder connection */}
          {!isVertical && (
            <Handle
              type="target"
              position="top"
              id="top"
              style={{ left: '50%', background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }}
            />
          )}
          {/* Handles for vertical busbars */}
          {isVertical && (
            <>
              <Handle
                type="source"
                position={isUp ? "top" : "bottom"}
                id={isUp ? "top" : "bottom"}
                style={{ background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2 }}
              />
              <Handle
                type="target"
                position={isUp ? "bottom" : "top"}
                id={isUp ? "bottom" : "top"}
                style={{ background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2 }}
              />
            </>
          )}

        </div>
      );
    },
    circuitBreaker: ({ data }) => {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0',
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <Handle type="target" position="top" id="top" style={{ left: '15%', background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }} />
          <img src={breakerMeter} alt="Circuit Breaker" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 2 }} />
          <Handle type="source" position="bottom" id="bottom" style={{ left: '15%', background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 4, fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', color: '#000', zIndex: 2 }}>{data?.label || 'CB'}</div>
        </div>
      );
    },
    cell: ({ data }) => {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0',
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <Handle type="target" position="top" id="top" style={{ left: '15%', background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }} />
          <img src={breakerMeter} alt="Cell" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 2 }} />
          <Handle type="source" position="bottom" id="bottom" style={{ left: '15%', background: '#000', width: 10, height: 10, borderRadius: 5, zIndex: 2, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 4, fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', color: '#000', zIndex: 2 }}>{data?.label || 'Cell'}</div>
        </div>
      );
    }
  };


  const onConnect = (params) => {
    // Check if connection already exists
    const existingEdge = edges.find(
      (edge) =>
        edge.source === params.source &&
        edge.sourceHandle === params.sourceHandle &&
        edge.target === params.target &&
        edge.targetHandle === params.targetHandle
    );

    if (!existingEdge) {
      setEdges((eds) => addEdge({ ...params, type: 'busbarEdge' }, eds));
    }
  };

  const onEdgeClick = (event, edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  };

  const handleCreateConnectionBySerial = () => {
    if (!sourceSerial || !targetSerial || sourceSerial === targetSerial) return;

    const [srcId, srcHandle] = sourceSerial.split('|');
    const [tgtId, tgtHandle] = targetSerial.split('|');
    if (!srcId || !tgtId) return;

    onConnect({ source: srcId, sourceHandle: srcHandle, target: tgtId, targetHandle: tgtHandle });

    // clear once connected
    setSourceSerial('');
    setTargetSerial('');
  };

  const onNodeClick = (event, node) => {
    if (connectMode) {
      if (selectedForConnection.length === 0) {
        setSelectedForConnection([node.id]);
      } else {
        const source = selectedForConnection[0];
        const target = node.id;
        if (source !== target) {
          onConnect({ source, target });
        }
        setSelectedForConnection([]);
        setConnectMode(false);
      }
      return; // don't run default navigation logic when in connect mode
    }

    // Show live readings near the clicked cell
    if (node.type === 'cell') {
      setActiveCellId(node.id);
      setUserMoved(false);
      setBoxPosition({ x: node.position.x + 140, y: node.position.y + 50 });
    }
  };

  const onConnectStart = (event, connection) => {
    setIsConnecting(true);
  };

  const onConnectEnd = (event, connection) => {
    setIsConnecting(false);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden',
      background: '#fff'
    }}>





      <button
        onClick={() => {
          setEditMode((prev) => {
            if (prev) {
              setSourceSerial('');
              setTargetSerial('');
            }
            return !prev;
          });
        }}
        style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
      >
        {editMode ? 'Exit Edit' : 'Edit Mode'}
      </button>

      {editMode && (
        
        <div style={{ position: 'absolute', top: 50, left: 10, zIndex: 10, background: '#fff', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 }}>
        <div style={{ fontSize: 14, marginBottom: 4 }}>Connect by Serial</div>
        <select value={sourceSerial} onChange={(e) => setSourceSerial(e.target.value)} style={{ marginRight: 4 }}>
          <option value="">Source</option>
          {handleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select value={targetSerial} onChange={(e) => setTargetSerial(e.target.value)} style={{ marginRight: 4 }}>
          <option value="">Target</option>
          {handleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button onClick={handleCreateConnectionBySerial} style={{ padding: '2px 6px' }}>Connect</button>
        </div>
      )}

      {showLiveBox && (
        <div style={{ position: 'absolute', top: boxPosition.y, left: boxPosition.x, zIndex: 20 }}>
          <LiveReadingsCard
            isDragging={isDraggingBox}
            handleMouseDown={handleBoxMouseDown}
            handleMouseMove={handleBoxMouseMove}
            handleMouseUp={handleBoxMouseUp}
            liveData={liveData}
            boxPosition={boxPosition}
            setBoxPosition={setBoxPosition}
             zoom={zoom}
            cellPos={cellPagePos}
          />
        </div>
      )}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 20px',
          borderRadius: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          border: '1px solid #ddd'
        }}>
          One Line Diagram
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onSelectionChange={onSelectionChange}
          onEdgeClick={onEdgeClick}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionOnDrag
          multiSelectionKeyCode="Shift"
          isConnecting={isConnecting}
          defaultEdgeOptions={{
            type: 'busbarEdge',
            style: { stroke: '#000', strokeWidth: 4 }
          }}
          fitView
          nodesDraggable={editMode}
          nodesConnectable={editMode}
          elementsSelectable={editMode}
          panOnScroll
          zoomOnScroll={!isDraggingBox}
          zoomOnPinch
          panOnDrag={!isDraggingBox}
          onMove={handleViewportMove}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default ReactFlowSLD;