import React from 'react';
import { AssetConfig, Currency, LayoutMode, LivePriceData, Timeframe } from '../types/market';
import { TRACKED_ASSETS } from '../data/assets';
import { TradingViewAdvancedChart } from './tradingview/TradingViewAdvancedChart';
import { formatPrice } from '../utils/marketData';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MultiChartGridProps {
  layoutMode: LayoutMode;
  timeframe: Timeframe;
  primaryAsset: AssetConfig;
  prices: Record<string, LivePriceData>;
  currency: Currency;
  onSelectAsset: (asset: AssetConfig) => void;
}

export const MultiChartGrid: React.FC<MultiChartGridProps> = ({
  layoutMode,
  timeframe,
  primaryAsset,
  prices,
  currency,
  onSelectAsset,
}) => {
  // For split mode: compare Primary asset with Gold (if primary is crypto) or BTC (if primary is commodity/metric)
  const secondaryAsset = primaryAsset.id === 'gold' 
    ? TRACKED_ASSETS.find((a) => a.id === 'bitcoin')! 
    : TRACKED_ASSETS.find((a) => a.id === 'gold')!;

  // For quad mode: 4 main anchors: Gold, Bitcoin, Ethereum, and Bitcoin Dominance
  const quadAssets = [
    primaryAsset,
    secondaryAsset,
    primaryAsset.id === 'ethereum' ? TRACKED_ASSETS.find((a) => a.id === 'solana')! : TRACKED_ASSETS.find((a) => a.id === 'ethereum')!,
    TRACKED_ASSETS.find((a) => a.id === 'btcd')!,
  ].slice(0, 4);

  if (layoutMode === 'split') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
        {[primaryAsset, secondaryAsset].map((asset, idx) => {
          const liveData = prices[asset.id];
          const price = liveData?.price || asset.basePrice;
          const change = liveData?.change24hPercent || 0;
          const isUp = change >= 0;

          return (
            <div key={asset.id} className="flex flex-col bg-[#1E222D] rounded-lg border border-[#2A2E39] overflow-hidden min-h-[500px]">
              <div className="p-3 bg-[#181B24] border-b border-[#2A2E39] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset.iconColor }} />
                  <span className="font-bold text-xs sm:text-sm text-[#D1D4DC]">
                    {idx === 0 ? 'Primary: ' : 'Comparison: '}
                    {asset.name} ({asset.symbol})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#F8FAFC]">
                    {formatPrice(price, asset.decimals, asset.unit, currency)}
                  </span>
                  <span className={`text-[11px] font-mono flex items-center ${isUp ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[440px]">
                <TradingViewAdvancedChart
                  tvSymbol={asset.tvSymbol}
                  assetName={asset.name}
                  timeframe={timeframe}
                  height="100%"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layoutMode === 'quad') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
        {quadAssets.map((asset) => {
          const liveData = prices[asset.id];
          const price = liveData?.price || asset.basePrice;
          const change = liveData?.change24hPercent || 0;
          const isUp = change >= 0;

          return (
            <div key={asset.id} className="flex flex-col bg-[#1E222D] rounded-lg border border-[#2A2E39] overflow-hidden min-h-[420px]">
              <div className="px-3 py-2 bg-[#181B24] border-b border-[#2A2E39] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset.iconColor }} />
                  <span className="font-bold text-[#D1D4DC]">{asset.symbol}</span>
                  <span className="text-[#787B86] text-[11px] hidden sm:inline">{asset.name}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-bold text-[#F8FAFC]">
                    {formatPrice(price, asset.decimals, asset.unit, currency)}
                  </span>
                  <span className={`text-[10px] ${isUp ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                    {isUp ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[360px]">
                <TradingViewAdvancedChart
                  tvSymbol={asset.tvSymbol}
                  assetName={asset.name}
                  timeframe={timeframe}
                  height="100%"
                  showToolbar={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
