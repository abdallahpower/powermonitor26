import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart as RBChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * BarChart component backed by Recharts.
 * Accepts data in the same structure formerly used for Chart.js:
 * {
 *   labels: [...],
 *   datasets: [{ label, data, backgroundColor? }]
 * }
 */
const PowerBarChart = ({ data, isLoading, isSummarized = false }) => {
  const theme = useTheme();
  const [hiddenKeys, setHiddenKeys] = useState([]);

  // Convert Chart.js style data into Recharts array-of-objects format
  const formattedData = useMemo(() => {
    if (!data || !data.labels || !data.datasets) return [];
    return data.labels.map((label, idx) => {
      const obj = { name: label };
      data.datasets.forEach((ds) => {
        obj[ds.label] = ds.data[idx];
      });
      return obj;
    });
  }, [data]);

  return (
    <Box sx={{ position: 'relative', height: 500 }}>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RBChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            height={60}
            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
            minTickGap={15}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals />
          <Tooltip wrapperStyle={{ fontSize: 12 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
            onClick={(o) => {
              const { value } = o;
              setHiddenKeys((prev) =>
                prev.includes(value) ? prev.filter((k) => k !== value) : [...prev, value]
              );
            }}
          />
          {data?.datasets?.map((ds, idx) => (
            <Bar
              key={ds.label}
              dataKey={ds.label}
              fill={ds.backgroundColor || ds.borderColor || theme.palette.primary.main}
              hide={hiddenKeys.includes(ds.label)}
              barSize={isSummarized ? 12 : 8}
            />
          ))}
        </RBChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PowerBarChart;
