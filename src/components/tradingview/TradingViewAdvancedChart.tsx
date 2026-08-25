import React, { useEffect, useRef, useState } from 'react';
import { Timeframe } from '../../types/market';
import { Loader2, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface TradingViewAdvancedChartProps {
  tvSymbol: string;
  assetName: string;
  timeframe: Timeframe;
  chartStyle?: '1' | '2' | '3' | '9'; // 1 = Candles, 2 = Line, 3 = Area, 9 = Hollow Candles
  height?: string | number;
  showToolbar?: boolean;
}

export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  tvSymbol,
  assetName,
  timeframe,
  chartStyle = '1',
  height = '100%',
  showToolbar = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Map timeframe to TradingView interval and range
  const getIntervalAndRange = (tf: Timeframe) => {
    switch (tf) {
      case '1D':
        return { interval: '15', range: '1D' };
      case '1W':
        return { interval: '60', range: '1W' };
      case '1M':
        return { interval: 'D', range: '1M' };
      case '3M':
        return { interval: 'D', range: '3M' };
      case '1Y':
        return { interval: 'W', range: '12M' };
      case 'ALL':
        return { interval: 'M', range: 'ALL' };
      default:
        return { interval: 'D', range: '1M' };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    container.innerHTML = '';

    const { interval, range } = getIntervalAndRange(timeframe);

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const widgetConfig = {
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      range: range,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: chartStyle,
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_top_toolbar: !showToolbar,
      hide_side_toolbar: false,
      hide_legend: false,
      save_image: true,
      backgroundColor: '#131722',
      gridColor: 'rgba(42, 46, 57, 0.5)',
      studies: [
        'STD;SMA',
        'STD;EMA',
        'STD;RSI',
        'STD;Volume@tv-basicstudies',
      ],
      support_host: 'https://www.tradingview.com',
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    container.appendChild(script);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [tvSymbol, timeframe, chartStyle, showToolbar, reloadKey]);

  return (
    <div
      id={`tv-chart-wrapper-${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`}
      className={`relative w-full rounded-lg bg-[#1e222d] border border-[#2a2e39] overflow-hidden flex flex-col shadow-md ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Top Chart Header Banner - Bento Hero Style */}
      <div className="flex items-center justify-between p-3.5 bg-[#1e222d] border-b border-[#2a2e39] text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
              {assetName}
            </span>
            <span className="text-xs text-[#b2b5be] font-mono">
              {tvSymbol}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#787b86] font-mono bg-[#131722] px-2 py-0.5 rounded border border-[#2a2e39]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse" />
            LIVE CANDLES ({timeframe})
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            id={`btn-refresh-chart-${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`}
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors"
            title="Reload Chart Widget"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-fullscreen-chart-${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#131722]/80 backdrop-blur-xs text-[#787B86]">
          <Loader2 className="w-6 h-6 animate-spin text-[#2962FF] mb-2" />
          <span className="text-xs font-medium">Loading TradingView feed for {assetName}...</span>
        </div>
      )}

      {/* Embedded Chart Container */}
      <div
        id={`tv-advanced-chart-container-${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`}
        ref={containerRef}
        className="tradingview-widget-container flex-1 w-full h-full min-h-[380px]"
      />
    </div>
  );
};
