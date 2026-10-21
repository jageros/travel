import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {resolveCloudflareBuildEnv,runCloudflareBuild} from '../scripts/cloudflare-build.mjs';
import {resolveDeploymentEnv,isIndexableBuild,isReviewBuild} from '../src/lib/build-mode.mjs';

test('Cloudflare main builds override shared mode and review settings but indexing remains explicit',()=>{
 const input={WORKERS_CI:'1',WORKERS_CI_BRANCH:'main',DEPLOYMENT_ENV:'preview',CONTENT_REVIEW_PREVIEW:'true',SITE_INDEXING_ENABLED:'true',PUBLIC_GA_MEASUREMENT_ID:'G-QDDLYW7WRF',ADSENSE_READY:'false'};
 const env=resolveCloudflareBuildEnv(input);
 assert.equal(resolveDeploymentEnv(env),'production');
 assert.equal(isReviewBuild(env),false);
 assert.equal(isIndexableBuild(env),true);
 assert.equal(env.PUBLIC_GA_MEASUREMENT_ID,'G-QDDLYW7WRF');
 assert.equal(input.DEPLOYMENT_ENV,'preview','does not mutate the caller environment');
 for(const value of [undefined,'','false','TRUE'])assert.equal(isIndexableBuild(resolveCloudflareBuildEnv({...input,SITE_INDEXING_ENABLED:value})),false);
});

test('every non-main branch is a safe review preview even with production variables',()=>{
 for(const branch of ['codex/cloudflare-migration','automation/editorial','main-copy','MAIN','发布预览']) {
  const env=resolveCloudflareBuildEnv({WORKERS_CI:'1',WORKERS_CI_BRANCH:branch,DEPLOYMENT_ENV:'production',CONTENT_REVIEW_PREVIEW:'false',SITE_INDEXING_ENABLED:'true',PUBLIC_GA_MEASUREMENT_ID:'G-QDDLYW7WRF',ADSENSE_READY:'true'});
  assert.equal(resolveDeploymentEnv(env),'preview');
  assert.equal(isReviewBuild(env),true);
  assert.equal(isIndexableBuild(env),false);
  assert.equal(env.PUBLIC_GA_MEASUREMENT_ID,'');
  assert.equal(env.ADSENSE_READY,'false');
 }
});

test('Cloudflare refuses missing or malformed branch metadata before launching build scripts',()=>{
 for(const env of [{WORKERS_CI:'1'},{WORKERS_CI:''},{WORKERS_CI_BRANCH:''},{WORKERS_CI_BRANCH:undefined},{WORKERS_CI:'1',WORKERS_CI_BRANCH:' '},{WORKERS_CI:'1',WORKERS_CI_BRANCH:'main '},{WORKERS_CI_BRANCH:123}]) {
  assert.throws(()=>runCloudflareBuild({env,run:()=>assert.fail('must not spawn a command without branch metadata')}),/WORKERS_CI_BRANCH/);
 }
});

test('local usage requires explicit deployment intent before enabling production features',()=>{
 const common={SITE_INDEXING_ENABLED:'true',ADSENSE_READY:'true',PUBLIC_GA_MEASUREMENT_ID:'G-QDDLYW7WRF'};
 const local=resolveCloudflareBuildEnv(common);
 assert.equal(resolveDeploymentEnv(local),'local');
 assert.equal(isIndexableBuild(local),false);
 assert.equal(local.ADSENSE_READY,'false');
 assert.equal(local.PUBLIC_GA_MEASUREMENT_ID,'');
 const production=resolveCloudflareBuildEnv({...common,DEPLOYMENT_ENV:'production'});
 assert.equal(resolveDeploymentEnv(production),'production');
 assert.equal(isIndexableBuild(production),true);
 const preview=resolveCloudflareBuildEnv({...common,DEPLOYMENT_ENV:'preview'});
 assert.equal(isReviewBuild(preview),true);
 assert.equal(isIndexableBuild(preview),false);
 assert.throws(()=>resolveCloudflareBuildEnv({DEPLOYMENT_ENV:'staging'}),/DEPLOYMENT_ENV/);
 assert.throws(()=>resolveCloudflareBuildEnv({DEPLOYMENT_ENV:'production',CONTENT_REVIEW_PREVIEW:'true'}),/review copies/);
});

test('the build executes existing checks in order with one isolated child environment',()=>{
 const calls=[];
 const result=runCloudflareBuild({root:'/project',env:{WORKERS_CI:'1',WORKERS_CI_BRANCH:'feature',SITE_INDEXING_ENABLED:'true'},run:(command,args,options)=>{calls.push({command,args,options});return {status:0};}});
 assert.deepEqual(result,{deploymentEnv:'preview',scripts:['validate:content','build','verify:build']});
 assert.deepEqual(calls.map(call=>call.args),[['run','validate:content'],['run','build'],['run','verify:build']]);
 for(const call of calls){
  assert.equal(call.command,process.platform==='win32'?'npm.cmd':'npm');
  assert.equal(call.options.cwd,'/project');
  assert.equal(call.options.stdio,'inherit');
  assert.equal(call.options.shell,false);
  assert.equal(call.options.env.DEPLOYMENT_ENV,'preview');
  assert.equal(call.options.env.SITE_INDEXING_ENABLED,'false');
 }
 assert.equal(calls[0].options.env,calls[2].options.env);
});

test('validation, build and verification failures stop all following steps without revealing credentials',()=>{
 for(const failedAt of [0,1,2])for(const failure of [{status:1},{status:null,signal:'SIGTERM'},{error:new Error('secret-value')}]) {
  let calls=0;
  assert.throws(()=>runCloudflareBuild({env:{DEPLOYMENT_ENV:'local',CLOUDFLARE_API_TOKEN:'secret-value'},run:()=>calls++===failedAt?failure:{status:0}}),error=>{
   assert.doesNotMatch(error.message,/secret-value|CLOUDFLARE_API_TOKEN/);
   return /build script/i.test(error.message);
  });
  assert.equal(calls,failedAt+1);
 }
});

test('the build wrapper can load before npm installation without any npm package imports',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'cedar-cloudflare-build-'));
 try {
  await mkdir(path.join(root,'scripts'),{recursive:true});
  await mkdir(path.join(root,'src/lib'),{recursive:true});
  await copyFile(new URL('../scripts/cloudflare-build.mjs',import.meta.url),path.join(root,'scripts/cloudflare-build.mjs'));
  await copyFile(new URL('../src/lib/build-mode.mjs',import.meta.url),path.join(root,'src/lib/build-mode.mjs'));
  const script=`const {resolveCloudflareBuildEnv}=await import(${JSON.stringify(pathToFileURL(path.join(root,'scripts/cloudflare-build.mjs')).href)});if(resolveCloudflareBuildEnv({WORKERS_CI:'1',WORKERS_CI_BRANCH:'main'}).DEPLOYMENT_ENV!=='production')process.exit(2);`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:root,encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stdout,'');
 }finally{await rm(root,{recursive:true,force:true});}
});
