import fs from 'node:fs';
import { factStatus } from './fact-status.mjs';
export interface Fact { id:string; statement:string; checkedAt:string; expiresAt?:string; dynamic?:boolean; evidence?:string }
export interface Source { id:string; url:string; title:string; publisher:string; checkedAt:string; facts:Fact[] }
interface Registry {sources:Source[]}
interface Health {sources:Array<{id:string;status:string}>;conflicts?:string[]}
function readRoot<T>(name:string):T {
  return JSON.parse(fs.readFileSync(`${process.cwd()}/automation/${name}`,'utf8')) as T;
}
export const registry = readRoot<Registry>('sources.json');
const health = readRoot<Health>('source-health.json');
if (!Array.isArray(registry.sources) || !Array.isArray(health.sources)) throw new Error('Invalid source registry or source-health file');
export function articleSources(ids:string[]):Source[] { return ids.map(id => {const source=registry.sources.find(source=>source.id===id);if(!source)throw new Error(`Unknown article source: ${id}`);return source;}); }
export function articleFacts(ids:string[]) {
  return ids.map(id=>{
    const source = registry.sources.find(source=>source.facts?.some(fact=>fact.id===id));
    const fact = source?.facts.find(fact=>fact.id===id);
    if (!fact || !source) throw new Error(`Unknown article fact: ${id}`);
    return {fact,source,status:health.conflicts?.includes(id) ? 'needs-review' : factStatus(fact,health.sources.find(item=>item.id===source.id))};
  }).filter((item):item is NonNullable<typeof item>=>Boolean(item));
}
