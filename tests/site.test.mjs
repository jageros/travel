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
