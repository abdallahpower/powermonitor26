const BusBar = ({ x1, y1, x2, y2, label }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="3" />
    <text x={(x1 + x2) / 2} y={y1 - 10} textAnchor="middle" fontSize="12" fill="#000">
      {label}
    </text>
  </g>
);

export default BusBar;
