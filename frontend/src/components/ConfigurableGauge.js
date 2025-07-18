import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NumbersIcon from '@mui/icons-material/Numbers';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import MultiThresholdSpeedometer, { DIAL_FONT_SIZE } from '../pages/Gauge';

/**
 * ConfigurableGauge
 * -----------------
 * Allows the user to:
 * 1. Adjust gauge span (min / max).
 * 2. Dynamically add or delete threshold segments (value + color).
 * Thresholds are sorted automatically by value.
 * The configuration is persisted to localStorage keyed by `gaugeConfig-<field>`.
 */
const ConfigurableGauge = ({ field, value, unit = '', defaultMin = 0, defaultMax = 100, defaultThresholds = [], degreeLabelMode: degreeLabelModeProp }) => {
  // --- persistent helpers -------------------------------------------------
  const storageKey = `gaugeConfig-${field}`;
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (_) {
      /* no-op */
    }
    return null;
  };
  const saveConfig = (cfg) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cfg));
    } catch (_) {
      /* no-op */
    }
  };

  // --- state --------------------------------------------------------------
  const initial = loadConfig();
  const [minValue, setMinValue] = useState(initial?.minValue ?? defaultMin);
  const [maxValue, setMaxValue] = useState(initial?.maxValue ?? defaultMax ?? (value * 2 || 100));
  const autoThresholds = (min, max) => {
    const span = max - min || 1;
    return [
      { value: min + span * 0.33, color: '#ef4444', name: 'Low' },
      { value: min + span * 0.66, color: '#10b981', name: 'Normal' },
      { value: min + span * 0.9, color: '#f59e0b', name: 'High' },
    ];
  };

  const [gaugeType, setGaugeType] = useState(initial?.gaugeType || 'dial');

  const [thresholds, setThresholds] = useState(() => {
    const stored = initial?.thresholds ?? defaultThresholds;
    return stored && stored.length > 0 ? stored : autoThresholds(defaultMin, defaultMax);
  });
  // dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [tempMin, setTempMin] = useState(minValue);
  const [tempMax, setTempMax] = useState(maxValue);
  const [tempThresholds, setTempThresholds] = useState(thresholds);
  const [degreeLabelMode, setDegreeLabelMode] = useState(initial?.degreeLabelMode ?? 'auto'); // 'auto', 'int', 'float', 'hide'
  const [tempDegreeLabelMode, setTempDegreeLabelMode] = useState(degreeLabelMode);
  const [showPointer, setShowPointer] = useState(initial?.showPointer ?? true);
  const [tempShowPointer, setTempShowPointer] = useState(showPointer);
  const [tickCount, setTickCount] = useState(initial?.tickCount ?? 7);
  const [tempTickCount, setTempTickCount] = useState(tickCount);
  const [asPercentage, setAsPercentage] = useState(initial?.asPercentage ?? false);
  const [tempAsPercentage, setTempAsPercentage] = useState(asPercentage);
  const [percentBase, setPercentBase] = useState(initial?.percentageBase ?? 100);
  const [tempPercentBase, setTempPercentBase] = useState(percentBase);

  // ----- responsive font scaling for numeric gauge -----
  // Responsive font scaling for numeric gauge
  const numericRef = React.useRef(null);
  const [fontSizes, setFontSizes] = React.useState({ value: 24, percent: 18 });
  
  React.useEffect(() => {
    if (!numericRef.current || gaugeType !== 'numeric') return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (!width) return;
      // Compute size relative to container width for good responsiveness
      const valueSize = Math.max(22, Math.min(90, Math.round(width * 0.45)));
      const percentSize = Math.max(16, Math.min(70, Math.round(width * 0.32)));
      setFontSizes({ value: valueSize, percent: percentSize });
    });
    observer.observe(numericRef.current);
    return () => observer.disconnect();
  }, [gaugeType]);

// If prop changes (from GaugeGrid), update state. But if no prop, let dialog control it.
React.useEffect(() => {
  if (degreeLabelModeProp !== undefined && degreeLabelModeProp !== degreeLabelMode) {
    setDegreeLabelMode(degreeLabelModeProp);
    setTempDegreeLabelMode(degreeLabelModeProp);
  }
}, [degreeLabelModeProp]);


  // ---------------- dialog handlers ------------------
  const openConfig = () => {
    setTempMin(minValue);
    setTempMax(maxValue);
    setTempThresholds(thresholds);
    setTempDegreeLabelMode(degreeLabelMode);
    setTempShowPointer(showPointer);
    setTempTickCount(tickCount);
    setTempAsPercentage(asPercentage);
    setTempPercentBase(percentBase);
    setOpenDialog(true);
  };
  const handleCancel = () => setOpenDialog(false);

  const handleSave = () => {
    // keep thresholds inside range and sorted
    const sanitized = tempThresholds
      .filter((t) => !Number.isNaN(t.value) && t.value >= tempMin && t.value <= tempMax)
      .sort((a, b) => a.value - b.value);
    setMinValue(tempMin);
    setMaxValue(tempMax);
    setThresholds(sanitized);
    setDegreeLabelMode(tempDegreeLabelMode);
    setShowPointer(tempShowPointer);
    setTickCount(tempTickCount);
    setAsPercentage(tempAsPercentage);
    setPercentBase(tempPercentBase);
    updateAndSave(tempMin, tempMax, sanitized, gaugeType, tempDegreeLabelMode, tempShowPointer, tempTickCount, tempAsPercentage, tempPercentBase);
    setOpenDialog(false);
  };

  const handleTempSpanChange = (which) => (e) => {
    const v = Number(e.target.value);
    if (Number.isNaN(v)) return;
    if (which === 'min') {
      setTempMin(v);
    } else {
      setTempMax(v);
    }
  };

  const addTempThreshold = () => {
    const mid = (tempMin + tempMax) / 2;
    const newList = [...tempThresholds, { value: mid, color: '#10b981', name: 'Custom' }].sort((a, b) => a.value - b.value);
    setTempThresholds(newList);
  };
  const deleteTempThreshold = (idx) => {
    setTempThresholds(tempThresholds.filter((_, i) => i !== idx));
  };
  const changeTempThreshold = (idx, key) => (e) => {
    const val = key === 'value' ? Number(e.target.value) : e.target.value;
    const list = tempThresholds.map((t, i) => (i === idx ? { ...t, [key]: val } : t));
    setTempThresholds(list);
  };

  const isValid = tempMin < tempMax && tempThresholds.every((t) => t.value >= tempMin && t.value <= tempMax);

  // --- handlers -----------------------------------------------------------
  const updateAndSave = useCallback((newMin, newMax, newThr, newType = gaugeType, newDegreeLabelMode = degreeLabelMode, newShowPointer = showPointer, newTickCount = tickCount, newAsPercentage = asPercentage, newPercentBase = percentBase) => {
    const cfg = { minValue: newMin, maxValue: newMax, thresholds: newThr, gaugeType: newType, degreeLabelMode: newDegreeLabelMode, showPointer: newShowPointer, tickCount: newTickCount, asPercentage: newAsPercentage, percentageBase: newPercentBase };
    saveConfig(cfg);
  }, [gaugeType, degreeLabelMode, showPointer, tickCount, asPercentage, percentBase]);

  const handleSpanChange = (which) => (e) => {
    const v = Number(e.target.value);
    if (Number.isNaN(v)) return;
    if (which === 'min') {
      setMinValue(v);
      updateAndSave(v, maxValue, thresholds, gaugeType, degreeLabelMode);
      updateAndSave(v, maxValue, thresholds, gaugeType);
    } else {
      setMaxValue(v);
      updateAndSave(minValue, v, thresholds, gaugeType);
    }
  };

  const addThreshold = () => {
    const mid = (minValue + maxValue) / 2;
    const newList = [...thresholds, { value: mid, color: '#10b981' }].sort((a, b) => a.value - b.value);
    setThresholds(newList);
    updateAndSave(minValue, maxValue, newList);
  };

  const deleteThreshold = (idx) => {
    const newList = thresholds.filter((_, i) => i !== idx);
    setThresholds(newList);
    updateAndSave(minValue, maxValue, newList);
  };

  const changeThreshold = (idx, key) => (e) => {
    const val = key === 'value' ? Number(e.target.value) : e.target.value;
    const list = thresholds.map((t, i) => (i === idx ? { ...t, [key]: val } : t));
    list.sort((a, b) => a.value - b.value);
    setThresholds(list);
    updateAndSave(minValue, maxValue, list, gaugeType);
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <IconButton
        size="small"
        onClick={() => {
          const newType = gaugeType === 'dial' ? 'numeric' : 'dial';
          setGaugeType(newType);
          updateAndSave(minValue, maxValue, thresholds, newType);
        }}
        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}
      >
        {gaugeType === 'dial' ? <NumbersIcon fontSize="small" /> : <SpeedIcon fontSize="small" />}
      </IconButton>

      <IconButton
        size="small"
        onClick={openConfig}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>

      {/* Configuration Dialog */}
      <Dialog open={openDialog} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Configure {field.replace(/_/g, ' ')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Span controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={tempMin}
              onChange={handleTempSpanChange('min')}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              value={tempMax}
              onChange={handleTempSpanChange('max')}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Tick Label Style</Typography>
            <select value={tempDegreeLabelMode} onChange={e => setTempDegreeLabelMode(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }}>
              <option value="auto">Auto (int/float by range)</option>
              <option value="int">Integer Only</option>
              <option value="float">Float (2 decimals)</option>
              <option value="hide">Hide Labels</option>
            </select>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={tempShowPointer} onChange={e => setTempShowPointer(e.target.checked)} />}
            label="Show Pointer"
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Major Ticks"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min:2, max:20 }}
              value={tempTickCount}
              onChange={e => setTempTickCount(Math.max(2, Number(e.target.value)))}
            />
          </Box>

          <FormControlLabel
            control={<Checkbox checked={tempAsPercentage} onChange={e => setTempAsPercentage(e.target.checked)} />}
            label="Show as Percentage"
            sx={{ mb: 1 }}
          />
          {tempAsPercentage && (
            <TextField
              label="Percentage Base"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min:1 }}
              value={tempPercentBase}
              onChange={e => setTempPercentBase(Math.max(1, Number(e.target.value)))}
              sx={{ mb: 2 }}
            />
          )}

          <Typography variant="subtitle2" gutterBottom>
            Thresholds
          </Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              {tempThresholds.map((thr, idx) => (
                <TableRow key={idx}>
                  <TableCell width={120}>
                    <TextField
                      type="number"
                      size="small"
                      value={thr.value}
                      error={thr.value < tempMin || thr.value > tempMax}
                      fullWidth
                      inputProps={{ style: { textAlign: 'center' } }}
                      sx={{ minWidth: 100 }}
                      onFocus={(e) => e.target.select()}
                      onChange={changeTempThreshold(idx, 'value')}
                      onBlur={(e) => { /* Prevent accidental blur from committing incomplete edits */ e.target.value = thr.value; }}
                    />
                  </TableCell>
                  <TableCell width={120}>
                    <TextField
                      size="small"
                      value={thr.name || ''}
                      onChange={changeTempThreshold(idx, 'name')}
                    />
                  </TableCell>
                  <TableCell width={80}>
                    <input
                      type="color"
                      value={thr.color}
                      onChange={changeTempThreshold(idx, 'color')}
                      style={{ width: 40, height: 30, border: 'none', background: 'transparent' }}
                    />
                  </TableCell>
                  <TableCell width={40}>
                    <IconButton size="small" onClick={() => deleteTempThreshold(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Button size="small" startIcon={<AddIcon />} onClick={addTempThreshold}>
                    Add Threshold
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>


      {gaugeType === 'dial' ? (
        <>
          {openDialog ? (
            <MultiThresholdSpeedometer
              value={value}
              minValue={tempMin}
              maxValue={tempMax}
              thresholds={tempThresholds}
              unit={unit}
              degreeLabelMode={tempDegreeLabelMode}
              showPointer={tempShowPointer}
              majorTicks={tempTickCount}
              asPercentage={tempAsPercentage}
              percentageBase={tempPercentBase}
            />
          ) : (
            <MultiThresholdSpeedometer
              value={value}
              minValue={minValue}
              maxValue={maxValue}
              thresholds={thresholds}
              unit={unit}
              degreeLabelMode={degreeLabelMode}
              showPointer={showPointer}
              majorTicks={tickCount}
              asPercentage={asPercentage}
              percentageBase={percentBase}
            />
          )}
        </>
      ) : (
        <Box ref={numericRef} sx={{ textAlign: 'center', width: '100%', minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {(() => {
            const sorted = [...thresholds].sort((a,b)=>a.value - b.value);
            const zone = sorted.find(t => value <= t.value) || sorted[sorted.length-1];
            const color = zone?.color || '#111827';
            return (
              <>
                {asPercentage && percentBase > 0 && (
                  <Typography variant="h4" sx={{ fontWeight: 700, color, mb: -0.5, fontSize: `${fontSizes.percent}px`, lineHeight: 1 }}>
                    {`${((value / percentBase) * 100).toFixed(1)} %`}
                  </Typography>
                )}
                <Typography variant="h3" sx={{ fontWeight: 700, color, fontSize: `${fontSizes.value}px`, lineHeight: 1 }}>
                  {isFinite(value) ? `${value.toFixed(2)} ${unit}` : '--'}
                </Typography>
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
};

export default ConfigurableGauge;
