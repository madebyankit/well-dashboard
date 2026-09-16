/**
 * Server-side dataset loader.
 *
 * Reads `data/frontend_sample_data.csv` once per process and normalises it into
 * the reading shape the analytics layer expects. Only the API route imports
 * this, so `fs` never leaks into the client bundle.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from './csv.js';

let cache = null;

/** Map one CSV row onto the normalised reading shape. */
function toReading(row) {
  const timestamp = row.Timestamp ?? '';
  return {
    well: row['Well Name'],
    field: row['Field Name'],
    // Readings are daily, so the date alone is the natural key for grouping.
    date: timestamp.slice(0, 10),
    timestamp,
    production1d: Number(row.Production_1D),
    production7d: Number(row.Production_7D),
    target: Number(row['Production Target']),
    cycleTime: Number(row['Average Cycle Time']),
  };
}

/** A row is only usable if it has a well, a date and a numeric production value. */
function isValid(reading) {
  return Boolean(reading.well) && Boolean(reading.date) && Number.isFinite(reading.production1d);
}

export async function loadDataset() {
  if (cache) return cache;

  const csvPath = path.join(process.cwd(), 'data', 'frontend_sample_data.csv');
  const text = await readFile(csvPath, 'utf8');
  const { rows } = parseCsv(text);

  const readings = rows.map(toReading).filter(isValid);
  readings.sort((a, b) => (a.date === b.date ? a.well.localeCompare(b.well) : a.date.localeCompare(b.date)));

  const fields = [...new Set(readings.map((r) => r.field))].sort();
  const wells = [...new Map(readings.map((r) => [r.well, { well: r.well, field: r.field }])).values()].sort((a, b) =>
    a.well.localeCompare(b.well),
  );
  const dates = [...new Set(readings.map((r) => r.date))].sort();

  cache = {
    readings,
    fields,
    wells,
    dateRange: { from: dates[0] ?? '', to: dates[dates.length - 1] ?? '' },
    rowCount: readings.length,
    skippedRows: rows.length - readings.length,
  };

  return cache;
}
