import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizedIntent, readArticles, writeJson } from './content-lib.mjs';

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', state = 'start';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (state === 'quoted') {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') state = 'after-quote';
      else cell += ch;
      continue;
    }
    if (ch === ',' || ch === '\n' || ch === '\r') {
      row.push(cell); cell = ''; state = 'start';
      if (ch !== ',') { rows.push(row); row = []; }
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      continue;
    }
    if (ch === '"' && state === 'start') { state = 'quoted'; continue; }
    if (ch === '"' || state === 'after-quote') throw new Error('Invalid CSV quoting');
    state = 'unquoted';
    cell += ch;
  }
  if (state === 'quoted') throw new Error('Unterminated CSV field');
  if (cell || row.length || state === 'after-quote') { row.push(cell); rows.push(row); }
  return rows;
}

export function importQueries(csv, articles = []) {
  const [headers, ...rows] = parseCsv(csv.replace(/^\uFEFF/, ''));
  if (!headers) throw new Error('Empty Search Console CSV');
  const columns = headers.map((header) => header.toLowerCase().trim());
  const queryIndex = columns.findIndex((header) => ['query', 'queries', 'top queries'].includes(header));
  const impressionsIndex = columns.indexOf('impressions'), clicksIndex = columns.indexOf('clicks'), positionIndex = columns.indexOf('position');
  if (queryIndex < 0 || impressionsIndex < 0 || clicksIndex < 0) throw new Error('Expected Search Console Query, Clicks and Impressions columns');
  return rows.filter((row) => row[queryIndex]?.trim()).map((row) => {
    const query = row[queryIndex].trim().slice(0, 500);
    const impressions = Number(row[impressionsIndex].replace(/,/g, '')), clicks = Number(row[clicksIndex].replace(/,/g, ''));
    const position = positionIndex >= 0 ? Number(row[positionIndex]) : null;
    if (![impressions, clicks].every((value) => Number.isFinite(value) && value >= 0)) throw new Error('Invalid Search Console metrics');
    return { query, impressions, clicks, position: Number.isFinite(position) ? position : null, matchingIntent: articles.find((article) => normalizedIntent(article.data.primaryIntent) === normalizedIntent(query))?.data.slug ?? null, status: 'needs-editorial-assessment' };
  }).sort((a, b) => b.impressions - a.impressions).slice(0, 100);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node scripts/import-gsc.mjs path/to/Queries.csv');
  const stat = await fs.stat(file);
  if (stat.size > 5_000_000) throw new Error('CSV exceeds 5 MB limit');
  const opportunities = importQueries(await fs.readFile(file, 'utf8'), await readArticles(process.cwd()));
  await writeJson(path.join(process.cwd(), 'automation/gsc-opportunities.json'), { importedAt: new Date().toISOString(), source: 'Search Console export supplied by editor', opportunities });
  console.log(`Imported ${opportunities.length} real queries for editorial assessment; no articles published.`);
}
