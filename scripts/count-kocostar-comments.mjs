/** tmp_reports 시트별 text 열 채워진 행 개수 카운터 */
import fs from 'fs';
import path from 'path';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ',') {
      row.push(cur);
      cur = '';
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur);
      cur = '';
      if (row.some((x) => String(x).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.some((x) => String(x).trim() !== '')) rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((x) => String(x).trim());
  return rows.slice(1).map((vals) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = vals[i] ?? '';
    return out;
  });
}

function pickHeader(headers, candidates) {
  const low = headers.map((h) => String(h || '').toLowerCase());
  for (const c of candidates) {
    const idx = low.findIndex((h) => h.includes(c));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

const files = ['sheet5.csv', 'sheet6.csv'];
let total = 0;
for (const fn of files) {
  const full = path.resolve(process.cwd(), 'tmp_reports', fn);
  if (!fs.existsSync(full)) {
    console.log(`${fn}: (없음)`);
    continue;
  }
  const rows = parseCsv(fs.readFileSync(full, 'utf8'));
  if (!rows.length) {
    console.log(`${fn}: 0 데이터 행`);
    continue;
  }
  const headers = Object.keys(rows[0]);
  const hText = pickHeader(headers, ['text']);
  if (!hText) {
    console.log(`${fn}: 'text' 열 없음. 헤더:`, headers.slice(0, 10));
    continue;
  }
  let n = 0;
  for (const r of rows) {
    const raw = String(r[hText] || '').trim();
    if (raw) n += 1;
  }
  console.log(`${fn}: 데이터 행 ${rows.length}, text 있음 ${n}`);
  total += n;
}
console.log(`합계(text 있음): ${total}`);
