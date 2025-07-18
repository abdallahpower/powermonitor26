import React, { useState } from 'react';
import { Box, IconButton, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import BiPieChart from './BiPieChart';

/*
 * ConfigurablePieCard
 * -------------------
 * Wraps a BiPieChart inside a Paper with drag-handle and settings dialog for colors.
 */
const ConfigurablePieCard = ({ id, title, phaseLabels, phaseValues, compareLabel, compareValue, unit = '', defaultColors, onRemove, editMode }) => {
  const storageKey = `pieColors-${id}`;
  const loadColors = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultColors;
  };

  const [colors, setColors] = useState(loadColors);
  const fontColorKey = `pieFontColor-${id}`;
  const loadFontColor = () => {
    try {
      const raw = localStorage.getItem(fontColorKey);
      if (raw) return raw;
    } catch {}
    return '#ffffff';
  };
  const [fontColor, setFontColor] = useState(loadFontColor);
  const [dlgOpen, setDlgOpen] = useState(false);

  const saveColors = (newColors) => {
    setColors(newColors);
    localStorage.setItem(storageKey, JSON.stringify(newColors));
  };

  const saveFontColor = (color) => {
    setFontColor(color);
    localStorage.setItem(fontColorKey, color);

  };

  const handleColorChange = (idx, value) => {
    const newArr = [...colors];
    newArr[idx] = value;
    saveColors(newArr);
  };

  return (
    <Paper sx={{ 
      p: 0, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)'
    }}>
      <Box 
        className="drag-handle" 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 0.25,
          py: 0.125,
          cursor: editMode ? 'move' : 'default',
          minHeight: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1,
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            fontSize: '0.7rem'
          }}
        >
          {title}
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setDlgOpen(true)} className="no-drag" sx={{ p: 0.125 }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          {onRemove && (
            <IconButton size="small" onClick={onRemove} className="no-drag" sx={{ color: 'error.main', p: 0.125 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px'
        }}
      >
        <BiPieChart
          title=""
          phaseLabels={phaseLabels}
          phaseValues={phaseValues}
          compareLabel={compareLabel}
          compareValue={compareValue}
          unit={unit}
          colors={colors}
          fontColor={fontColor}
        />
      </Box>

      <Dialog open={dlgOpen} onClose={()=> setDlgOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Slice Colors</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2 }}>
          {phaseLabels.map((lbl, idx)=>(
            <TextField key={idx} type="color" label={lbl} value={colors[idx]} onChange={(e)=>handleColorChange(idx, e.target.value)} InputLabelProps={{ shrink:true }} />
          ))}
          <TextField type="color" label="Font Color" value={fontColor} onChange={(e)=>saveFontColor(e.target.value)} InputLabelProps={{ shrink:true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setDlgOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConfigurablePieCard;
