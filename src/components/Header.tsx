import React from 'react';
import { AssetConfig, Currency, LayoutMode, Timeframe } from '../types/market';
import { TRACKED_ASSETS } from '../data/assets';
import { formatPrice } from '../utils/marketData';
import {
  LayoutGrid,
  Columns,
  Square,
  Table as TableIcon,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface HeaderProps {
  selectedAsset: AssetConfig;
  onSelectAsset: (asset: AssetConfig) => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  isConnected: boolean;
  onOpenAlertModal: () => void;
  livePrices?: Record<string, { price: number; change24hPercent: number }>;
}

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export const Header: React.FC<HeaderProps> = ({
  selectedAsset,
  onSelectAsset,
  timeframe,
  onTimeframeChange,
  layoutMode,
  onLayoutModeChange,
  currency,
  onCurrencyChange,
  isConnected,
  onOpenAlertModal,
  livePrices = {},
}) => {
  // Quick tickers for header strip
  const btcData = livePrices['bitcoin'] || { price: 87420, change24hPercent: 1.65 };
  const ethData = livePrices['ethereum'] || { price: 2840.5, change24hPercent: -1.14 };
  const goldData = livePrices['gold'] || { price: 2894.5, change24hPercent: 0.63 };
  const silverData = livePrices['silver'] || { price: 32.85, change24hPercent: 1.48 };

  return (
    <header className="h-[48px] border-b border-[#2a2e39] flex items-center justify-between px-3 sm:px-4 bg-[#131722] shrink-0 text-[#d1d4dc] select-none z-30 sticky top-0">
      {/* Left side: Logo + Inline Ticker Strip */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectAsset(TRACKED_ASSETS[0])}>
          <div className="w-6 h-6 bg-[#2962ff] rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
            TV
          </div>
          <span className="font-bold text-white tracking-tight text-sm hidden sm:inline">FINANCE.IO</span>
        </div>

        {/* Inline Quick Price Ticker (Bento style) */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium border-l border-[#2a2e39] pl-4 font-mono">
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              const a = TRACKED_ASSETS.find((x) => x.id === 'bitcoin');
              if (a) onSelectAsset(a);
            }}
          >
            <span className="text-[#b2b5be]">BTCUSD</span>
            <span className={btcData.change24hPercent >= 0 ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {formatPrice(btcData.price, 2, '$', currency)}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              const a = TRACKED_ASSETS.find((x) => x.id === 'ethereum');
              if (a) onSelectAsset(a);
            }}
          >
            <span className="text-[#b2b5be]">ETHUSD</span>
            <span className={ethData.change24hPercent >= 0 ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {formatPrice(ethData.price, 2, '$', currency)}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              const a = TRACKED_ASSETS.find((x) => x.id === 'gold');
              if (a) onSelectAsset(a);
            }}
          >
            <span className="text-[#b2b5be]">XAUUSD</span>
            <span className={goldData.change24hPercent >= 0 ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {formatPrice(goldData.price, 2, '$', currency)}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              const a = TRACKED_ASSETS.find((x) => x.id === 'silver');
              if (a) onSelectAsset(a);
            }}
          >
            <span className="text-[#b2b5be]">XAGUSD</span>
            <span className={silverData.change24hPercent >= 0 ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {formatPrice(silverData.price, 2, '$', currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Center / Search Dropdown */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#787b86]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <select
            id="asset-dropdown-select"
            value={selectedAsset.id}
            onChange={(e) => {
              const found = TRACKED_ASSETS.find((a) => a.id === e.target.value);
              if (found) onSelectAsset(found);
            }}
            className="bg-[#1e222d] border border-[#2a2e39] text-[#d1d4dc] text-xs rounded pl-8 pr-6 py-1 focus:outline-none focus:border-[#2962ff] cursor-pointer appearance-none font-medium hover:bg-[#252936] transition-colors"
          >
            <optgroup label="Commodities">
              <option value="gold">Gold Spot (XAU/USD)</option>
              <option value="silver">Silver Spot (XAG/USD)</option>
            </optgroup>
            <optgroup label="Cryptocurrencies">
              <option value="bitcoin">Bitcoin (BTC/USDT)</option>
              <option value="ethereum">Ethereum (ETH/USDT)</option>
              <option value="solana">Solana (SOL/USDT)</option>
              <option value="ripple">XRP (XRP/USDT)</option>
            </optgroup>
            <optgroup label="Market Metrics">
              <option value="btcd">Bitcoin Dominance (BTC.D %)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Right side: Timeframes, Layout Switcher, Currency, Alerts & Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bento Timeframe Pill Container */}
        <div className="flex bg-[#2a2e39] rounded p-0.5">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                id={`btn-timeframe-${tf}`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 sm:px-3 py-1 text-[11px] rounded transition-all font-medium ${
                  isActive
                    ? 'bg-[#363a45] text-white font-semibold shadow'
                    : 'text-[#b2b5be] hover:text-white'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Layout Modes */}
        <div className="hidden lg:flex items-center bg-[#1e222d] p-0.5 rounded border border-[#2a2e39]">
          <button
            id="btn-layout-single"
            onClick={() => onLayoutModeChange('single')}
            className={`p-1 rounded transition-colors ${
              layoutMode === 'single' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Single Chart Bento View"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-layout-split"
            onClick={() => onLayoutModeChange('split')}
            className={`p-1 rounded transition-colors ${
              layoutMode === 'split' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Dual Split View"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-layout-quad"
            onClick={() => onLayoutModeChange('quad')}
            className={`p-1 rounded transition-colors ${
              layoutMode === 'quad' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Quad 4-Chart Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-layout-table"
            onClick={() => onLayoutModeChange('table')}
            className={`p-1 rounded transition-colors ${
              layoutMode === 'table' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Comparison Matrix Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="hidden sm:flex items-center bg-[#1e222d] p-0.5 rounded border border-[#2a2e39] text-[11px] font-mono">
          {(['USD', 'EUR', 'GBP'] as Currency[]).map((c) => (
            <button
              key={c}
              id={`btn-currency-${c}`}
              onClick={() => onCurrencyChange(c)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                currency === c ? 'bg-[#2a2e39] text-white font-bold' : 'text-[#787b86] hover:text-white'
              }`}
            >
              {c === 'USD' ? '$' : c === 'EUR' ? '€' : '£'}
            </button>
          ))}
        </div>

        {/* Price Alert Button */}
        <button
          id="btn-open-alerts"
          onClick={onOpenAlertModal}
          className="p-1.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#d1d4dc] rounded text-xs transition-colors"
          title="Price Alerts"
        >
          <Bell className="w-3.5 h-3.5 text-[#eab308]" />
        </button>

        {/* Bento Avatar */}
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-[#2a2e39] shrink-0"
          title="Live Pro Account"
        />
      </div>
    </header>
  );
};

