import {adsenseClient} from '../lib/site';
export function GET() {
  return new Response(adsenseClient?`google.com, ${adsenseClient.replace('ca-','')}, DIRECT, f08c47fec0942fa0\n`:'# No advertising sellers are authorized by this site until configured.\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
