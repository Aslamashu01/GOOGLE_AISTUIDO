import React, { useEffect, useRef } from 'react';

export const TradingViewTickerTape: React.FC<{ onSelectSymbol?: (symbol: string) => void }> = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous contents
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'OANDA:XAUUSD', title: 'Gold (XAU/USD)' },
        { proName: 'OANDA:XAGUSD', title: 'Silver (XAG/USD)' },
        { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin (BTC/USDT)' },
        { proName: 'BINANCE:ETHUSDT', title: 'Ethereum (ETH/USDT)' },
        { proName: 'BINANCE:SOLUSDT', title: 'Solana (SOL/USDT)' },
        { proName: 'BINANCE:XRPUSDT', title: 'Ripple (XRP/USDT)' },
        { proName: 'CRYPTOCAP:BTC.D', title: 'BTC Dominance' },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full bg-[#131722] border-b border-[#2A2E39] overflow-hidden">
      <div
        id="tradingview-ticker-tape-container"
        ref={containerRef}
        className="tradingview-widget-container h-[46px] w-full"
      />
    </div>
  );
};
