import React, { useMemo } from 'react';

/*
  A thin wrapper around `react-gauge-chart` that supports
  variable thresholds.
  
  Props
  -----
  value:        number   // current value
  minValue:     number   // gauge minimum
  maxValue:     number   // gauge maximum
  thresholds:   Array<{  // thresholds sorted ascending by value
     value: number,
     color: string
  }>
*/

export const DIAL_FONT_SIZE = 20;

const MultiThresholdSpeedometer = ({ value = 0, minValue = 0, maxValue = 100, thresholds = [], unit = '', degreeLabelMode = 'auto', showPointer = true, majorTicks = 7, asPercentage = false, percentageBase = 100 }) => {
  // Ensure min<max
  if (maxValue <= minValue) maxValue = minValue + 1;

  // Sort thresholds once
  const sortedThresholds = useMemo(() => [...thresholds].sort((a, b) => a.value - b.value), [thresholds]);

  // Helper: get color zone for value
  const currentZone = useMemo(() => {
    for (let i = 0; i < sortedThresholds.length; i++) {
      if (value <= sortedThresholds[i].value) return sortedThresholds[i];
    }
    return sortedThresholds[sortedThresholds.length - 1] || { color: '#10b981', name: '' };
  }, [value, sortedThresholds]);

  const pointerAngle = useMemo(() => {
    // Map value proportionally across arc (-90 to 90)
    const clamped = Math.min(Math.max(value, minValue), maxValue);
    return -90 + ((clamped - minValue) / (maxValue - minValue)) * 180;
  }, [value, minValue, maxValue]);

  // SVG geometry helpers
  const centerX = 110; // shift left to reduce right blank
  // Shift center down slightly so stroke stays inside viewBox
  const centerY = 100;
  const radius = 85;
  const strokeWidth = 14;

  const createArcPath = (startAngle, endAngle) => {
    const start = {
      x: Math.cos((startAngle - 90) * Math.PI / 180) * radius + centerX,
      y: Math.sin((startAngle - 90) * Math.PI / 180) * radius + centerY,
    };
    const end = {
      x: Math.cos((endAngle - 90) * Math.PI / 180) * radius + centerX,
      y: Math.sin((endAngle - 90) * Math.PI / 180) * radius + centerY,
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const arcs = useMemo(() => {
    const list = [];
    let prevAngle = -90;
    sortedThresholds.forEach((thr, idx) => {
      const thrAngle = -90 + ((thr.value - minValue) / (maxValue - minValue)) * 180;
      list.push(
        <path key={`arc-${idx}`} d={createArcPath(prevAngle, thrAngle)} fill="none" stroke={thr.color} strokeWidth={strokeWidth} strokeLinecap="round" />
      );
      prevAngle = thrAngle;
    });
    // tail arc
    if (sortedThresholds.length) {
      list.push(
        <path key="arc-final" d={createArcPath(prevAngle, 90)} fill="none" stroke={sortedThresholds[sortedThresholds.length-1].color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.6} />
      );
    } else {
      list.push(
        <path key="arc-full" d={createArcPath(-90,90)} fill="none" stroke="#10b981" strokeWidth={strokeWidth} strokeLinecap="round" />
      );
    }
    return list;
  }, [sortedThresholds, minValue, maxValue]);

  const ticks = useMemo(() => {
    const elements = [];
    const majorInner = radius + 5;
    const majorOuter = radius + 22;
    const minorInner = radius + 10;
    const minorOuter = radius + 17;
    const majorTickCount = Math.max(2, majorTicks);
    const minorTicksPerMajor = 5;

    const range = maxValue - minValue;

    for (let i = 0; i < majorTickCount; i++) {
      const tickValue = minValue + (range * i) / (majorTickCount - 1);
      const angle = -90 + (i * 180) / (majorTickCount - 1);
      const x1 = Math.cos((angle - 90) * Math.PI / 180) * majorInner;
      const y1 = Math.sin((angle - 90) * Math.PI / 180) * majorInner;
      const x2 = Math.cos((angle - 90) * Math.PI / 180) * majorOuter;
      const y2 = Math.sin((angle - 90) * Math.PI / 180) * majorOuter;
      elements.push(
        <g key={`major-${i}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="none" strokeWidth={3} transform={`translate(${centerX},${centerY})`} />
          {((degreeLabelMode !== 'hide') || i === 0 || i === majorTickCount - 1) && (
            <text x={Math.cos((angle - 90) * Math.PI / 180) * 70 + centerX} y={Math.sin((angle - 90) * Math.PI / 180) * 70 + centerY} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#111827' }}>
              {degreeLabelMode === 'int' ? Math.round(tickValue)
                : degreeLabelMode === 'float' ? tickValue.toFixed(2)
                : (maxValue - minValue) <= 1 ? tickValue.toFixed(2) : (maxValue - minValue) <= 10 ? tickValue.toFixed(1) : Math.round(tickValue)}
            </text>
          )}
        </g>
      );

      // minor ticks
      if (i < majorTickCount -1) {
        const startAngle = angle;
        const endAngle = -90 + ((i+1)*180)/(majorTickCount-1);
        const angleStep = (endAngle - startAngle)/minorTicksPerMajor;
        for(let j=1;j<minorTicksPerMajor;j++){
          const minorAng = startAngle + j*angleStep;
          elements.push(
            <line key={`minor-${i}-${j}`} x1={Math.cos((minorAng - 90)*Math.PI/180)*minorInner} y1={Math.sin((minorAng - 90)*Math.PI/180)*minorInner} x2={Math.cos((minorAng - 90)*Math.PI/180)*minorOuter} y2={Math.sin((minorAng - 90)*Math.PI/180)*minorOuter} stroke="none" strokeWidth={1.5} transform={`translate(${centerX},${centerY})`} />
          );
        }
      }
    }
    return elements;
  }, [minValue, maxValue, degreeLabelMode, majorTicks]);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', minWidth:140, minHeight:100 }}>
      <svg width="100%" height="100%" viewBox="0 0 220 200" preserveAspectRatio="xMidYMid meet">
        {arcs}
        {ticks}
        {/* pointer */}
        {showPointer && (
          <g transform={`translate(${centerX},${centerY}) rotate(${pointerAngle})`}>
            <line x1="0" y1="0" x2="0" y2="-60" stroke={currentZone.color} strokeWidth={3} strokeLinecap="round" />
            <circle cx="0" cy="0" r="6" fill={currentZone.color} />
          </g>
        )}
        {/* numeric readout inside svg for automatic scaling */}
        {asPercentage && percentageBase > 0 && (
          <text x={centerX} y="140" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: DIAL_FONT_SIZE, fontWeight: 700, fill: currentZone.color }}>
            {`${((value / percentageBase) * 100).toFixed(1)} %`}
          </text>
        )}
        <text x={centerX} y="158" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: DIAL_FONT_SIZE, fontWeight: 700, fill: currentZone.color }}>
          {isFinite(value) ? `${value.toFixed(2)} ${unit}` : '--'}
        </text>
      </svg>
    </div>
  );
};
export default MultiThresholdSpeedometer;
