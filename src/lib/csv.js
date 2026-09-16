/**
 * Minimal CSV parser.
 *
 * The production export we consume is a plain, quote-free CSV, so a full parser
 * library would be dead weight. Quoted fields are still handled defensively in
 * case a field name ever contains a comma.
 */
export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const values = splitLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** Split one CSV line, respecting double-quoted fields. */
function splitLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      // A doubled quote inside a quoted field is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}
