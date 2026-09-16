/**
 * Generates `data/frontend_sample_data.csv`.
 *
 * The brief ships a `frontend_sample_data.csv`; none was supplied with this
 * copy, so this script synthesises an equivalent dataset with the exact column
 * set from the brief. It is fully deterministic (seeded PRNG), so the committed
 * CSV can always be reproduced with `npm run generate:data`.
 *
 * Columns (per the brief):
 *   Well Name, Field Name, Timestamp, Production_1D, Production_7D,
 *   Production Target, Average Cycle Time
 *
 * The generated data deliberately contains realistic behaviour that the
 * dashboard needs to surface:
 *   - natural production decline plus day-to-day noise
 *   - wells that consistently beat target and wells that chronically miss it
 *   - downtime (zero-production days) and sensor spikes -> anomaly detection
 *   - cycle time that lengthens as a well weakens
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Small deterministic PRNG so every run produces the same CSV. */
function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260916);

/** Box-Muller normal noise. */
function gaussian(mean, stdDev) {
  const u = 1 - rand();
  const v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stdDev;
}

const DAYS = 180;
const END_DATE = new Date(Date.UTC(2026, 8, 15)); // 2026-09-15, last reading

/**
 * Fields group wells by location and artificial-lift (pump) type, exactly as
 * the brief describes. `health` biases how the field's wells track target.
 */
const FIELDS = [
  { name: 'North Ridge (ESP)', wells: 7, base: 168, health: 1.06 },
  { name: 'Cedar Flats (Rod Pump)', wells: 6, base: 96, health: 0.94 },
  { name: 'Blue Mesa (PCP)', wells: 6, base: 132, health: 1.01 },
  { name: 'Saltbush (Gas Lift)', wells: 5, base: 74, health: 0.88 },
];

/** Three-letter prefix used to build well names, e.g. NR-004. */
const PREFIX = { 'North Ridge (ESP)': 'NR', 'Cedar Flats (Rod Pump)': 'CF', 'Blue Mesa (PCP)': 'BM', 'Saltbush (Gas Lift)': 'SB' };

/** Build the static definition of every well before any time series is drawn. */
function buildWells() {
  const wells = [];
  for (const field of FIELDS) {
    for (let i = 1; i <= field.wells; i += 1) {
      const name = `${PREFIX[field.name]}-${String(i).padStart(3, '0')}`;
      // Performance multiplier decides whether this well beats or misses target.
      const performance = field.health * (0.72 + rand() * 0.55);
      wells.push({
        name,
        field: field.name,
        baseline: field.base * (0.65 + rand() * 0.8),
        performance,
        // Fractional daily decline (0.02% - 0.16% per day).
        decline: 0.0002 + rand() * 0.0014,
        // Base cycle time in seconds; weaker wells cycle more slowly.
        cycleBase: 320 + rand() * 520,
        // Probability of a downtime day and of a sensor spike.
        downtimeRate: rand() * 0.02,
        spikeRate: rand() * 0.012,
        noise: 0.05 + rand() * 0.07,
      });
    }
  }
  return wells;
}

function round(value, dp) {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function generate() {
  const wells = buildWells();
  const rows = [];

  for (const well of wells) {
    // Target is analyst-set: it is held flat, then revised at two review points
    // during the period. This gives the dashboard a target that actually moves.
    const initialTarget = round(well.baseline * 0.97, 1);
    const revisions = [initialTarget, round(initialTarget * (0.9 + rand() * 0.15), 1), round(initialTarget * (0.85 + rand() * 0.18), 1)];

    const history = []; // raw 1D values, used to compute the 7D rolling average

    for (let d = 0; d < DAYS; d += 1) {
      const date = new Date(END_DATE.getTime() - (DAYS - 1 - d) * 86400000);

      // Underlying "true" rate: decline curve + a gentle seasonal wave.
      const decline = well.baseline * Math.exp(-well.decline * d);
      const seasonal = 1 + 0.045 * Math.sin((d / 29) * Math.PI * 2 + well.baseline);
      let production = decline * seasonal * well.performance;

      // Day-to-day measurement noise.
      production *= 1 + gaussian(0, well.noise);

      let cycleTime = well.cycleBase * (1 + gaussian(0, 0.08)) * (1 + well.decline * d * 3);

      // Anomalies: full downtime days (zero production) and sensor spikes.
      const roll = rand();
      if (roll < well.downtimeRate) {
        production = 0;
        cycleTime = 0;
      } else if (roll < well.downtimeRate + well.spikeRate) {
        production *= 1.9 + rand() * 0.9;
      }

      production = Math.max(0, round(production, 2));
      history.push(production);

      // Production_7D is the trailing seven-day mean of Production_1D.
      const window = history.slice(-7);
      const production7d = round(window.reduce((sum, v) => sum + v, 0) / window.length, 2);

      // Pick the target revision in force on this day.
      const target = revisions[d < 60 ? 0 : d < 120 ? 1 : 2];

      rows.push([
        well.name,
        well.field,
        `${date.toISOString().slice(0, 10)} 06:00:00`,
        production.toFixed(2),
        production7d.toFixed(2),
        target.toFixed(1),
        Math.max(0, Math.round(cycleTime)),
      ]);
    }
  }

  // Sort by timestamp then well so the CSV reads like a real export.
  rows.sort((a, b) => (a[2] === b[2] ? a[0].localeCompare(b[0]) : a[2].localeCompare(b[2])));

  const header = ['Well Name', 'Field Name', 'Timestamp', 'Production_1D', 'Production_7D', 'Production Target', 'Average Cycle Time'];
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const outPath = resolve(__dirname, '..', 'data', 'frontend_sample_data.csv');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${csv}\n`, 'utf8');

  console.log(`Wrote ${rows.length} rows for ${wells.length} wells across ${FIELDS.length} fields -> ${outPath}`);
}

generate();
