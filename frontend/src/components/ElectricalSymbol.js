const ElectricalSymbol = ({ type, label, rating, status }) => {
  const width = 60;
  const height = 90;
  const x = 15;
  const y = 12;

  return (
    <g>
      <rect x={x} y={y} width="30" height="16" fill="none" stroke="#000" strokeWidth="2" />
      <rect x={x + 3} y={y + 3} width="24" height="10" fill="#90EE90" stroke="#000" />
      <text x={x + 15} y={y + 10} textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">
        CB
      </text>
      <text x={x + 15} y={y + 45} textAnchor="middle" fontSize="9" fill="#000" fontWeight="bold">
        {status}
      </text>
      <text x={x + 15} y={y + 57} textAnchor="middle" fontSize="8" fill="#666">
        {rating}
      </text>
    </g>
  );
};

export default ElectricalSymbol;
