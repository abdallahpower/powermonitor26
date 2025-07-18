const FeederCell = ({ x, y, label, type = 'normal' }) => (
  <g>
    <rect x={x - 20} y={y - 20} width="40" height="40" fill="#fff" stroke="#000" strokeWidth="1" />
    <text x={x} y={y} textAnchor="middle" fontSize="10" fill="#000">
      {label}
    </text>
    {type === 'feeder' && (
      <circle cx={x} cy={y - 10} r="3" fill="#000" />
    )}
    {type === 'coupler' && (
      <rect x={x - 5} y={y - 15} width="10" height="30" fill="#fff" stroke="#000" strokeWidth="1" />
    )}
  </g>
);

export default FeederCell;
