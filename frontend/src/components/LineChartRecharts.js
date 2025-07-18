import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart as RLChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import { Box, CircularProgress, IconButton, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * LineChart component backed by Recharts.
 * Accepts the same `data` structure previously supplied to Chart.js:
 * {
 *   labels: [...],
 *   datasets: [{ label, data, borderColor? }]
 * }
 * It converts this structure into the array-of-objects format that Recharts expects.
 */
const PowerLineChart = ({ data, isLoading, isSummarized = false }) => {
  const [hiddenKeys, setHiddenKeys] = useState([]);
  const theme = useTheme();

  // Transform Chart.js style data into Recharts format
  // Format data once
  const formattedData = useMemo(() => {
    if (!data || !data.labels || !data.datasets) return [];

    const { labels, datasets } = data;
    return labels.map((label, idx) => {
      const point = { name: label };
      datasets.forEach((ds) => {
        point[ds.label] = ds.data[idx];
      });
      return point;
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
        <RLChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            height={60}
            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
            minTickGap={15}
            tickFormatter={(v) => (typeof v === 'string' ? v.replace(/\n/g, ' ') : v)}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={['dataMin', 'dataMax']}
            padding={{ top: 10, bottom: 10 }}
            allowDecimals
          />
          <Tooltip wrapperStyle={{ fontSize: 12 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
            onClick={(o) => {
              const { value } = o;
              setHiddenKeys((prev) =>
                prev.includes(value)
                  ? prev.filter((k) => k !== value)
                  : [...prev, value]
              );
            }}
          />
          {data?.datasets?.map((ds, index) => (
            <Line
              key={ds.label}
              hide={hiddenKeys.includes(ds.label)}
              type="basis"
              dataKey={ds.label}
              stroke={ds.borderColor || ds.backgroundColor || theme.palette.primary.main}
              dot={false}
              strokeWidth={isSummarized ? 4 : 2}
              connectNulls
              isAnimationActive={false}
            />
          ))}
                  <Brush dataKey="name" height={20} stroke={theme.palette.primary.main} travellerWidth={10} />
        </RLChart>
      </ResponsiveContainer>


    </Box>
  );
};

export default PowerLineChart;
