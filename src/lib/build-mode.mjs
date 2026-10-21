/** Resolve deployment intent once for page rendering, Markdown and build checks. */
export function resolveDeploymentEnv(env = process.env) {
 const mode=env.DEPLOYMENT_ENV===undefined?'local':env.DEPLOYMENT_ENV;
 if(!['production','preview','local'].includes(mode))throw new Error('DEPLOYMENT_ENV must be production, preview or local');
 if(mode==='production'&&env.WORKERS_CI_BRANCH&&env.WORKERS_CI_BRANCH!=='main')throw new Error('Cloudflare production builds must use the main branch');
 if(mode==='production'&&env.CONTENT_REVIEW_PREVIEW==='true')throw new Error('Production builds cannot include editorial review copies');
 return mode;
}

/** Preview copies may be hidden without making that deployment indexable. */
export function isReviewBuild(env = process.env) {
 const mode=resolveDeploymentEnv(env);
 return mode==='preview'?env.CONTENT_REVIEW_PREVIEW!=='false':mode==='local'&&env.CONTENT_REVIEW_PREVIEW==='true';
}

export function isIndexableBuild(env = process.env) {
 return resolveDeploymentEnv(env)==='production'&&env.SITE_INDEXING_ENABLED==='true';
}
