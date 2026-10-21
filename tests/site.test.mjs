import test from 'node:test';
import assert from 'node:assert/strict';
import {factStatus} from '../src/lib/fact-status.mjs';
const now=new Date('2026-10-19T12:00:00Z');
test('current human-checked fact is visible until its expiry',()=>{
 assert.equal(factStatus({checkedAt:'2026-10-19',expiresAt:'2026-10-26',dynamic:true},{status:'unchanged'},now),'current');
});
test('expiry and missing expiry suppress dynamic claims',()=>{
 assert.equal(factStatus({checkedAt:'2026-10-10',expiresAt:'2026-10-19',dynamic:true},{status:'unchanged'},now),'expired');
 assert.equal(factStatus({checkedAt:'2026-10-19',dynamic:true},{status:'unchanged'},now),'expired');
 assert.equal(factStatus({checkedAt:'2026-10-19',expiresAt:'not-a-date',dynamic:true},{status:'unchanged'},now),'expired');
});
test('changed, unavailable and unaccepted source baselines suppress precise claims',()=>{
 for(const status of ['changed','unavailable','baseline-missing']) assert.equal(factStatus({checkedAt:'2026-10-19',expiresAt:'2026-10-26',dynamic:true},{status},now),'needs-review');
 assert.equal(factStatus({checkedAt:'2026-10-19'},{status:'unchanged'},now),'current');
});
test('unverified or future-dated sources cannot present current claims',()=>{
 assert.equal(factStatus({},undefined,now),'unverified');
 assert.equal(factStatus({checkedAt:'2026-10-19',expiresAt:'2026-10-26',dynamic:true},undefined,now),'unverified');
 assert.equal(factStatus({checkedAt:'invalid'},undefined,now),'unverified');
 assert.equal(factStatus({checkedAt:'2027-10-19'},undefined,now),'unverified');
});

import {rewriteUnpublishedLinks} from '../src/lib/remark-visible-links.mjs';
test('staged publication does not expose links to unreleased guides',()=>{
 const tree={type:'root',children:[
   {type:'link',url:'/guides/pending/',children:[{type:'text',value:'our next guide'}]},
   {type:'link',url:'/guides/live/#fares',children:[{type:'text',value:'current guide'}]},
   {type:'link',url:'https://www.bart.gov',children:[{type:'text',value:'operator'}]}
 ]};
 rewriteUnpublishedLinks(tree,new Set(['/guides/live/']));
 assert.deepEqual(tree.children[0],{type:'text',value:'our next guide'});
 assert.equal(tree.children[1].type,'link');
 assert.equal(tree.children[2].url,'https://www.bart.gov');
});

import {compareFares} from '../src/lib/fare-comparison.mjs';
test('fare calculator compares paid windows with integer cents and clear break-even',()=>{
 assert.deepEqual(compareFares(2.85,3,5.70),{singleTotal:8.55,passTotal:5.70,saving:2.85,breakEvenWindows:2});
 assert.equal(compareFares(3,1,10).saving,-7);
 assert.equal(compareFares(3,2,6).saving,0);
 for(const values of [[0,3,6],[3,1.5,6],[3,101,6],[NaN,3,6],[3,3,-1]])assert.equal(compareFares(...values),null);
});

import {resolveDeploymentEnv,isReviewBuild,isIndexableBuild} from '../src/lib/build-mode.mjs';
test('deployment environment defaults to local and rejects invalid explicit values',()=>{
 assert.equal(resolveDeploymentEnv({}),'local');
 for(const mode of ['production','preview','local'])assert.equal(resolveDeploymentEnv({DEPLOYMENT_ENV:mode}),mode);
 for(const mode of ['', 'Production','staging',null])assert.throws(()=>resolveDeploymentEnv({DEPLOYMENT_ENV:mode}),/DEPLOYMENT_ENV/);
});
test('explicit deployment environment takes precedence over transitional Vercel values',()=>{
 assert.equal(resolveDeploymentEnv({VERCEL_ENV:'production'}),'production');
 assert.equal(resolveDeploymentEnv({VERCEL_ENV:'preview'}),'preview');
 assert.equal(resolveDeploymentEnv({VERCEL_ENV:'development'}),'local');
 assert.equal(resolveDeploymentEnv({DEPLOYMENT_ENV:'preview',VERCEL_ENV:'production'}),'preview');
 assert.equal(resolveDeploymentEnv({DEPLOYMENT_ENV:'local',VERCEL_ENV:'production'}),'local');
 assert.throws(()=>resolveDeploymentEnv({DEPLOYMENT_ENV:'invalid',VERCEL_ENV:'production'}),/DEPLOYMENT_ENV/);
});
test('Cloudflare production builds require main and cannot include review articles',()=>{
 assert.equal(resolveDeploymentEnv({DEPLOYMENT_ENV:'production',WORKERS_CI_BRANCH:'main'}),'production');
 assert.throws(()=>resolveDeploymentEnv({DEPLOYMENT_ENV:'production',WORKERS_CI_BRANCH:'feature/new-page'}),/main branch/);
 assert.throws(()=>isReviewBuild({DEPLOYMENT_ENV:'production',CONTENT_REVIEW_PREVIEW:'true'}),/cannot include editorial review/);
 assert.equal(isReviewBuild({DEPLOYMENT_ENV:'local',CONTENT_REVIEW_PREVIEW:'true'}),true);
 assert.equal(isReviewBuild({DEPLOYMENT_ENV:'local'}),false);
});
test('hiding review copies cannot enable indexing on a preview or local build',()=>{
 for(const mode of ['preview','local'])for(const flag of [undefined,'false','true']){
  const env={DEPLOYMENT_ENV:mode,SITE_INDEXING_ENABLED:'true',CONTENT_REVIEW_PREVIEW:flag};
  assert.equal(isIndexableBuild(env),false);
  assert.equal(isReviewBuild(env),mode==='preview'?flag!=='false':flag==='true');
 }
 assert.equal(isIndexableBuild({DEPLOYMENT_ENV:'production',SITE_INDEXING_ENABLED:'true'}),true);
 assert.equal(isIndexableBuild({DEPLOYMENT_ENV:'production',SITE_INDEXING_ENABLED:'false'}),false);
 assert.equal(isIndexableBuild({SITE_INDEXING_ENABLED:'true'}),false);
});
