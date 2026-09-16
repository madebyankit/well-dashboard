/**
 * The analytics layer.
 *
 * Every number on the dashboard is derived here, so charts, KPI cards and grids
 * can never disagree with each other. Nothing in this file touches React or the
 * DOM — it is plain functions over the parsed readings, which keeps it easy to
 * reason about and easy to test.
 *
 * A "reading" is one row of the CSV, normalised to:
 *   { well, field, date: 'YYYY-MM-DD', timestamp, production1d, production7d,
 *     target, cycleTime }
 */

/**
 * A well counts as "on target" while it sits within +/- this many percent of
 * its analyst-set target. Outside that band it is out- or under-performing.
 */
export const TARGET_BAND = 5;

/** Robust-z threshold above which a reading is treated as an outlier. */
const ANOMALY_Z = 3.5;

export const STATUS = {
  OVER: 'outperforming',
  ON: 'on-target',
  UNDER: 'underperforming',
};

/** Classify an attainment percentage into one of the three statuses. */
export function statusFor(attainment) {
  if (attainment === null || Number.isNaN(attainment)) return STATUS.ON;
  if (attainment >= 100 + TARGET_BAND) return STATUS.OVER;
  if (attainment <= 100 - TARGET_BAND) return STATUS.UNDER;
  return STATUS.ON;
}

export const STATUS_LABEL = {
  [STATUS.OVER]: 'Outperforming',
  [STATUS.ON]: 'On target',
  [STATUS.UNDER]: 'Underperforming',
};

/* ------------------------------------------------------------------ */
/* Small statistics helpers                                            */
/* ------------------------------------------------------------------ */

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values) {
  return values.length ? sum(values) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

/**
 * Apply the dashboard filter state to the readings.
 *
 * `filters` mirrors the URL query string exactly (see src/lib/filters.js), so a
 * shared link reproduces the view precisely.
 */
export function filterReadings(readings, filters = {}) {
  const { fields = [], wells = [], from, to, status } = filters;
  const fieldSet = fields.length ? new Set(fields) : null;
  const wellSet = wells.length ? new Set(wells) : null;

  let result = readings.filter((r) => {
    if (fieldSet && !fieldSet.has(r.field)) return false;
    if (wellSet && !wellSet.has(r.well)) return false;
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });

  // Status is a derived attribute, so it has to be applied after the per-well
  // summaries exist — we compute them on the already-narrowed set.
  if (status && status !== 'all') {
    const keep = new Set(
      buildWellSummaries(result)
        .filter((wellSummary) => wellSummary.status === status)
        .map((wellSummary) => wellSummary.well),
    );
    result = result.filter((r) => keep.has(r.well));
  }

  return result;
}

/**
 * RBAC data scoping: a user may only be entitled to certain fields.
 * `allowedFields` of ['*'] means unrestricted.
 */
export function scopeToFields(readings, allowedFields) {
  if (!allowedFields || allowedFields.includes('*')) return readings;
  const allowed = new Set(allowedFields);
  return readings.filter((r) => allowed.has(r.field));
}

/* ------------------------------------------------------------------ */
/* Anomaly detection                                                   */
/* ------------------------------------------------------------------ */

/**
 * Flag outliers per well using a median/MAD robust z-score.
 *
 * A plain mean/standard-deviation test is skewed by the very spikes we want to
 * catch, so we use the median absolute deviation instead. Two kinds of anomaly
 * are reported:
 *   - `downtime`: production dropped to zero (well was shut in)
 *   - `spike` / `dip`: production sits more than ANOMALY_Z robust-z from normal
 *
 * Returns a Map keyed by `${well}|${date}` so callers can look one up cheaply.
 */
export function detectAnomalies(readings) {
  const byWell = groupBy(readings, (r) => r.well);
  const flags = new Map();

  for (const [well, rows] of byWell) {
    const live = rows.filter((r) => r.production1d > 0).map((r) => r.production1d);
    if (live.length < 8) continue;

    const med = median(live);
    const mad = median(live.map((v) => Math.abs(v - med))) || 1e-6;

    for (const row of rows) {
      if (row.production1d === 0) {
        flags.set(`${well}|${row.date}`, { type: 'downtime', z: 0, reason: 'No production recorded (well shut in)' });
        continue;
      }
      // 1.4826 rescales MAD to be comparable with a standard deviation.
      const z = (row.production1d - med) / (1.4826 * mad);
      if (Math.abs(z) >= ANOMALY_Z) {
        flags.set(`${well}|${row.date}`, {
          type: z > 0 ? 'spike' : 'dip',
          z,
          reason: z > 0 ? 'Production far above the well’s normal range' : 'Production far below the well’s normal range',
        });
      }
    }
  }

  return flags;
}

/** Turn the anomaly Map into a sorted, displayable list. */
export function anomalyList(readings, flags) {
  const out = [];
  for (const row of readings) {
    const flag = flags.get(`${row.well}|${row.date}`);
    if (flag) out.push({ ...row, ...flag });
  }
  return out.sort((a, b) => (a.date === b.date ? Math.abs(b.z) - Math.abs(a.z) : b.date.localeCompare(a.date)));
}

/* ------------------------------------------------------------------ */
/* Aggregations                                                        */
/* ------------------------------------------------------------------ */

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

/**
 * Per-well roll-up: the row model behind the AG Grid table, the ranking chart
 * and the well detail header.
 */
export function buildWellSummaries(readings, flags) {
  const anomalyFlags = flags ?? detectAnomalies(readings);
  const byWell = groupBy(readings, (r) => r.well);
  const summaries = [];

  for (const [well, rowsUnsorted] of byWell) {
    const rows = [...rowsUnsorted].sort((a, b) => a.date.localeCompare(b.date));
    const latest = rows[rows.length - 1];

    const production = rows.map((r) => r.production1d);
    const targets = rows.map((r) => r.target);
    const totalProduction = sum(production);
    const totalTarget = sum(targets);

    // Attainment over the whole selected window, not just the last day — one
    // good day should not make a chronic under-performer look healthy.
    const attainment = totalTarget > 0 ? (totalProduction / totalTarget) * 100 : null;

    // Trend: mean of the most recent third vs the mean of the first third.
    const third = Math.max(1, Math.floor(rows.length / 3));
    const early = mean(production.slice(0, third));
    const recent = mean(production.slice(-third));
    const trend = early > 0 ? ((recent - early) / early) * 100 : 0;

    const cycleTimes = rows.filter((r) => r.cycleTime > 0).map((r) => r.cycleTime);
    const anomalies = rows.filter((r) => anomalyFlags.has(`${well}|${r.date}`)).length;
    const downtimeDays = rows.filter((r) => r.production1d === 0).length;

    summaries.push({
      well,
      field: latest.field,
      readings: rows.length,
      latestDate: latest.date,
      latestProduction: latest.production1d,
      latestProduction7d: latest.production7d,
      target: latest.target,
      avgProduction: mean(production),
      totalProduction,
      totalTarget,
      attainment,
      variance: attainment === null ? null : attainment - 100,
      // Absolute gap in m³/d against target — what an operator acts on.
      gap: mean(production) - mean(targets),
      trend,
      avgCycleTime: mean(cycleTimes),
      anomalies,
      downtimeDays,
      uptime: rows.length ? ((rows.length - downtimeDays) / rows.length) * 100 : 100,
      status: statusFor(attainment),
    });
  }

  return summaries.sort((a, b) => a.well.localeCompare(b.well));
}

/** Per-field roll-up, used by the field comparison chart and field cards. */
export function buildFieldSummaries(wellSummaries) {
  const byField = groupBy(wellSummaries, (w) => w.field);
  const out = [];

  for (const [field, wells] of byField) {
    const totalProduction = sum(wells.map((w) => w.totalProduction));
    const totalTarget = sum(wells.map((w) => w.totalTarget));
    out.push({
      field,
      wellCount: wells.length,
      totalProduction,
      totalTarget,
      avgProduction: mean(wells.map((w) => w.avgProduction)),
      attainment: totalTarget > 0 ? (totalProduction / totalTarget) * 100 : null,
      avgCycleTime: mean(wells.map((w) => w.avgCycleTime)),
      anomalies: sum(wells.map((w) => w.anomalies)),
      underperforming: wells.filter((w) => w.status === STATUS.UNDER).length,
      outperforming: wells.filter((w) => w.status === STATUS.OVER).length,
    });
  }

  return out.sort((a, b) => b.totalProduction - a.totalProduction);
}

/**
 * Collapse readings into one point per day, summing across the selected wells.
 *
 * Summing (rather than averaging) means the chart shows the output of whatever
 * is currently selected, and the target line sums the same way — so the two
 * stay directly comparable however the filters change.
 */
export function buildTimeSeries(readings) {
  const byDate = groupBy(readings, (r) => r.date);

  return [...byDate.entries()]
    .map(([date, rows]) => ({
      date,
      production1d: sum(rows.map((r) => r.production1d)),
      production7d: sum(rows.map((r) => r.production7d)),
      target: sum(rows.map((r) => r.target)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * One series per group, for the comparison chart.
 *
 * `groupKey` is 'field' or 'well'. The dashboard switches to comparing wells
 * once the user has narrowed to a single field, because comparing one field
 * against itself tells you nothing.
 */
export function buildGroupSeries(readings, groupKey = 'field', metric = 'production7d', limit = 12) {
  const byGroup = groupBy(readings, (r) => r[groupKey]);
  const dates = [...new Set(readings.map((r) => r.date))].sort();

  // With many wells the chart becomes unreadable, so keep the largest
  // contributors and report how many were left out.
  const ranked = [...byGroup.entries()]
    .map(([name, rows]) => ({ name, rows, total: sum(rows.map((r) => r.production1d)) }))
    .sort((a, b) => b.total - a.total);

  const shown = ranked.slice(0, limit);

  const series = shown.map(({ name, rows }) => {
    const byDate = groupBy(rows, (r) => r.date);
    return {
      name,
      data: dates.map((date) => {
        const dayRows = byDate.get(date);
        if (!dayRows) return null;
        return Number(sum(dayRows.map((r) => r[metric])).toFixed(2));
      }),
    };
  });

  return { dates, series, hidden: Math.max(0, ranked.length - shown.length) };
}

/** Headline KPI numbers for the cards across the top of the dashboard. */
export function buildKpis(readings, wellSummaries) {
  const totalProduction = sum(wellSummaries.map((w) => w.totalProduction));
  const totalTarget = sum(wellSummaries.map((w) => w.totalTarget));
  const attainment = totalTarget > 0 ? (totalProduction / totalTarget) * 100 : null;

  const dates = [...new Set(readings.map((r) => r.date))].sort();
  const latestDate = dates[dates.length - 1];
  const latestRows = readings.filter((r) => r.date === latestDate);

  // Compare the latest day against the mean of the preceding seven, so the
  // "vs previous" figure is not hostage to one noisy day.
  const priorDates = new Set(dates.slice(-8, -1));
  const priorRows = readings.filter((r) => priorDates.has(r.date));
  const priorDailyTotal = priorDates.size ? sum(priorRows.map((r) => r.production1d)) / priorDates.size : 0;
  const latestTotal = sum(latestRows.map((r) => r.production1d));

  return {
    latestDate,
    dateRange: { from: dates[0], to: latestDate },
    dayCount: dates.length,
    wellCount: wellSummaries.length,
    fieldCount: new Set(wellSummaries.map((w) => w.field)).size,
    latestProduction: latestTotal,
    latestTarget: sum(latestRows.map((r) => r.target)),
    productionChange: priorDailyTotal > 0 ? ((latestTotal - priorDailyTotal) / priorDailyTotal) * 100 : 0,
    totalProduction,
    totalTarget,
    attainment,
    avgCycleTime: mean(wellSummaries.filter((w) => w.avgCycleTime > 0).map((w) => w.avgCycleTime)),
    outperforming: wellSummaries.filter((w) => w.status === STATUS.OVER).length,
    onTarget: wellSummaries.filter((w) => w.status === STATUS.ON).length,
    underperforming: wellSummaries.filter((w) => w.status === STATUS.UNDER).length,
    anomalies: sum(wellSummaries.map((w) => w.anomalies)),
  };
}

/** Top / bottom N wells by attainment, for the ranking chart. */
export function rankWells(wellSummaries, count = 5) {
  const ranked = [...wellSummaries]
    .filter((w) => w.attainment !== null)
    .sort((a, b) => b.attainment - a.attainment);

  return {
    top: ranked.slice(0, count),
    bottom: ranked.slice(-count).reverse(),
  };
}
