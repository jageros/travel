import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const creativeCommons = new Map([
  ['CC0-1.0', '/publicdomain/zero/1.0/'],
  ['CC-BY-2.0', '/licenses/by/2.0/'],
  ['CC-BY-3.0', '/licenses/by/3.0/'],
  ['CC-BY-4.0', '/licenses/by/4.0/'],
  ['CC-BY-SA-2.0', '/licenses/by-sa/2.0/'],
  ['CC-BY-SA-2.5', '/licenses/by-sa/2.5/'],
  ['CC-BY-SA-3.0', '/licenses/by-sa/3.0/'],
  ['CC-BY-SA-4.0', '/licenses/by-sa/4.0/'],
]);

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sha1 = /^[a-f0-9]{40}$/;
const sha256 = /^[a-f0-9]{64}$/;
const realDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

function publicHttps(value) {
  if (!hasText(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function creativeCommonsLicenseUrl(license) {
  const pathname = creativeCommons.get(license);
  return pathname ? `https://creativecommons.org${pathname}` : null;
}

function validProvenance(record) {
  const kind = record.kind ?? 'photo';
  const source = publicHttps(record.sourceUrl);
  const original = publicHttps(record.originalUrl);
  const license = publicHttps(record.licenseUrl);
  if (!source || !license) return false;
  const ccPath = creativeCommons.get(record.license);
  if (ccPath && (license.hostname !== 'creativecommons.org' || license.pathname !== ccPath ||
    license.search || license.hash)) return false;

  if (kind === 'photo') {
    if (record.generation) return false;
    if (record.license === 'Pexels License') {
      const assetId = /^\/photo\/[^/]+-(\d+)\/$/.exec(source.pathname)?.[1];
      return Boolean(assetId && source.hostname === 'www.pexels.com' && license.href === 'https://www.pexels.com/license/' &&
        original?.hostname === 'images.pexels.com' && original.pathname === `/photos/${assetId}/pexels-photo-${assetId}.jpeg`);
    }
    return Boolean(ccPath && source.hostname === 'commons.wikimedia.org' && source.pathname.startsWith('/wiki/File:') &&
      original?.hostname === 'upload.wikimedia.org' && original.pathname.startsWith('/wikipedia/commons/'));
  }
  if (kind === 'official') return Boolean(original && hasText(record.permissionNote) && !record.generation);
  if (kind === 'illustration') {
    const generation = record.generation;
    return (!record.originalUrl || original !== null) && realDay(generation?.generatedAt) &&
      generation.generatedAt <= record.checkedAt && hasText(generation?.provider) && hasText(generation?.promptSummary);
  }
  return false;
}

export async function validatePhotoRegistry(records, { root = process.cwd() } = {}) {
  if (!Array.isArray(records)) return ['Image registry must be an array'];
  const errors = [];
  const ids = new Set();
  const files = new Set();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      errors.push('Image registry entry must be an object');
      continue;
    }
    const { id, file } = record;
    if (typeof id !== 'string' || !slug.test(id) || ids.has(id)) errors.push(`${id}: invalid or duplicate image ID`);
    ids.add(id);
    const safeFile = typeof file === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/.test(file);
    if (!safeFile || files.has(file)) errors.push(`${id}: invalid or duplicate local JPEG filename`);
    files.add(file);
    for (const field of ['title', 'author', 'alt', 'caption', 'license', 'sourceTitle']) {
      if (!hasText(record[field])) errors.push(`${id}: ${field} is required`);
    }
    if (!realDay(record.checkedAt) || (record.capturedAt !== undefined &&
      (!realDay(record.capturedAt) || record.capturedAt > record.checkedAt))) errors.push(`${id}: invalid image dates`);
    if (!Number.isInteger(record.width) || record.width <= 0 || !Number.isInteger(record.height) || record.height <= 0) {
      errors.push(`${id}: positive image dimensions are required`);
    }
    if (!validProvenance(record)) errors.push(`${id}: invalid image source, license or provenance`);
    if (!sha1.test(record.originalSha1 ?? '') || !sha256.test(record.sha256 ?? '')) {
      errors.push(`${id}: original SHA-1 and local SHA-256 are required`);
    }
    if (!safeFile) continue;
    try {
      const bytes = await fs.readFile(path.join(root, 'src/assets/photos', file));
      if (bytes.length < 4 || !bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
        errors.push(`${id}: local image must be JPEG`);
      }
      if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) {
        errors.push(`${id}: local image SHA-256 does not match`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      errors.push(`${id}: local image is missing`);
    }
  }
  return errors;
}
