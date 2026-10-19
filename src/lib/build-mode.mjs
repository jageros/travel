/** Vercel review deployments include review copies by default, never search indexing. */
export function isReviewBuild(env = process.env) {
 return env.CONTENT_REVIEW_PREVIEW==='true'||(env.VERCEL_ENV==='preview'&&env.CONTENT_REVIEW_PREVIEW!=='false');
}
