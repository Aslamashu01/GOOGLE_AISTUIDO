import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string;
  timestamp: number;
  category: 'gold' | 'silver' | 'crypto' | 'bitcoin' | 'ethereum' | 'solana' | 'ripple' | 'macro' | 'general';
  assetSymbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isBreaking?: boolean;
}

// In-memory cache for live news
let cachedNews: RawNewsItem[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase();
  const bullishWords = ['surge', 'soar', 'jump', 'rally', 'record', 'gain', 'inflow', 'bull', 'breakout', 'rise', 'tops', 'climb', 'accumulat'];
  const bearishWords = ['drop', 'fall', 'slump', 'crash', 'decline', 'loss', 'bear', 'plunge', 'outflow', 'dip', 'sink', 'lawsuit', 'hack', 'crackdown'];

  const bullScore = bullishWords.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
  const bearScore = bearishWords.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);

  if (bullScore > bearScore) return 'bullish';
  if (bearScore > bullScore) return 'bearish';
  return 'neutral';
}

function detectCategoryAndAsset(cleanedTitle: string, cleanedDesc: string): { category: RawNewsItem['category']; assetSymbol: string } {
  const text = `${cleanedTitle} ${cleanedDesc}`.toLowerCase();

  if (/\b(gold|bullion|xau|lbma)\b/i.test(text)) {
    return { category: 'gold', assetSymbol: 'XAU/USD' };
  }
  if (/\b(silver|xag)\b/i.test(text)) {
    return { category: 'silver', assetSymbol: 'XAG/USD' };
  }
  if (/\b(solana|sol)\b/i.test(text)) {
    return { category: 'solana', assetSymbol: 'SOL/USDT' };
  }
  if (/\b(xrp|ripple)\b/i.test(text)) {
    return { category: 'ripple', assetSymbol: 'XRP/USDT' };
  }
  if (/\b(ethereum|ether|eth)\b/i.test(text)) {
    return { category: 'ethereum', assetSymbol: 'ETH/USDT' };
  }
  if (/\b(bitcoin|btc|satoshi)\b/i.test(text)) {
    return { category: 'bitcoin', assetSymbol: 'BTC/USDT' };
  }
  if (/\b(fed|fomc|interest rate|inflation|treasury|powell|yield curve|macro)\b/i.test(text)) {
    return { category: 'macro', assetSymbol: 'MACRO' };
  }

  return { category: 'crypto', assetSymbol: 'MARKET' };
}

function parseRssXml(xml: string, defaultSource: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const block of itemMatches) {
    let title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '';
    let link = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1] || '';
    let pubDateStr = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i)?.[1] || '';
    let desc = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] || '';
    let sourceMatch = block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);
    let source = sourceMatch ? sourceMatch[1] : defaultSource;

    title = cleanText(title);
    desc = cleanText(desc);
    source = cleanText(source);

    // Google News formatting cleanup: "Headline text - Source Name"
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length > 1) {
        const potentialSource = parts[parts.length - 1];
        if (potentialSource && potentialSource.length < 35) {
          source = potentialSource.trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }
    }

    if (!title || title.length < 10) continue;

    const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();
    const validTimestamp = isNaN(timestamp) ? Date.now() : timestamp;
    const { category, assetSymbol } = detectCategoryAndAsset(title, desc);
    const sentiment = detectSentiment(title + ' ' + desc);
    const isBreaking = (Date.now() - validTimestamp) < (4 * 60 * 60 * 1000); // within last 4 hours

    const id = `rss-${Buffer.from(title.slice(0, 30)).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;

    items.push({
      id,
      title,
      summary: desc.length > 280 ? `${desc.slice(0, 277)}...` : (desc || title),
      source: source || defaultSource,
      url: link.trim(),
      publishedAt: new Date(validTimestamp).toISOString(),
      timestamp: validTimestamp,
      category,
      assetSymbol,
      sentiment,
      isBreaking,
    });
  }

  return items;
}

async function fetchFeed(url: string, defaultSource: string, timeoutMs = 4000): Promise<RawNewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const text = await res.text();
    return parseRssXml(text, defaultSource);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function getAggregatedNews(): Promise<RawNewsItem[]> {
  const now = Date.now();
  if (cachedNews.length > 0 && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedNews;
  }

  const feeds = [
    { url: 'https://news.google.com/rss/search?q=gold+price+today+OR+spot+gold+bullion&hl=en-US&gl=US&ceid=US:en', source: 'Gold Metals Wire' },
    { url: 'https://news.google.com/rss/search?q=silver+price+today+OR+spot+silver+market&hl=en-US&gl=US&ceid=US:en', source: 'Silver Metals Wire' },
    { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
    { url: 'https://decrypt.co/feed', source: 'Decrypt' },
    { url: 'https://news.google.com/rss/search?q=bitcoin+price+today+OR+crypto+market+analysis&hl=en-US&gl=US&ceid=US:en', source: 'Bitcoin & Crypto' },
    { url: 'https://news.google.com/rss/search?q=solana+price+today+OR+xrp+ripple+crypto&hl=en-US&gl=US&ceid=US:en', source: 'Altcoin Insights' },
    { url: 'https://news.google.com/rss/search?q=Federal+Reserve+interest+rates+inflation+macro+markets&hl=en-US&gl=US&ceid=US:en', source: 'Macro Markets' },
  ];

  try {
    const results = await Promise.allSettled(
      feeds.map((f) => fetchFeed(f.url, f.source))
    );

    const allItems: RawNewsItem[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        allItems.push(...r.value);
      }
    }

    if (allItems.length > 0) {
      // Deduplicate by title similarity
      const seenTitles = new Set<string>();
      const deduped: RawNewsItem[] = [];

      for (const item of allItems) {
        const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36);
        if (!seenTitles.has(normalized)) {
          seenTitles.add(normalized);
          deduped.push(item);
        }
      }

      // Sort by newest timestamp first
      deduped.sort((a, b) => b.timestamp - a.timestamp);
      cachedNews = deduped.slice(0, 60);
      lastFetchTime = now;
      return cachedNews;
    }
  } catch (err) {
    console.warn('Error fetching aggregated news feeds:', err);
  }

  return cachedNews;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Live Aggregated News API endpoint
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string || '').toLowerCase();
      let news = await getAggregatedNews();

      if (category && category !== 'all') {
        if (category === 'commodities') {
          news = news.filter((n) => n.category === 'gold' || n.category === 'silver');
        } else if (category === 'crypto') {
          news = news.filter((n) => ['bitcoin', 'ethereum', 'solana', 'ripple', 'crypto'].includes(n.category));
        } else {
          news = news.filter((n) => n.category === category);
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json({
        success: true,
        count: news.length,
        updated: lastFetchTime,
        items: news,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, items: [] });
    }
  });

  // 2. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // 3. Mount Vite Dev Server in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
