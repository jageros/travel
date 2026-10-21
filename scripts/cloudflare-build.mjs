import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolveDeploymentEnv,isReviewBuild} from '../src/lib/build-mode.mjs';

const buildScripts=['validate:content','build','verify:build'];

/** Workers Builds variables can be shared by production and branch builds. */
export function resolveCloudflareBuildEnv(input=process.env) {
 const env={...input};
 const branch=input.WORKERS_CI_BRANCH;
 const onCloudflare=Object.hasOwn(input,'WORKERS_CI')||Object.hasOwn(input,'WORKERS_CI_BRANCH');
 let mode;
 if(onCloudflare) {
  if(typeof branch!=='string'||!branch||branch.trim()!==branch)throw new Error('Workers Builds requires a nonempty WORKERS_CI_BRANCH');
  mode=branch==='main'?'production':'preview';
 }else {
  // Local production and preview checks require explicit deployment intent.
  mode=resolveDeploymentEnv({...env,DEPLOYMENT_ENV:env.DEPLOYMENT_ENV??'local'});
 }
 env.DEPLOYMENT_ENV=mode;
 env.CONTENT_REVIEW_PREVIEW=mode==='production'?'false':mode==='preview'?'true':String(isReviewBuild({...env,DEPLOYMENT_ENV:'local'}));
 env.SITE_INDEXING_ENABLED=mode==='production'&&input.SITE_INDEXING_ENABLED==='true'?'true':'false';
 if(mode!=='production') {
  env.PUBLIC_GA_MEASUREMENT_ID='';
  env.ADSENSE_READY='false';
 }
 // Keep the renderer's validation and the command wrapper aligned.
 resolveDeploymentEnv(env);
 return env;
}

export function runCloudflareBuild({env=process.env,root=process.cwd(),run=spawnSync}={}) {
 const childEnv=resolveCloudflareBuildEnv(env);
 const command=process.platform==='win32'?'npm.cmd':'npm';
 for(const script of buildScripts) {
  const result=run(command,['run',script],{cwd:root,env:childEnv,stdio:'inherit',shell:false});
  if(result.error)throw new Error(`Unable to start build script: ${script}`);
  if(result.status!==0)throw new Error(`Build script failed: ${script}`);
 }
 return {deploymentEnv:childEnv.DEPLOYMENT_ENV,scripts:[...buildScripts]};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 try {runCloudflareBuild();}
 catch(error){console.error(error.message);process.exitCode=1;}
}
