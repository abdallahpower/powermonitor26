import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import BusBar from '../components/BusBar';
import FeederCell from '../components/FeederCell';
import ConnectionLine from '../components/ConnectionLine';
import ElectricalSymbol from '../components/ElectricalSymbol';
import LiveReadingsBox from '../components/LiveReadingsBox';
import DraggableConnection from '../components/DraggableConnection';

const SingleLineDiagram = () => {
  const navigate = useNavigate();
  const { liveData } = useContext(DataContext);
  const [boxPosition, setBoxPosition] = useState({ x: 100, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setBoxPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  // Equipment data with live values for Cell 7
  const equipmentData = [
    { id: 'cell_7', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 7', liveData: true, isFeeder: true },
    { id: 'cell_4', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 4', isFeeder: true },
    { id: 'cell_6', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 6' },
    { id: 'cell_9', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 9' },
    { id: 'cell_10', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 10' },
    { id: 'cell_11', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 11' },
    { id: 'cell_5', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 5' },
    { id: 'cell_3', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 3' },
    { id: 'cell_2', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 2' },
    { id: 'cell_1', type: 'circuit_breaker', rating: '400A', label: 'FEEDER CELL 1' },
    { id: 'cip_station1', type: 'load', power: 2.5, voltage: 480, label: 'CIP STATION 1' },
    { id: 'cip_station2', type: 'load', power: 0.8, voltage: 480, label: 'CIP STATION 2' },
    { id: 'mixer_2l', type: 'load', power: 0.2, voltage: 480, label: 'MIXER 2L' },
    { id: 'mixer_500ml', type: 'load', power: 0.1, voltage: 480, label: 'MIXER 500ML' },
    { id: 'cip_station3', type: 'load', power: 1.7, voltage: 480, label: 'CIP STATION 3' },
    { id: 'prep_equipment1', type: 'load', power: 0.5, voltage: 480, label: 'PREP EQUIP 1' },
    { id: 'prep_equipment2', type: 'load', power: 0.3, voltage: 480, label: 'PREP EQUIP 2' }
  ];

  // Update Cell 7 data with live values
  const cell7 = equipmentData.find(item => item.id === 'feeder_cell_7');
  if (cell7 && liveData) {
    cell7.voltage = liveData['Voltage_L_L_Avg'];
    cell7.current = liveData['Current_Avg'];
    cell7.power = liveData['Active_Power_Total'];
  }

  // Electrical symbols
  const ElectricalSymbol = ({ type, width = 60, height = 40, label = '', status = 'CLOSED', rating = '', isFeeder = false }) => {
    const symbols = {
      utility: (
        <g>
          <circle cx={width/2} cy={height/2} r={height/3} fill="none" stroke="#000" strokeWidth="2"/>
          <circle cx={width/2} cy={height/2} r={height/6} fill="#000"/>
          <text x={width/2} y={height + 15} textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">
            {label}
          </text>
        </g>
      ),
      circuit_breaker: (
        <g>
          <rect x={width/2-15} y={height/2-8} width="30" height="16" fill="none" stroke="#000" strokeWidth="2"/>
          <rect x={width/2-12} y={height/2-5} width="24" height="10" 
                fill={isFeeder ? '#FFD700' : (status === 'CLOSED' ? '#90EE90' : '#FFB6C1')} 
                stroke="#000"/>
          <text x={width/2} y={height/2+2} textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">
            {isFeeder ? 'FC' : 'CB'}
          </text>
          <text x={width/2} y={height + 15} textAnchor="middle" fontSize="9" fill="#000" fontWeight="bold">
            {label}
          </text>
          <text x={width/2} y={height + 27} textAnchor="middle" fontSize="8" fill="#666">
            {rating}
          </text>
        </g>
      ),
      transformer: (
        <g>
          <circle cx={width/2-10} cy={height/2} r="12" fill="none" stroke="#000" strokeWidth="2"/>
          <circle cx={width/2+10} cy={height/2} r="12" fill="none" stroke="#000" strokeWidth="2"/>
          <text x={width/2} y={height + 15} textAnchor="middle" fontSize="9" fill="#000" fontWeight="bold">
            {label}
          </text>
          <text x={width/2} y={height + 27} textAnchor="middle" fontSize="8" fill="#666">
            1500kVA
          </text>
          <text x={width/2} y={height + 39} textAnchor="middle" fontSize="8" fill="#666">
            12.47kV/480V
          </text>
        </g>
      ),
      load: (
        <g>
          <rect x={width/2-15} y={height/2-10} width="30" height="20" fill="none" stroke="#000" strokeWidth="2"/>
          <path d={`M${width/2-10},${height/2-5} L${width/2+10},${height/2+5} M${width/2-10},${height/2+5} L${width/2+10},${height/2-5}`} 
                stroke="#000" strokeWidth="2"/>
          <text x={width/2} y={height + 15} textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">
            {label}
          </text>
        </g>
      )
    };

    return (
      <svg width={width} height={height + 50}>
        {symbols[type] || symbols.load}
      </svg>
    );
  };

  // Connection line component
  const ConnectionLine = ({ x1, y1, x2, y2, isVertical = false, hasJunction = false, strokeWidth = 2 }) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={strokeWidth}/>
      {hasJunction && (
        <circle cx={isVertical ? x1 : x2} cy={isVertical ? y2 : y1} r="3" fill="#000"/>
      )}
    </g>
  );

  // BusBar component
  const BusBar = ({ x1, y1, x2, y2, label }) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="3"/>
      <text x={(x1 + x2) / 2} y={y1 - 10} textAnchor="middle" fontSize="12" fill="#000">
        {label}
      </text>
    </g>
  );

  // FeederCell component
  const FeederCell = ({ x, y, label, type = 'normal' }) => (
    <g>
      <rect x={x - 20} y={y - 20} width="40" height="40" fill="#fff" stroke="#000" strokeWidth="1"/>
      <text x={x} y={y} textAnchor="middle" fontSize="10" fill="#000">
        {label}
      </text>
      {type === 'feeder' && (
        <circle cx={x} cy={y - 10} r="3" fill="#000"/>
      )}
      {type === 'coupler' && (
        <rect x={x - 5} y={y - 15} width="10" height="30" fill="#fff" stroke="#000" strokeWidth="1"/>
      )}
    </g>
  );

  // Text label component
  const TextLabel = ({ x, y, text, fontSize = 10, color = "#000", rotation = 0 }) => (
    <text 
      x={x} 
      y={y} 
      textAnchor="middle" 
      fontSize={fontSize} 
      fill={color} 
      fontWeight="bold"
      transform={rotation ? `rotate(${rotation} ${x} ${y})` : ''}
    >
      {text}
    </text>
  );

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="bg-white border-2 border-gray-800 p-8">
        <svg width="1400" height="1000" className="border border-gray-400">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ddd" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Main SLD */}
          <g transform="translate(250, 0)">

            
            {/* Feeder Cell 7 and its connections */}
            <g onClick={() => navigate('/metrics')}>
              <image x="175" y="175" width="50" height="50" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="200" y="230" textAnchor="middle" fontSize="12" fill="#000">
                Cell 7
              </text>
            </g>
            

            
            {/* Cells fed by Feeder Cell 7 */}
            <g>
              <image x="280" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="300" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 6
              </text>
            </g>
            <g>
              <image x="180" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="200" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 9
              </text>
            </g>
            <g>
              <image x="230" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="250" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 10
              </text>
            </g>
            <g>
              <image x="130" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="150" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 11
              </text>
            </g>
            
            {/* Feeder Cell 4 and its connections */}
            <g>
              <image x="680" y="180" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="700" y="225" textAnchor="middle" fontSize="10" fill="#000">
                Cell 4
              </text>
            </g>
            
            {/* Cells fed by Feeder Cell 4 */}
            <g>
              <image x="580" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="600" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 5
              </text>
            </g>
            <g>
              <image x="630" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="650" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 3
              </text>
            </g>
            <g>
              <image x="680" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="700" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 2
              </text>
            </g>
            <g>
              <image x="730" y="280" width="40" height="40" href="C:\Users\Hasan\Downloads\Abdallah\21-6\breaker_meter.svg"/>
              <text x="750" y="325" textAnchor="middle" fontSize="10" fill="#000">
                Cell 1
              </text>
            </g>
            
            {/* Feeder Cell 7 to Bus */}
            <ConnectionLine x1={200} y1={100} x2={200} y2={185} />
            
            {/* Feeder Cell 7 to its cells */}
            <ConnectionLine x1={200} y1={215} x2={200} y2={250} />
            <ConnectionLine x1={200} y1={250} x2={300} y2={250} />
            <ConnectionLine x1={200} y1={250} x2={250} y2={250} />
            <ConnectionLine x1={200} y1={250} x2={150} y2={250} />

            <ConnectionLine x1={300} y1={250} x2={300} y2={285} />
            <ConnectionLine x1={200} y1={250} x2={200} y2={285} />
            <ConnectionLine x1={250} y1={250} x2={250} y2={285} />
            <ConnectionLine x1={150} y1={250} x2={150} y2={285} />
            
            {/* Feeder Cell 4 to Bus */}
            <ConnectionLine x1={700} y1={100} x2={700} y2={185} />
            
            {/* Feeder Cell 4 to its cells */}
            <ConnectionLine x1={700} y1={215} x2={700} y2={250} />
            <ConnectionLine x1={600} y1={250} x2={750} y2={250} />
            <ConnectionLine x1={600} y1={250} x2={600} y2={285} />
            <ConnectionLine x1={650} y1={250} x2={650} y2={285} />
            <ConnectionLine x1={700} y1={250} x2={700} y2={285} />
            <ConnectionLine x1={750} y1={250} x2={750} y2={285} />
            
            {/* Cell 5 to Cell 6 connection with circuit breaker */}
            <DraggableConnection x1={600} y1={300} x2={300} y2={300}>
              <g transform="translate(450, 270)">
                <ElectricalSymbol type="circuit_breaker" label="" rating="50A" status="CLOSED" />
              </g>
            </DraggableConnection>
            

            
            {/* Live readings box for Cell 7 */}
            <LiveReadingsBox 
              boxPosition={boxPosition}
              isDragging={isDragging}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              liveData={liveData}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SingleLineDiagram;
