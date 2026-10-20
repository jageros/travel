import {isReviewBuild} from './build-mode.mjs';
const productionUrl = 'https://travel.mumasir.com';
function safeSiteUrl(value?: string): string {
  try {
    const url = new URL(value || productionUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return productionUrl;
    return url.origin;
  } catch { return productionUrl; }
}
export const SITE_URL = safeSiteUrl(import.meta.env.PUBLIC_SITE_URL);
export const SITE_NAME = 'US Travel Guide';
export const isReviewPreview = isReviewBuild({CONTENT_REVIEW_PREVIEW:import.meta.env.CONTENT_REVIEW_PREVIEW,VERCEL_ENV:import.meta.env.VERCEL_ENV});
export const isIndexable = import.meta.env.SITE_INDEXING_ENABLED === 'true'
  && !isReviewPreview && (!import.meta.env.VERCEL_ENV || import.meta.env.VERCEL_ENV === 'production');
export const gaMeasurementId = isIndexable && /^G-[A-Z0-9]+$/.test(import.meta.env.PUBLIC_GA_MEASUREMENT_ID || '') ? import.meta.env.PUBLIC_GA_MEASUREMENT_ID : '';
export const adsenseClient = isIndexable && import.meta.env.ADSENSE_READY === 'true' && /^ca-pub-\d{16}$/.test(import.meta.env.PUBLIC_ADSENSE_CLIENT || '') ? import.meta.env.PUBLIC_ADSENSE_CLIENT : '';
export const adsenseSlots = {
  midArticle: /^\d+$/.test(import.meta.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE || '') ? import.meta.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE : '',
  endArticle: /^\d+$/.test(import.meta.env.PUBLIC_ADSENSE_SLOT_END_ARTICLE || '') ? import.meta.env.PUBLIC_ADSENSE_SLOT_END_ARTICLE : ''
};
export const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(import.meta.env.PUBLIC_CONTACT_EMAIL || '') ? import.meta.env.PUBLIC_CONTACT_EMAIL : '';
export const googleSiteVerification = /^[A-Za-z0-9_-]+$/.test(import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION || '') ? import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION : '';
