/** Shared number / date formatting so every chart, card and grid agrees. */

const numberFormatters = new Map();

function formatter(digits) {
  if (!numberFormatters.has(digits)) {
    numberFormatters.set(
      digits,
      new Intl.NumberFormat('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    );
  }
  return numberFormatters.get(digits);
}

/** 1234.5 -> "1,234.5" */
export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return formatter(digits).format(value);
}

/** 0.987 -> "98.7%" (input is already a percentage, not a ratio). */
export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(value, digits)}%`;
}

/** Signed percentage, used for variance against target. */
export function formatSignedPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, digits)}%`;
}

/** Seconds -> "6m 12s", the readable form of Average Cycle Time. */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—';
  if (seconds === 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/** "2026-09-15" -> "15 Sep 2026" */
export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Short axis label form, e.g. "15 Sep". */
export function formatDateShort(iso) {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}
