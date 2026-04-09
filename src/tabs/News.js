import React, { useEffect, useState, useCallback } from 'react';

// Allow up to 200 headlines for filtering
const API_ENDPOINT =
  'https://api.marketaux.com/v1/news/all?api_token=QomNMo4PgtXOwUdRZb5WWPav9QOreXZXaA9i5ahC&countries=IN&limit=200';

function normalizeArticle(item) {
  // Prefer id if present, fallback to uuid or a composite string
  const id =
    item.id ??
    item.uuid ??
    `${item.title ?? 'news'}-${item.publishedAt ?? Date.now()}`;
  return {
    id,
    title: item.title ?? 'Untitled',
    description: item.description ?? item.summary ?? '',
    url: item.url ?? item.link ?? '#',
    publishedAt: item.publishedAt ?? item.published_at ?? '',
    source: item.source ?? 'Unknown'
  };
}

function NewsItem({ article }) {
  return (
    <li style={{ marginBottom: 18 }}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#19498c"
        }}
      >
        {article.title}
      </a>
      <div style={{ color: "#222", fontSize: 18, marginTop: 4 }}>
        {article.description}
      </div>
      <div style={{ color: "#555", fontSize: 16, marginTop: 4 }}>
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleString()
          : ''}{" "}
        | {article.source}
      </div>
    </li>
  );
}

function NewsList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ fontSize: 16, color: "#555" }}>
        No news found.
      </div>
    );
  }
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((a) => (
        <NewsItem key={a.id} article={a} />
      ))}
    </ul>
  );
}

export default function NewsTab() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only India, only last MAX_AGE_DAYS days
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const raw = data?.data ?? [];
      const now = new Date();
      const MAX_AGE_DAYS = 5; // extend range for fallback
      const MARKET_KEYWORDS = [
        'market', 'sensex', 'nifty', 'stocks', 'stock', 'equity', 'share', 'bse',
        'nse', 'ipo', 'mutual fund', 'stock market', 'profit', 'loss', 'rbi',
        'bank', 'company', 'corporate', 'commodity', 'bond', 'currency', 'results', 'earnings',
        'fintech', 'quarter', 'announcement', 'listing', 'demat'
      ];
      // 1. Recent + relevant
      const all = raw.map(normalizeArticle)
        .filter(a => {
          const published = a.publishedAt ? new Date(a.publishedAt) : null;
          return published && ((now - published) / (1000 * 60 * 60 * 24)) <= MAX_AGE_DAYS;
        })
        .sort((a, b) => (b.publishedAt && a.publishedAt ? (b.publishedAt.localeCompare(a.publishedAt)) : 0));
      const filtered = all.filter(a => {
        const text = (a.title + ' ' + a.description).toLowerCase();
        return MARKET_KEYWORDS.some(kw => text.includes(kw));
      });
      // 2. If too few pass, fall back to recent India news (still recent, up to 20)
      setNews((filtered.length >= 6 ? filtered : all).slice(0, 20));
    } catch (err) {
      setError(err?.message ?? 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <section aria-label="Market News" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Market News (India)</h2>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={fetchNews}
          disabled={loading}
          style={{ padding: "8px 12px", fontSize: 14 }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && (
        <div style={{ color: "#b00020", marginBottom: 8 }}>
          Error: {error}{" "}
          <button onClick={fetchNews} style={{ marginLeft: 8 }}>
            Retry
          </button>
        </div>
      )}
      {loading && !error ? (
        <div style={{ fontSize: 16 }}>Loading news...</div>
      ) : (
        <NewsList items={news} />
      )}
    </section>
  );
}
