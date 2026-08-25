export type AssetType = 'commodity' | 'crypto' | 'metric';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type LayoutMode = 'single' | 'split' | 'quad' | 'table';

export interface AssetConfig {
  id: string;
  name: string;
  symbol: string;
  displaySymbol: string;
  tvSymbol: string; // TradingView symbol e.g. "OANDA:XAUUSD", "BINANCE:BTCUSDT"
  type: AssetType;
  category: string;
  unit: string;
  decimals: number;
  iconColor: string;
  description: string;
  basePrice: number;
  allTimeHigh?: number;
  athDate?: string;
}

export interface LivePriceData {
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
  direction?: 'up' | 'down' | 'neutral';
}

export interface AssetStatistics {
  // Required core averages
  avgToday: number;
  avg7Days: number;
  avg30Days: number;

  // Required core highest prices
  highCurrentMonth: number;
  highLastMonth: number;
  highLast3Months: number;

  // Analytical lowest prices
  lowCurrentMonth: number;
  lowLastMonth: number;
  lowLast3Months: number;

  // Additional technical & financial metrics
  vwap: number;
  rsi14: number;
  atr14: number;
  volatility30d: number;
  ema20: number;
  sma50: number;
  sma200: number;
  pivotPoints: {
    r2: number;
    r1: number;
    pivot: number;
    s1: number;
    s2: number;
  };
  yearHigh: number;
  yearLow: number;
  allTimeHigh: number;
  allTimeHighDate?: string;
  athDrawdownPercent?: number;
  marketCapOrNotional?: string;
  dominancePercent?: number;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  active: boolean;
  triggered?: boolean;
}
