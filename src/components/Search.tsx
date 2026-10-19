import { useEffect, useMemo, useState } from 'react';

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  topic: string;
  type: string;
}

export default function Search({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All guides');
  const [ready, setReady] = useState(false);
  const topics = useMemo(() => ['All guides', ...new Set(items.map((item) => item.topic).filter(Boolean))], [items]);
  const results = useMemo(() => {
    const words = query.toLocaleLowerCase('en-US').trim().split(/\s+/).filter(Boolean);
    return items.filter((item) => (filter === 'All guides' || item.topic === filter) && words.every((word) => `${item.title} ${item.description} ${item.topic} ${item.type}`.toLocaleLowerCase('en-US').includes(word)));
  }, [items, query, filter]);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (!query.trim()) return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('travel:search', { detail: { query_length: Math.min(query.trim().length, 100), result_count: results.length } }));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [query, results.length]);

  return (
    <div className="search-directory">
      <div className="search-controls" hidden={!ready}>
        <label className="search-label" htmlFor="guide-search">Find your next step</label>
        <div className="search-input-wrap">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          <input id="guide-search" type="search" placeholder="Try airport, car-free, or transit…" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        </div>
        {topics.length > 2 && <div className="filter-pills" aria-label="Filter by topic">{topics.map((topic) => <button key={topic} type="button" aria-pressed={filter === topic} onClick={() => setFilter(topic)}>{topic}</button>)}</div>}
      </div>
      <p className="search-count" aria-live="polite" aria-atomic="true">{results.length} {results.length === 1 ? 'guide' : 'guides'}{query.trim() ? ` for “${query.trim()}”` : ' to help you plan'}</p>
      <div className="cards-grid">
        {results.map((item, index) => (
          <article className="guide-card" key={item.href}>
            <div className="card-topline"><span className="card-type">{item.type}</span><span className="card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
            <h3 className="card-title"><a href={item.href} data-analytics="internal-link">{item.title}</a></h3>
            <p className="card-description">{item.description}</p>
            <div className="card-meta"><span>{item.topic}</span><span className="card-arrow" aria-hidden="true">↗</span></div>
          </article>
        ))}
      </div>
      {results.length === 0 && <div className="empty-state"><h3>No matching guides yet</h3><p>Try a broader term, or browse all our planning guides.</p><button className="button button-secondary" type="button" onClick={() => { setQuery(''); setFilter('All guides'); }}>Show all guides</button></div>}
    </div>
  );
}
