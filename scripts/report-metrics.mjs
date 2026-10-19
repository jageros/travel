import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDay, writeJson } from './content-lib.mjs';
import { parseCsv } from './import-gsc.mjs';

export const metricColumns = ['date', 'landing_page', 'channel', 'country', 'device', 'sessions', 'pageviews', 'ad_pageviews', 'ad_revenue', 'content_cost', 'hosting_cost', 'tool_cost', 'currency', 'time_zone'];
const countColumns = ['sessions', 'pageviews', 'ad_pageviews'];
const moneyColumns = ['ad_revenue', 'content_cost', 'hosting_cost', 'tool_cost'];
const cohortColumns = ['date', 'landing_page', 'channel', 'country', 'device'];
const aggregateTokens = new Set(['all', 'total', '(all)', '*', 'all users', 'all pages', 'all channels', 'all countries', 'all devices']);
const round = (value) => {
  if (!Number.isFinite(value)) throw new Error('Metric exceeds safe finite numeric range');
  return Number(value.toFixed(6));
};

function numberCell(value, field, line, integer = false) {
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) throw new Error(`Line ${line}: ${field} must be a nonnegative finite number without separators`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isSafeInteger(number))) throw new Error(`Line ${line}: invalid ${field}`);
  return number;
}

export function parseMetricRows(csv) {
  const [header, ...rawRows] = parseCsv(csv.replace(/^\uFEFF/, ''));
  if (!header) throw new Error('Metrics CSV is empty');
  const fields = header.map((value) => value.trim());
  if (new Set(fields).size !== fields.length || fields.length !== metricColumns.length || metricColumns.some((field) => !fields.includes(field))) throw new Error(`CSV must have these unique columns: ${metricColumns.join(',')}`);
  const seen = new Set();
  let currency, timeZone;
  const rows = rawRows.flatMap((cells, index) => {
    const line = index + 2;
    if (cells.length === 1 && !cells[0].trim()) return [];
    if (cells.length !== fields.length) throw new Error(`Line ${line}: wrong number of columns`);
    const row = Object.fromEntries(fields.map((field, col) => [field, cells[col].trim()]));
    if (!isDay(row.date)) throw new Error(`Line ${line}: date must be a real YYYY-MM-DD day`);
    for (const field of ['landing_page', 'channel', 'country', 'device']) {
      if (!row[field] || aggregateTokens.has(row[field].toLowerCase())) throw new Error(`Line ${line}: ${field} must be a distinct cohort, without aggregate/total rows`);
    }
    if (!/^\/(?!\/)[^?#\s]*$/.test(row.landing_page)) throw new Error(`Line ${line}: landing_page must be a canonical path without query or fragment`);
    row.landing_page = row.landing_page.replace(/\/+$/, '') || '/';
    if (!/^[a-z][a-z0-9_]*$/.test(row.channel)) throw new Error(`Line ${line}: channel must use lowercase snake_case, e.g. organic_search`);
    row.country = row.country.toUpperCase();
    if (!/^(?:[A-Z]{2}|UNKNOWN)$/.test(row.country)) throw new Error(`Line ${line}: country must be an ISO two-letter code or UNKNOWN`);
    row.device = row.device.toLowerCase();
    if (!['desktop', 'mobile', 'tablet', 'unknown'].includes(row.device)) throw new Error(`Line ${line}: device must be desktop, mobile, tablet or unknown`);
    if (!/^[A-Z]{3}$/.test(row.currency)) throw new Error(`Line ${line}: currency must be an uppercase ISO currency code`);
    try { row.time_zone = new Intl.DateTimeFormat('en-US', { timeZone: row.time_zone }).resolvedOptions().timeZone; }
    catch { throw new Error(`Line ${line}: time_zone must be a valid IANA time zone`); }
    currency ??= row.currency;
    timeZone ??= row.time_zone;
    if (row.currency !== currency || row.time_zone !== timeZone) throw new Error('Every row must use the same currency and time zone; do not mix reporting windows');
    for (const field of countColumns) row[field] = numberCell(row[field], field, line, true);
    for (const field of moneyColumns) row[field] = numberCell(row[field], field, line);
    const key = JSON.stringify(cohortColumns.map((field) => row[field]));
    if (seen.has(key)) throw new Error(`Line ${line}: duplicate date/landing_page/channel/country/device cohort`);
    seen.add(key);
    return [row];
  });
  if (!rows.length) throw new Error('Metrics CSV has no observations; add actual measured data');
  return rows;
}

export function summarizeMetricRows(rows) {
  const totals = Object.fromEntries([...countColumns, ...moneyColumns].map((field) => [field, 0]));
  totals.organic_sessions = 0;
  for (const row of rows) {
    for (const field of [...countColumns, ...moneyColumns]) totals[field] += row[field];
    if (row.channel === 'organic_search') totals.organic_sessions += row.sessions;
  }
  for (const field of countColumns) if (!Number.isSafeInteger(totals[field])) throw new Error(`Aggregate ${field} exceeds safe numeric range`);
  for (const field of moneyColumns) {
    if (!Number.isFinite(totals[field])) throw new Error(`Aggregate ${field} exceeds safe numeric range`);
    totals[field] = round(totals[field]);
  }
  totals.total_cost = round(totals.content_cost + totals.hosting_cost + totals.tool_cost);
  return {
    totals,
    metrics: {
      organic_sessions: totals.organic_sessions,
      pages_per_session: totals.sessions ? round(totals.pageviews / totals.sessions) : null,
      ad_page_rpm: totals.ad_pageviews ? round(totals.ad_revenue / totals.ad_pageviews * 1000) : null,
      revenue_per_1000_sessions: totals.sessions ? round(totals.ad_revenue / totals.sessions * 1000) : null,
      net_profit: round(totals.ad_revenue - totals.total_cost),
    },
  };
}

export function createMetricsReport(csv, { now = new Date() } = {}) {
  const rows = parseMetricRows(csv);
  const dates = rows.map((row) => row.date).sort();
  const pages = [...new Set(rows.map((row) => row.landing_page))].sort();
  return {
    version: 1, generated_at: now.toISOString(),
    period: { start: dates[0], end: dates.at(-1) }, currency: rows[0].currency, time_zone: rows[0].time_zone,
    cohort_rows: rows.length, ...summarizeMetricRows(rows),
    landing_pages: pages.map((landing_page) => ({ landing_page, ...summarizeMetricRows(rows.filter((row) => row.landing_page === landing_page)) })),
    definitions: { ad_page_rpm: 'Ad revenue / matched advertising-platform pageviews × 1000', revenue_per_1000_sessions: 'Custom ad revenue / matched GA4 sessions × 1000; not an AdSense-native RPM', net_profit: 'Ad revenue minus allocated content, hosting and tool costs' },
  };
}

export async function reportMetrics(input, root = process.cwd()) {
  const stat = await fs.stat(input);
  if (!stat.isFile() || stat.size > 5_000_000) throw new Error('Metrics CSV must be a file of at most 5 MB');
  const report = createMetricsReport(await fs.readFile(input, 'utf8'));
  await writeJson(path.join(root, 'reports/metrics.json'), report);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv[2];
  if (!input) {
    console.log('Usage: node scripts/report-metrics.mjs /path/to/matched-cohorts.csv\nUse docs/metrics-template.csv with actual same-period/cohort data. No report was written.');
  } else {
    try {
      const report = await reportMetrics(input);
      console.log(JSON.stringify({ period: report.period, currency: report.currency, time_zone: report.time_zone, ...report.metrics, output: 'reports/metrics.json' }, null, 2));
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
