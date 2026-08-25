import React, { useState } from 'react';
import { AssetConfig, Currency, LayoutMode, Timeframe } from './types/market';
import { TRACKED_ASSETS, DEFAULT_ASSET } from './data/assets';
import { useLiveMarketPrices } from './services/livePrices';
import { calculateAssetStatistics } from './utils/marketData';
import { TradingViewTickerTape } from './components/tradingview/TradingViewTickerTape';
import { LiveNewsTicker } from './components/LiveNewsTicker';
import { Header } from './components/Header';
import { AssetSelector } from './components/AssetSelector';
import { TradingViewAdvancedChart } from './components/tradingview/TradingViewAdvancedChart';
import { StatisticsPanel } from './components/StatisticsPanel';
import { TradingViewTechnicalAnalysis } from './components/tradingview/TradingViewTechnicalAnalysis';
import { MultiChartGrid } from './components/MultiChartGrid';
import { AssetComparisonTable } from './components/AssetComparisonTable';
import { PriceAlertModal } from './components/PriceAlertModal';

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(DEFAULT_ASSET);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Live real-time market data hook
  const { prices, isConnected } = useLiveMarketPrices();

  const currentLiveData = prices[selectedAsset.id] || {
    price: selectedAsset.basePrice,
    change24h: 0,
    change24hPercent: 0,
    high24h: selectedAsset.basePrice * 1.02,
    low24h: selectedAsset.basePrice * 0.98,
    volume24h: 1000000,
    lastUpdated: Date.now(),
  };

  const assetStatistics = calculateAssetStatistics(
    selectedAsset,
    currentLiveData.price,
    currentLiveData.change24hPercent
  );

  return (
    <div className="min-h-screen bg-[#131722] text-[#D1D4DC] flex flex-col font-sans selection:bg-[#2962FF]/30">
      {/* 1. TOP TICKER TAPE (TRADINGVIEW EMBEDDED WIDGET) */}
      <TradingViewTickerTape />

      {/* 2. LIVE FLASHING NEWS BAR ON TOP */}
      <LiveNewsTicker
        onSelectAssetCategory={(cat) => {
          const matched = TRACKED_ASSETS.find(
            (a) => a.id === cat || (cat === 'gold' && a.id === 'gold') || (cat === 'silver' && a.id === 'silver')
          );
          if (matched) setSelectedAsset(matched);
        }}
      />

      {/* 3. TOP NAVIGATION HEADER */}
      <Header
        selectedAsset={selectedAsset}
        onSelectAsset={setSelectedAsset}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        currency={currency}
        onCurrencyChange={setCurrency}
        isConnected={isConnected}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        livePrices={prices}
      />

      {/* 3. ASSET SELECTOR & WATCHLIST STRIP */}
      <AssetSelector
        selectedAsset={selectedAsset}
        onSelectAsset={(asset) => {
          setSelectedAsset(asset);
          if (layoutMode === 'table') setLayoutMode('single');
        }}
        prices={prices}
        currency={currency}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* 4. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 space-y-4">
        {layoutMode === 'single' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Main Interactive TradingView Advanced Chart */}
            <div className="xl:col-span-8 flex flex-col space-y-4">
              <div className="h-[520px] sm:h-[580px] lg:h-[640px] w-full">
                <TradingViewAdvancedChart
                  tvSymbol={selectedAsset.tvSymbol}
                  assetName={selectedAsset.name}
                  timeframe={timeframe}
                  height="100%"
                />
              </div>

              {/* Technical Analysis Gauge Widget for Selected Asset */}
              <div className="w-full h-[400px]">
                <TradingViewTechnicalAnalysis
                  tvSymbol={selectedAsset.tvSymbol}
                  height={400}
                />
              </div>
            </div>

            {/* Dedicated Statistics Panel (Average & Highest Prices) */}
            <div className="xl:col-span-4 flex flex-col">
              <StatisticsPanel
                asset={selectedAsset}
                liveData={currentLiveData}
                stats={assetStatistics}
                currency={currency}
                onOpenAlertModal={() => setIsAlertModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Multi-Chart Split / Quad Grid Layouts */}
        {(layoutMode === 'split' || layoutMode === 'quad') && (
          <div className="w-full min-h-[750px]">
            <MultiChartGrid
              layoutMode={layoutMode}
              timeframe={timeframe}
              primaryAsset={selectedAsset}
              prices={prices}
              currency={currency}
              onSelectAsset={setSelectedAsset}
            />
          </div>
        )}

        {/* Full Historical Analytics Comparison Table */}
        {layoutMode === 'table' && (
          <div className="w-full">
            <AssetComparisonTable
              prices={prices}
              currency={currency}
              onSelectAsset={(asset) => {
                setSelectedAsset(asset);
                setLayoutMode('single');
              }}
            />
          </div>
        )}
      </main>

      {/* 5. FOOTER STATUS BAR */}
      <footer className="bg-[#181B24] border-t border-[#2A2E39] px-4 py-2 text-xs text-[#787B86] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#089981]" />
            Market Data: Active
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">OANDA & Binance Feeds</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">TradingView Widget Engine v2.0</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span>Tracked Assets: <strong>Gold, Silver, BTC, ETH, SOL, XRP, BTC.D</strong></span>
          <button
            onClick={() => setLayoutMode(layoutMode === 'table' ? 'single' : 'table')}
            className="text-[#2962FF] hover:underline"
          >
            {layoutMode === 'table' ? 'Back to Chart' : 'View Comparison Matrix'}
          </button>
        </div>
      </footer>

      {/* 6. PRICE ALERTS MODAL */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        selectedAsset={selectedAsset}
        prices={prices}
        currency={currency}
      />
    </div>
  );
}
