// Centralized Chart.js registration
// This module should be imported once (e.g. in index.js) so that Chart.js
// components and global plugins are registered only a single time across the
// entire application, preventing duplicate-registration bugs such as
// "Maximum call stack size exceeded".

import { Chart, registerables } from 'chart.js';

// Ensure we register only once (important with React Fast Refresh / HMR)
if (typeof window !== 'undefined' && !window.__chartjs_registered) {
  Chart.register(...registerables);
  window.__chartjs_registered = true;
}

// If other global plugins need to be added, export Chart so that callers can
// register additional plugins in their own modules without re-registering the
// core set.
export { Chart };
