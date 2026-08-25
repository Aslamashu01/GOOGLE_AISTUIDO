import React, { useEffect, useRef } from 'react';

interface TradingViewTechnicalAnalysisProps {
  tvSymbol: string;
  height?: number | string;
}

export const TradingViewTechnicalAnalysis: React.FC<TradingViewTechnicalAnalysisProps> = ({
  tvSymbol,
  height = 380,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: true,
      height: '100%',
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'en',
      colorTheme: 'dark',
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [tvSymbol]);

  return (
    <div className="w-full h-full rounded-lg bg-[#1e222d] border border-[#2a2e39] overflow-hidden flex flex-col shadow-md" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
      <div className="p-3.5 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#b2b5be] uppercase tracking-widest">
            TECHNICAL ANALYSIS & OSCILLATORS
          </h3>
          <span className="text-[11px] text-[#787b86] font-mono">{tvSymbol}</span>
        </div>
      </div>
      <div
        id={`tv-tech-analysis-${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`}
        ref={containerRef}
        className="tradingview-widget-container flex-1 w-full h-full p-2 bg-[#131722]"
      />
    </div>
  );
};
