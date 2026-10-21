import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArgs} from 'node:util';

const {values:args}=parseArgs({options:{'base-url':{type:'string'},'output-dir':{type:'string'},runs:{type:'string'},'lighthouse-cli':{type:'string'}}});
const base=new URL(args['base-url']||'http://127.0.0.1:4548/');
if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||base.username||base.password||base.search||base.hash)throw new Error('Use a local HTTP production preview base URL');
const runs=Number(args.runs||3);
if(!Number.isInteger(runs)||runs<1||runs>10)throw new Error('--runs must be an integer from 1 to 10');
const output=path.resolve(args['output-dir']||'artifacts/mobile-performance');
const pinnedVersion='13.5.0';
const cli=args['lighthouse-cli'];
const command=cli?process.execPath:'npm';
const commandPrefix=cli?[path.resolve(cli)]:['exec','--yes',`--package=lighthouse@${pinnedVersion}`,'--','lighthouse'];
const routes=[{name:'home',path:'/'},{name:'sfo-guide',path:'/guides/sfo-to-fishermans-wharf-with-luggage/'}];
const metrics={fcpMs:'first-contentful-paint',lcpMs:'largest-contentful-paint',tbtMs:'total-blocking-time',cls:'cumulative-layout-shift',speedIndexMs:'speed-index'};
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
await fs.mkdir(output,{recursive:true});
const summary={startedAt:new Date().toISOString(),lighthouseVersion:pinnedVersion,method:'Local production build; default Lighthouse mobile Slow4G simulation and 4x CPU slowdown; separate headless Chrome profile and storage reset per run; optional cookies remain unaccepted.',limits:'Lab page-load measurements only. TBT is not INP. Localhost excludes public DNS, TLS and CDN/origin latency; these results do not establish real-user Core Web Vitals.',pages:[]};
for(const route of routes){
 const page={name:route.name,url:new URL(route.path,base).href,runs:[]};
 for(let i=1;i<=runs;i++){
  const stem=path.join(output,`${route.name}-${i}`);
  execFileSync(command,[...commandPrefix,page.url,'--only-categories=performance','--form-factor=mobile','--throttling-method=simulate','--output=json','--output=html',`--output-path=${stem}`,'--save-assets','--chrome-flags=--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-extensions','--no-enable-error-reporting','--quiet'],{env:{...process.env,NO_PROXY:'localhost,127.0.0.1,::1'},stdio:'inherit',timeout:180000});
  const report=JSON.parse(await fs.readFile(`${stem}.report.json`,'utf8'));
  if(report.lighthouseVersion!==pinnedVersion||report.runtimeError)throw new Error(`${route.name} run ${i}: invalid Lighthouse run`);
  const measured={run:i,fetchTime:report.fetchTime,performanceScore:report.categories.performance.score*100,reportJson:`${stem}.report.json`,reportHtml:`${stem}.report.html`,benchmarkIndex:report.environment.benchmarkIndex,warnings:report.runWarnings};
  for(const [name,id]of Object.entries(metrics)){
   const value=report.audits[id]?.numericValue;
   if(!Number.isFinite(value))throw new Error(`${route.name} run ${i}: missing ${id}`);
   measured[name]=value;
  }
  const requests=report.audits['network-requests']?.details?.items||[];
  measured.transferBytes=requests.reduce((total,item)=>total+(item.transferSize||0),0);
  measured.externalPageRequests=requests.filter(item=>/^https?:/.test(item.url)&&new URL(item.url).origin!==base.origin).map(item=>item.url);
  if(!summary.settings)summary.settings={...report.configSettings,hostUserAgent:report.environment.hostUserAgent,networkUserAgent:report.environment.networkUserAgent};
  page.runs.push(measured);
  console.log(JSON.stringify({page:route.name,...measured}));
 }
 page.median=Object.fromEntries(['performanceScore',...Object.keys(metrics),'transferBytes'].map(key=>[key,median(page.runs.map(run=>run[key]))]));
 page.targets={lcpWithin2500ms:page.median.lcpMs<=2500,clsWithinPoint1:page.median.cls<=0.1};
 summary.pages.push(page);
}
summary.completedAt=new Date().toISOString();
await fs.writeFile(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({summary:path.join(output,'summary.json'),pages:summary.pages.map(({name,median,targets})=>({name,median,targets}))},null,2));
