import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultLocale,
  getLocale,
  getLocaleFromPath,
  localeLabels,
  localePath,
  localeUrl,
  locales,
  stripLocale,
  sourceArticleDigest,
  sourceSupplementalDigest,
} from '../src/lib/i18n.mjs';
import { readArticles } from '../scripts/content-lib.mjs';

test('the locale registry exposes the twelve launch languages and one unprefixed default', () => {
  assert.equal(locales.length, 12);
  assert.equal(defaultLocale.code, 'en-US');
  assert.equal(defaultLocale.path, '');
  assert.equal(getLocale('ar').dir, 'rtl');
  assert.equal(getLocale('zh-Hans').path, 'zh-hans');
});

test('locale paths preserve stable English routes and trailing slashes', () => {
  assert.equal(localePath('en-US', '/destinations/yosemite/'), '/destinations/yosemite/');
  assert.equal(localePath('es', '/destinations/yosemite/'), '/es/destinations/yosemite/');
  assert.equal(localePath('pt-BR', '/'), '/pt-br/');
  assert.equal(getLocaleFromPath('/zh-hans/destinations/yosemite/').code, 'zh-Hans');
  assert.deepEqual(stripLocale('/ar/guides/example/'), { locale: getLocale('ar'), path: '/guides/example/' });
  assert.deepEqual(stripLocale('/destinations/yosemite/'), { locale: defaultLocale, path: '/destinations/yosemite/' });
});

test('localized labels and absolute URLs use the registered locale metadata', () => {
  assert.equal(localeLabels('es').destinations, 'Destinos');
  assert.equal(localeLabels('ar').language, 'اللغة');
  assert.equal(localeUrl('https://www.cedartrips.com', 'ja', '/destinations/yosemite/'), 'https://www.cedartrips.com/ja/destinations/yosemite/');
});

test('localized derivatives bind to the exact raw article and supplemental fingerprints', async () => {
  const article = (await readArticles(process.cwd())).find(item => item.data.slug === 'grand-canyon');
  assert.ok(article);
  assert.equal(sourceArticleDigest(article), article.digest);
  assert.match(sourceSupplementalDigest(article), /^[a-f0-9]{64}$/);
});
