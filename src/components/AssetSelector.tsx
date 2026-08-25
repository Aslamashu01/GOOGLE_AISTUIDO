import React from 'react';
import { AssetConfig, Currency, LivePriceData } from '../types/market';
import { TRACKED_ASSETS } from '../data/assets';
import { formatPrice } from '../utils/marketData';
import { ArrowUpRight, ArrowDownRight, Layers, Coins } from 'lucide-react';

interface AssetSelectorProps {
  selectedAsset: AssetConfig;
  onSelectAsset: (asset: AssetConfig) => void;
  prices: Record<string, LivePriceData>;
  currency: Currency;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

// Deterministic mock sparkline patterns for bento cards
const SPARKLINE_BARS: Record<string, number[]> = {
  gold: [40, 45, 42, 50, 58, 65, 60, 70, 75, 82, 90, 85, 95],
  silver: [30, 35, 45, 40, 50, 48, 60, 55, 65, 70, 68, 75, 80],
  bitcoin: [50, 60, 55, 70, 65, 80, 75, 85, 90, 88, 92, 98, 100],
  ethereum: [65, 60, 58, 52, 55, 48, 50, 45, 42, 40, 38, 35, 30],
  solana: [30, 40, 35, 50, 60, 55, 70, 80, 75, 85, 90, 95, 92],
  ripple: [50, 48, 52, 50, 49, 53, 51, 52, 50, 48, 52, 51, 50],
  btcd: [70, 72, 71, 74, 75, 73, 76, 78, 80, 79, 82, 85, 88],
};

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onSelectAsset,
  prices,
  currency,
  activeFilter,
  onFilterChange,
}) => {
  const filteredAssets = TRACKED_ASSETS.filter((asset) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'commodities') return asset.type === 'commodity';
    if (activeFilter === 'crypto') return asset.type === 'crypto';
    if (activeFilter === 'metrics') return asset.type === 'metric';
    return true;
  });

  return (
    <div className="w-full shrink-0">
      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            id="filter-all"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#2962ff] text-white font-semibold shadow'
                : 'bg-[#1e222d] text-[#b2b5be] hover:text-white border border-[#2a2e39]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>All ({TRACKED_ASSETS.length})</span>
          </button>

          <button
            id="filter-commodities"
            onClick={() => onFilterChange('commodities')}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'commodities'
                ? 'bg-[#2962ff] text-white font-semibold shadow'
                : 'bg-[#1e222d] text-[#b2b5be] hover:text-white border border-[#2a2e39]'
            }`}
          >
            <Coins className="w-3 h-3 text-[#f59e0b]" />
            <span>Commodities</span>
          </button>

          <button
            id="filter-crypto"
            onClick={() => onFilterChange('crypto')}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'crypto'
                ? 'bg-[#2962ff] text-white font-semibold shadow'
                : 'bg-[#1e222d] text-[#b2b5be] hover:text-white border border-[#2a2e39]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a]" />
            <span>Cryptocurrencies</span>
          </button>

          <button
            id="filter-metrics"
            onClick={() => onFilterChange('metrics')}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'metrics'
                ? 'bg-[#2962ff] text-white font-semibold shadow'
                : 'bg-[#1e222d] text-[#b2b5be] hover:text-white border border-[#2a2e39]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
            <span>Dominance</span>
          </button>
        </div>

        <span className="text-[10px] text-[#787b86] font-mono hidden md:inline">
          LIVE FEED ACTIVE
        </span>
      </div>

      {/* Bento Grid Watchlist Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 p-3">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAsset.id === asset.id;
          const data = prices[asset.id];
          const currentPrice = data?.price || asset.basePrice;
          const changePercent = data?.change24hPercent || 0;
          const isUp = changePercent >= 0;
          const sparkBars = SPARKLINE_BARS[asset.id] || [40, 50, 60, 70, 65, 80, 75, 85];

          return (
            <div
              key={asset.id}
              id={`asset-card-${asset.id}`}
              onClick={() => onSelectAsset(asset)}
              className={`rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all duration-150 relative overflow-hidden ${
                isSelected
                  ? 'bg-[#232733] border-2 border-[#2962ff] shadow-md'
                  : 'bg-[#1e222d] border border-[#2a2e39] hover:border-[#363a45] hover:bg-[#202430]'
              }`}
            >
              {/* Top Row: Name + Change % */}
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: asset.iconColor }}
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    {asset.symbol}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-medium flex items-center ${
                    isUp ? 'text-[#089981]' : 'text-[#f23645]'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {isUp ? '+' : ''}
                  {changePercent.toFixed(2)}%
                </span>
              </div>

              {/* Price & Unit & ATH info */}
              <div className="my-1">
                <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
                  {formatPrice(currentPrice, asset.decimals, asset.unit, currency)}
                </span>
                <div className="flex justify-between items-start text-[10px] text-[#787b86] font-mono mt-0.5">
                  <span className="truncate max-w-[90px]">{asset.name}</span>
                  {asset.allTimeHigh && (
                    <div className="text-right shrink-0">
                      <span className="text-[#eab308] font-semibold block">
                        ATH {formatPrice(asset.allTimeHigh, asset.decimals, asset.unit, currency)}
                      </span>
                      {asset.athDate && (
                        <span className="text-[9px] text-[#94a3b8] block">
                          {asset.athDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Mini Bento Sparkline Histogram */}
              <div className="h-6 w-full flex items-end gap-1 mt-2 pt-1 border-t border-[#2a2e39]/50">
                {sparkBars.map((heightPercent, idx) => {
                  const isLatest = idx === sparkBars.length - 1;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-xs transition-all duration-300 ${
                        isUp
                          ? isLatest
                            ? 'bg-[#089981]'
                            : 'bg-[#089981]/30 hover:bg-[#089981]/60'
                          : isLatest
                            ? 'bg-[#f23645]'
                            : 'bg-[#f23645]/30 hover:bg-[#f23645]/60'
                      }`}
                      style={{ height: `${Math.max(15, heightPercent * 0.8)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

