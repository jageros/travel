import {isReviewBuild,isIndexableBuild} from './build-mode.mjs';
import {resolveSiteUrl} from './site-config.mjs';
export {SITE_NAME, SITE_EDITORIAL_TEAM} from './site-config.mjs';
export const SITE_URL = resolveSiteUrl(import.meta.env.PUBLIC_SITE_URL);
const buildEnv = {
  DEPLOYMENT_ENV:import.meta.env.DEPLOYMENT_ENV,
  WORKERS_CI_BRANCH:import.meta.env.WORKERS_CI_BRANCH,
  CONTENT_REVIEW_PREVIEW:import.meta.env.CONTENT_REVIEW_PREVIEW,
  SITE_INDEXING_ENABLED:import.meta.env.SITE_INDEXING_ENABLED,
  VERCEL_ENV:import.meta.env.VERCEL_ENV
};
export const isReviewPreview = isReviewBuild(buildEnv);
export const isIndexable = isIndexableBuild(buildEnv);
export const gaMeasurementId = isIndexable && /^G-[A-Z0-9]+$/.test(import.meta.env.PUBLIC_GA_MEASUREMENT_ID || '') ? import.meta.env.PUBLIC_GA_MEASUREMENT_ID : '';
export const adsenseClient = isIndexable && import.meta.env.ADSENSE_READY === 'true' && /^ca-pub-\d{16}$/.test(import.meta.env.PUBLIC_ADSENSE_CLIENT || '') ? import.meta.env.PUBLIC_ADSENSE_CLIENT : '';
export const adsenseSlots = {
  midArticle: /^\d+$/.test(import.meta.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE || '') ? import.meta.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE : '',
  endArticle: /^\d+$/.test(import.meta.env.PUBLIC_ADSENSE_SLOT_END_ARTICLE || '') ? import.meta.env.PUBLIC_ADSENSE_SLOT_END_ARTICLE : ''
};
export const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(import.meta.env.PUBLIC_CONTACT_EMAIL || '') ? import.meta.env.PUBLIC_CONTACT_EMAIL : '';
export const googleSiteVerification = /^[A-Za-z0-9_-]+$/.test(import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION || '') ? import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION : '';
