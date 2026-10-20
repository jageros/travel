export const CANONICAL_SITE_URL = 'https://www.cedartrips.com';
export const SITE_NAME = 'Cedar Trips';
export const SITE_EDITORIAL_TEAM = `${SITE_NAME} Editorial Team`;

/** Public origin shared by Astro, templates and editorial scripts.
 * @param {string | undefined} value
 * @returns {string}
 */
export function resolveSiteUrl(value) {
  if (value === undefined || value === '') return CANONICAL_SITE_URL;
  let url;
  try { url = new URL(value); }
  catch { throw new Error(`PUBLIC_SITE_URL must be ${CANONICAL_SITE_URL}`); }
  if (url.hostname === 'travel.mumasir.com') {
    throw new Error(`PUBLIC_SITE_URL still uses the retired travel.mumasir.com domain. Update it to ${CANONICAL_SITE_URL} and rebuild.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port
    || !['www.cedartrips.com', 'cedartrips.com'].includes(url.hostname)
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`PUBLIC_SITE_URL must be ${CANONICAL_SITE_URL} without credentials, a path, query or fragment.`);
  }
  return CANONICAL_SITE_URL;
}
