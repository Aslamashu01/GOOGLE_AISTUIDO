import React, { useState } from 'react';
import { AssetConfig, AssetStatistics, Currency, LivePriceData } from '../types/market';
import { formatPrice } from '../utils/marketData';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  BarChart2,
  Copy,
  Check,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
} from 'lucide-react';

interface StatisticsPanelProps {
  asset: AssetConfig;
  liveData: LivePriceData;
  stats: AssetStatistics;
  currency: Currency;
  onOpenAlertModal?: () => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  asset,
  liveData,
  stats,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'periods' | 'technicals' | 'pivots'>('periods');
  const [copied, setCopied] = useState(false);

  const price = liveData?.price || asset.basePrice;
  const changePercent = liveData?.change24hPercent || 0;
  const isPositive = changePercent >= 0;

  // 52-week position calculation (0 to 100%)
  const yearRangeSpan = stats.yearHigh - stats.yearLow;
  const yearPositionPercent = yearRangeSpan > 0 
    ? Math.min(100, Math.max(0, ((price - stats.yearLow) / yearRangeSpan) * 100))
    : 50;

  // 24h range position
  const day24RangeSpan = liveData.high24h - liveData.low24h;
  const dayPositionPercent = day24RangeSpan > 0
    ? Math.min(100, Math.max(0, ((price - liveData.low24h) / day24RangeSpan) * 100))
    : 50;

  const handleCopyStats = () => {
    const text = `
=== ${asset.name} (${asset.symbol}) Historical & Live Statistics ===
Current Price: ${formatPrice(price, asset.decimals, asset.unit, currency)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)
--- AVERAGE PRICES ---
Today: ${formatPrice(stats.avgToday, asset.decimals, asset.unit, currency)}
Last 7 Days (1W): ${formatPrice(stats.avg7Days, asset.decimals, asset.unit, currency)}
Last 30 Days (1M): ${formatPrice(stats.avg30Days, asset.decimals, asset.unit, currency)}
--- HIGHEST PRICES ---
Current Month: ${formatPrice(stats.highCurrentMonth, asset.decimals, asset.unit, currency)}
Last Month: ${formatPrice(stats.highLastMonth, asset.decimals, asset.unit, currency)}
Last 3 Months: ${formatPrice(stats.highLast3Months, asset.decimals, asset.unit, currency)}
--- 24H STATS ---
24h High: ${formatPrice(liveData.high24h, asset.decimals, asset.unit, currency)}
24h Low: ${formatPrice(liveData.low24h, asset.decimals, asset.unit, currency)}
RSI (14): ${stats.rsi14}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="statistics-panel" className="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden flex flex-col h-full shadow-md">
      {/* Panel Top Header - Bento title style */}
      <div className="p-3.5 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#b2b5be] uppercase tracking-widest">
            MARKET STATISTICS
          </h3>
          <span className="text-[11px] text-[#787b86] font-mono">
            {asset.name} ({asset.displaySymbol})
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            id="btn-copy-stats"
            onClick={handleCopyStats}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#d1d4dc] transition-colors"
            title="Copy all statistical metrics"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#089981]" /> : <Copy className="w-3.5 h-3.5 text-[#787b86]" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Core Periods, Technical Levels, Pivot Points */}
      <div className="flex border-b border-[#2a2e39] bg-[#131722] px-2 text-xs">
        <button
          id="tab-periods"
          onClick={() => setActiveTab('periods')}
          className={`flex items-center space-x-1.5 py-2 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'periods'
              ? 'border-[#2962ff] text-white font-semibold'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Averages & Highs</span>
        </button>
        <button
          id="tab-technicals"
          onClick={() => setActiveTab('technicals')}
          className={`flex items-center space-x-1.5 py-2 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'technicals'
              ? 'border-[#2962ff] text-white font-semibold'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Technicals</span>
        </button>
        <button
          id="tab-pivots"
          onClick={() => setActiveTab('pivots')}
          className={`flex items-center space-x-1.5 py-2 px-3 font-medium transition-colors border-b-2 ${
            activeTab === 'pivots'
              ? 'border-[#2962ff] text-white font-semibold'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pivot Levels</span>
        </button>
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs scrollbar-thin">
        {activeTab === 'periods' && (
          <div className="space-y-4">
            {/* 1. REQUIRED: AVERAGE PRICES BENTO SECTION */}
            <div>
              <span className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider mb-2 block">
                AVERAGE PRICES
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div id="stat-avg-today" className="bg-[#131722] p-2.5 rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#b2b5be] block uppercase">Today</span>
                  <span className="text-sm font-bold text-white font-mono block mt-0.5">
                    {formatPrice(stats.avgToday, asset.decimals, asset.unit, currency)}
                  </span>
                  <span className="text-[9px] text-[#089981] font-mono mt-0.5 block">Intraday avg</span>
                </div>

                <div id="stat-avg-7d" className="bg-[#131722] p-2.5 rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#b2b5be] block uppercase">Last 7 Days</span>
                  <span className="text-sm font-bold text-white font-mono block mt-0.5">
                    {formatPrice(stats.avg7Days, asset.decimals, asset.unit, currency)}
                  </span>
                  <span className="text-[9px] text-[#787b86] font-mono mt-0.5 block">1W MA</span>
                </div>

                <div id="stat-avg-30d" className="bg-[#131722] p-2.5 rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#b2b5be] block uppercase">Last 30 Days</span>
                  <span className="text-sm font-bold text-white font-mono block mt-0.5">
                    {formatPrice(stats.avg30Days, asset.decimals, asset.unit, currency)}
                  </span>
                  <span className="text-[9px] text-[#787b86] font-mono mt-0.5 block">1M MA</span>
                </div>
              </div>
            </div>

            {/* 2. REQUIRED: HIGHEST PRICES BENTO LIST */}
            <div>
              <span className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider mb-1 block">
                CYCLE HIGHS
              </span>
              <div className="bg-[#131722] rounded border border-[#2a2e39] px-3 divide-y divide-[#2a2e39]">
                <div id="stat-high-current-month" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Current Month</span>
                  <span className="font-bold text-white font-mono">
                    {formatPrice(stats.highCurrentMonth, asset.decimals, asset.unit, currency)}
                  </span>
                </div>

                <div id="stat-high-last-month" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Last Month</span>
                  <span className="font-bold text-white font-mono">
                    {formatPrice(stats.highLastMonth, asset.decimals, asset.unit, currency)}
                  </span>
                </div>

                <div id="stat-high-3months" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Last 3 Months</span>
                  <span className="font-bold text-white font-mono">
                    {formatPrice(stats.highLast3Months, asset.decimals, asset.unit, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. CYCLE LOWS COMPLEMENTARY */}
            <div>
              <span className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider mb-1 block">
                CYCLE LOWS
              </span>
              <div className="bg-[#131722] rounded border border-[#2a2e39] px-3 divide-y divide-[#2a2e39]">
                <div id="stat-low-current-month" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Current Month Low</span>
                  <span className="font-bold text-[#f23645] font-mono">
                    {formatPrice(stats.lowCurrentMonth, asset.decimals, asset.unit, currency)}
                  </span>
                </div>

                <div id="stat-low-last-month" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Last Month Low</span>
                  <span className="font-bold text-white font-mono">
                    {formatPrice(stats.lowLastMonth, asset.decimals, asset.unit, currency)}
                  </span>
                </div>

                <div id="stat-low-3months" className="py-2 flex justify-between items-center text-xs">
                  <span className="text-[#b2b5be]">Last 3 Months Low</span>
                  <span className="font-bold text-white font-mono">
                    {formatPrice(stats.lowLast3Months, asset.decimals, asset.unit, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. 52-WEEK RANGE PROGRESS BAR */}
            <div className="p-3 bg-[#131722] rounded border border-[#2a2e39] space-y-1.5">
              <div className="flex justify-between items-center text-xs text-[#b2b5be]">
                <span>52-Week Range Position</span>
                <span className="text-white font-bold font-mono">{yearPositionPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#2a2e39] h-1.5 rounded-full overflow-hidden relative">
                <div
                  className="bg-[#2962ff] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${yearPositionPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#787b86] font-mono pt-1">
                <span>52W L: {formatPrice(stats.yearLow, asset.decimals, asset.unit, currency)}</span>
                <span>52W H: {formatPrice(stats.yearHigh, asset.decimals, asset.unit, currency)}</span>
              </div>
            </div>

            {/* General Overview Key-Values */}
            <div className="bg-[#131722] rounded border border-[#2a2e39] divide-y divide-[#2a2e39] text-xs">
              <div id="stat-ath-row" className="p-2.5 flex justify-between items-center">
                <div>
                  <span className="text-[#b2b5be] block font-medium">All-Time High (ATH)</span>
                  {stats.allTimeHighDate && (
                    <span className="text-[10px] text-[#94a3b8] font-mono block mt-0.5">
                      Last ATH Date: <strong className="text-[#e2e8f0] font-normal">{stats.allTimeHighDate}</strong>
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white block">
                    {formatPrice(stats.allTimeHigh, asset.decimals, asset.unit, currency)}
                  </span>
                  {stats.athDrawdownPercent !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        stats.athDrawdownPercent >= -0.5
                          ? 'text-[#089981]'
                          : stats.athDrawdownPercent >= -15
                          ? 'text-[#eab308]'
                          : 'text-[#f23645]'
                      }`}
                    >
                      {stats.athDrawdownPercent >= 0 ? 'At ATH Peak' : `${stats.athDrawdownPercent.toFixed(2)}% from ATH`}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2.5 flex justify-between items-center">
                <span className="text-[#b2b5be]">Market Cap / Notional</span>
                <span className="font-mono font-bold text-white">{stats.marketCapOrNotional}</span>
              </div>
              <div className="p-2.5 flex justify-between items-center">
                <span className="text-[#b2b5be]">30D Realized Volatility</span>
                <span className="font-mono font-bold text-white">{stats.volatility30d}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technicals' && (
          <div className="space-y-3">
            {/* RSI Meter Bento */}
            <div className="bg-[#131722] p-3 rounded border border-[#2a2e39]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#b2b5be] font-medium text-xs">RSI (14 Period)</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    stats.rsi14 > 70
                      ? 'bg-[#f23645]/20 text-[#f23645]'
                      : stats.rsi14 < 30
                      ? 'bg-[#089981]/20 text-[#089981]'
                      : 'bg-[#2962ff]/20 text-[#2962ff]'
                  }`}
                >
                  {stats.rsi14} ({stats.rsi14 > 70 ? 'Overbought' : stats.rsi14 < 30 ? 'Oversold' : 'Neutral'})
                </span>
              </div>
              <div className="w-full bg-[#2a2e39] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-[#2962ff] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, stats.rsi14))}%` }}
                />
              </div>
            </div>

            {/* Moving Averages Breakdown Bento */}
            <div className="bg-[#131722] rounded border border-[#2a2e39] p-3 space-y-2">
              <span className="text-[10px] font-bold text-[#b2b5be] uppercase tracking-wider block">
                MOVING AVERAGES & MOMENTUM
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="p-2 bg-[#1e222d] rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#787b86] block">EMA 20</span>
                  <span className="font-bold text-white text-xs block mt-0.5">{formatPrice(stats.ema20, asset.decimals, asset.unit, currency)}</span>
                  <span className={`text-[9px] mt-0.5 block ${price > stats.ema20 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {price > stats.ema20 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
                <div className="p-2 bg-[#1e222d] rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#787b86] block">SMA 50</span>
                  <span className="font-bold text-white text-xs block mt-0.5">{formatPrice(stats.sma50, asset.decimals, asset.unit, currency)}</span>
                  <span className={`text-[9px] mt-0.5 block ${price > stats.sma50 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {price > stats.sma50 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
                <div className="p-2 bg-[#1e222d] rounded border border-[#2a2e39]">
                  <span className="text-[9px] text-[#787b86] block">SMA 200</span>
                  <span className="font-bold text-white text-xs block mt-0.5">{formatPrice(stats.sma200, asset.decimals, asset.unit, currency)}</span>
                  <span className={`text-[9px] mt-0.5 block ${price > stats.sma200 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {price > stats.sma200 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
              </div>
            </div>

            {/* ATR Volatility */}
            <div className="bg-[#131722] p-3 rounded border border-[#2a2e39] flex justify-between items-center text-xs">
              <div>
                <span className="text-[#b2b5be] font-medium block">Average True Range (ATR 14)</span>
                <span className="text-[10px] text-[#787b86]">Daily expected volatility</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {formatPrice(stats.atr14, asset.decimals, asset.unit, currency)}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'pivots' && (
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-[#131722] rounded border border-[#2a2e39] text-[11px] text-[#787b86]">
              <Info className="w-3.5 h-3.5 inline mr-1 text-[#2962ff]" />
              Classic Floor Trader Pivot levels calculated from high/low/close bounds.
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] divide-y divide-[#2a2e39] text-xs">
              <div className="p-2 flex justify-between items-center text-[#f23645]">
                <span className="font-bold">Resistance 2 (R2)</span>
                <span className="font-semibold">{formatPrice(stats.pivotPoints.r2, asset.decimals, asset.unit, currency)}</span>
              </div>
              <div className="p-2 flex justify-between items-center text-[#f23645]/80">
                <span className="font-medium">Resistance 1 (R1)</span>
                <span className="font-semibold">{formatPrice(stats.pivotPoints.r1, asset.decimals, asset.unit, currency)}</span>
              </div>
              <div className="p-2.5 flex justify-between items-center bg-[#2962ff]/10 text-[#2962ff]">
                <span className="font-bold">Pivot Point (P)</span>
                <span className="font-bold text-sm">{formatPrice(stats.pivotPoints.pivot, asset.decimals, asset.unit, currency)}</span>
              </div>
              <div className="p-2 flex justify-between items-center text-[#089981]/80">
                <span className="font-medium">Support 1 (S1)</span>
                <span className="font-semibold">{formatPrice(stats.pivotPoints.s1, asset.decimals, asset.unit, currency)}</span>
              </div>
              <div className="p-2 flex justify-between items-center text-[#089981]">
                <span className="font-bold">Support 2 (S2)</span>
                <span className="font-semibold">{formatPrice(stats.pivotPoints.s2, asset.decimals, asset.unit, currency)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Bottom Footer */}
      <div className="px-3.5 py-2 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between text-[10px] text-[#787b86] font-mono">
        <span>TradingView Engine</span>
        <span>Realtime Feed Active</span>
      </div>
    </div>
  );
};

