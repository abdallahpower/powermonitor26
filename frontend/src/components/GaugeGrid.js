import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, IconButton, Paper, Typography, Menu, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ConfigurableGauge from './ConfigurableGauge';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/*
 * GaugeGrid
 * ---------
 * Allows drag / drop / resize of gauges. Visible gauges & their layout are persisted.
 * props:
 *   readings: Array<[field, value]>
 *   getGaugeProps: (field,value) => gauge props object
 */
const GaugeGrid = ({ readings, getGaugeProps, editMode = true, resetKey, initialVisible = [] }) => {
  const layoutKey = 'gaugeLayout';
  const visibleKey = 'gaugeVisible';

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return fallback;
  };

  const [visible, setVisible] = useState(() => load(visibleKey, initialVisible));
  const [layout, setLayout] = useState(() => load(layoutKey, []));
  const [anchorEl, setAnchorEl] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  // Initialize with all gauges if no saved layout
  useEffect(() => {
    if (readings.length === 0) return;
    if (visible.length === 0) {
      setVisible(readings.map(([f]) => f));
    }
  }, [readings]);

  // Persist
  useEffect(() => {
    localStorage.setItem(visibleKey, JSON.stringify(visible));
  }, [visible]);
  useEffect(() => {
    localStorage.setItem(layoutKey, JSON.stringify(layout));
  }, [layout]);

  // Reset layout when resetKey changes (triggered by parent)
  useEffect(() => {
    if (resetKey !== undefined) {
      setLayout([]);
      localStorage.removeItem(layoutKey);
    }
  }, [resetKey]);

  const allFields = readings.map(([f]) => f);

  // keep visible gauges valid (remove stale) but DO NOT auto-add new ones
  useEffect(() => {
    const stillValid = visible.filter((v) => allFields.includes(v));
    if (stillValid.length !== visible.length) {
      setVisible(stillValid);
      setLayout((lay) => lay.filter((l) => stillValid.includes(l.i)));
    }
    // New incoming fields become available in the Add dialog (hiddenFields)
  }, [allFields.join(','), visible]);

  const hiddenFields = allFields.filter((f) => !visible.includes(f));

  // Derived layout merging
  const mergedLayout = useMemo(() => {
    return visible.map((field, idx) => {
      const stored = layout.find((l) => l.i === field) || {};
      const x = typeof stored.x === 'number' ? stored.x : (idx % 3) * 3;
      const y = typeof stored.y === 'number' ? stored.y : Infinity;
      const w = typeof stored.w === 'number' ? stored.w : 3;
      const h = typeof stored.h === 'number' ? stored.h : 4;
      return { i: field, x, y, w, h, minW: 2, minH: 4 };
    });
  }, [visible, layout]);

  const handleRemove = useCallback((field) => {
    setVisible((v) => v.filter((f) => f !== field));
    setLayout((l) => l.filter((item) => item.i !== field));
  }, []);

  const handleLayoutChange = (newLayout) => {
    // Keep square aspect regardless of which dimension changed
    const adjusted = newLayout.map((item) => {
      const headerRows = 2; // reserve rows for header (~100px)
      const bodyH = Math.max(item.minH || 4, item.h) - headerRows;
      const square = Math.max(item.w, bodyH);
      return { ...item, w: square, h: square + headerRows };
    });
    setLayout(adjusted);
  };

  const openAddMenu = (e) => setAnchorEl(e.currentTarget);
  const closeAddMenu = () => setAnchorEl(null);
  const toggleSelect = (field) => {
    setSelected((sel) => sel.includes(field) ? sel.filter((f)=>f!==field) : [...sel, field]);
  };

  const handleAddSelected = () => {
    if (selected.length === 0) return;
    setVisible((v) => [...v, ...selected]);
    setAddOpen(false);
  };

  const handleAdd = (field) => {
    setVisible((v) => [...v, field]);
    closeAddMenu();
  };

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={()=>{ setSelected([]); setAddOpen(true); }}
        sx={{ mb: 1 }}
        disabled={hiddenFields.length === 0}
      >
        Add Gauge
      </Button>
      {/* Multi-select dialog */}
      <Dialog open={addOpen} onClose={()=> setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select Measurements</DialogTitle>
        <DialogContent dividers>
          <List dense>
            {hiddenFields.map((field)=>(
              <ListItem key={field} button onClick={()=>toggleSelect(field)}>
                <ListItemIcon>
                  <Checkbox edge="start" checked={selected.includes(field)} tabIndex={-1} />
                </ListItemIcon>
                <ListItemText primary={field.replace(/_/g,' ')} />
              </ListItem>
            ))}
          </List>
          {hiddenFields.length === 0 && (<Typography variant="body2">No remaining measurements.</Typography>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSelected} disabled={selected.length===0}>Add Selected</Button>
        </DialogActions>
      </Dialog>

      {editMode && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeAddMenu}>
        {hiddenFields.map((field) => (
          <MenuItem key={field} onClick={() => handleAdd(field)}>
            {field.replace(/_/g, ' ')}
          </MenuItem>
        ))}
      </Menu>
      )}

      <ResponsiveGridLayout
        isDraggable={editMode}
        isResizable={editMode}
        className="layout"
        layouts={{ lg: mergedLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={50}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle" draggableCancel=".no-drag"
      >
        {visible.map((field) => {
          const value = readings.find(([f]) => f === field)?.[1] ?? 0;
          const gaugeProps = getGaugeProps(field, value);
          return (
            <Paper key={field} data-grid={mergedLayout.find((l) => l.i === field)} sx={{ p: 0, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box className="drag-handle" sx={{ cursor: editMode ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 1.5, minHeight: 72 }}>
                <Typography variant="subtitle2" sx={{ pl: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {field.replace(/_/g, ' ')}
                </Typography>
                <IconButton className="no-drag" size="medium" onClick={(e) => { e.stopPropagation(); handleRemove(field); }} sx={{ color: 'error.main' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <ConfigurableGauge
                field={field}
                value={gaugeProps.value}
                unit={gaugeProps.unit}
                defaultMin={gaugeProps.minValue}
                defaultMax={gaugeProps.maxValue}
                defaultThresholds={gaugeProps.thresholds}
                degreeLabelMode={(() => {
                  try {
                    const cfg = JSON.parse(localStorage.getItem(`gaugeConfig-${field}`));
                    return cfg?.degreeLabelMode || 'auto';
                  } catch { return 'auto'; }
                })()}
                />
              </Box>
            </Paper>
          );
        })}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default GaugeGrid;
