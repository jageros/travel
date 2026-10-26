import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMetricsReport, metricColumns, parseMetricRows, reportMetrics } from '../scripts/report-metrics.mjs';
import { importQueries } from '../scripts/import-gsc.mjs';

const header = metricColumns.join(',');
const row = (overrides = {}) => {
  const data = { date: '2026-10-19', landing_page: '/guides/arrival/', channel: 'organic_search', country: 'US', device: 'mobile', sessions: '100', pageviews: '200', ad_pageviews: '150', ad_revenue: '3', content_cost: '1', hosting_cost: '0.2', tool_cost: '0.3', currency: 'USD', time_zone: 'Asia/Shanghai', ...overrides };
  return metricColumns.map((field) => data[field]).join(',');
};
const csv = (...rows) => `${header}\n${rows.join('\n')}\n`;

test('reports actual totals, weighted ratios, organic sessions and allocated net profit', () => {
  const report = createMetricsReport(csv(row(), row({ landing_page: '/guides/another/', channel: 'direct', sessions: '50', pageviews: '250', ad_pageviews: '50', ad_revenue: '7', content_cost: '2', hosting_cost: '0.1', tool_cost: '0.4' })));
  assert.equal(report.metrics.organic_sessions, 100);
  assert.equal(report.totals.sessions, 150);
  assert.equal(report.metrics.pages_per_session, 3);
  assert.equal(report.metrics.ad_page_rpm, 50);
  assert.equal(report.metrics.revenue_per_1000_sessions, 66.666667);
  assert.equal(report.metrics.net_profit, 6);
  assert.equal(report.landing_pages.length, 2);
  assert.match(report.definitions.revenue_per_1000_sessions, /not an AdSense-native/);
});

test('zero denominators give null ratios and costs can yield a loss', () => {
  const report = createMetricsReport(csv(row({ sessions: '0', pageviews: '0', ad_pageviews: '0', ad_revenue: '0' })));
  assert.equal(report.metrics.pages_per_session, null);
  assert.equal(report.metrics.ad_page_rpm, null);
  assert.equal(report.metrics.revenue_per_1000_sessions, null);
  assert.equal(report.metrics.net_profit, -1.5);
});

test('rejects duplicate cohorts including normalized trailing slash and country/device case', () => {
  assert.throws(() => parseMetricRows(csv(row(), row({ landing_page: '/guides/arrival', country: 'us', device: 'Mobile' }))), /duplicate/);
  assert.throws(() => parseMetricRows(csv(row({ channel: 'all' }))), /aggregate/);
});

test('rejects mixed currencies, reporting zones and impossible calendar days', () => {
  assert.throws(() => parseMetricRows(csv(row(), row({ device: 'desktop', currency: 'EUR' }))), /same currency/);
  assert.throws(() => parseMetricRows(csv(row(), row({ device: 'desktop', time_zone: 'UTC' }))), /same currency/);
  for (const override of [{ date: '2026-02-30' }, { time_zone: 'Invalid/Place' }]) assert.throws(() => parseMetricRows(csv(row(override))));
});

test('rejects missing, negative, nonfinite, fractional counts and malformed CSV rows', () => {
  for (const override of [{ sessions: '-1' }, { sessions: '1.5' }, { sessions: 'Infinity' }, { sessions: '' }, { ad_revenue: 'NaN' }, { tool_cost: '-0.1' }, { sessions: '9007199254740992' }, { landing_page: 'https://example.com/x' }]) assert.throws(() => parseMetricRows(csv(row(override))));
  assert.throws(() => parseMetricRows(`${header}\n2026-10-19,x`), /columns/);
  assert.throws(() => parseMetricRows(`${header}\n"unterminated`), /Unterminated/);
  assert.throws(() => parseMetricRows(csv(row({ sessions: '1"00"' }))), /quoting/);
  assert.throws(() => parseMetricRows(csv(row({ sessions: '"100"suffix' }))), /quoting/);
  assert.throws(() => parseMetricRows(`${header}\n`), /no observations/);
  assert.throws(() => parseMetricRows(`${header},sessions\n`), /unique columns/);
});

test('accepts reordered columns, CRLF and quoted canonical page fields', () => {
  const fields = [...metricColumns].reverse();
  const values = Object.fromEntries(metricColumns.map((field, i) => [field, row().split(',')[i]]));
  const input = `${fields.join(',')}\r\n${fields.map((field) => field === 'landing_page' ? '"/guides/arrival/"' : values[field]).join(',')}\r\n`;
  assert.equal(parseMetricRows(input)[0].landing_page, '/guides/arrival');
});

test('report writes only measured output to ignored reports path', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'travel-metrics-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const input = path.join(root, 'measurements.csv');
  await fs.writeFile(input, csv(row()));
  await reportMetrics(input, root);
  const result = JSON.parse(await fs.readFile(path.join(root, 'reports/metrics.json'), 'utf8'));
  assert.equal(result.cohort_rows, 1);
  assert.equal(result.totals.ad_revenue, 3);
});

test('English and Chinese Search Console headers preserve identical queries, metrics and editorial state', () => {
  const observations = 'bart to muni transfer,0,5,0%,32\n"Muni, Clipper",2,"1,234",0.16%,7.25';
  const articles = [{ data: { slug: 'muni-clipper-guide', primaryIntent: 'Muni Clipper' } }];
  const expected = [
    { query: 'Muni, Clipper', impressions: 1234, clicks: 2, position: 7.25, matchingIntent: 'muni-clipper-guide', status: 'needs-editorial-assessment' },
    { query: 'bart to muni transfer', impressions: 5, clicks: 0, position: 32, matchingIntent: null, status: 'needs-editorial-assessment' },
  ];
  for (const queryHeader of ['Query', 'Queries', 'Top queries']) {
    assert.deepEqual(importQueries(`${queryHeader},Clicks,Impressions,CTR,Position\n${observations}`, articles), expected);
  }
  const chinese = `\uFEFF热门查询,点击次数,展示,点击率,排名\r\n${observations.replaceAll('\n', '\r\n')}\r\n`;
  assert.deepEqual(importQueries(chinese, articles), expected);
});

test('localized Search Console exports still require query, clicks and impressions while position remains optional', () => {
  for (const fields of [['Query', 'Clicks', 'Impressions'], ['热门查询', '点击次数', '展示']]) {
    for (let missing = 0; missing < fields.length; missing += 1) {
      const remaining = fields.filter((_, index) => index !== missing);
      assert.throws(() => importQueries(`${remaining.join(',')}\n`), /Expected Search Console Query, Clicks and Impressions columns/);
    }
    assert.deepEqual(importQueries(`${fields.join(',')}\nclipper muni,0,1\n`), [
      { query: 'clipper muni', impressions: 1, clicks: 0, position: null, matchingIntent: null, status: 'needs-editorial-assessment' },
    ]);
  }
});
