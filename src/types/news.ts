export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string; // ISO date or formatted string
  timestamp: number;
  category: 'gold' | 'silver' | 'crypto' | 'bitcoin' | 'ethereum' | 'solana' | 'ripple' | 'macro' | 'general';
  assetSymbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isBreaking?: boolean;
}
