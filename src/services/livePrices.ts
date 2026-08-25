import { useState, useEffect, useRef, useCallback } from 'react';
import { TRACKED_ASSETS } from '../data/assets';
import { LivePriceData } from '../types/market';

export function useLiveMarketPrices() {
  const [prices, setPrices] = useState<Record<string, LivePriceData>>(() => {
    const initial: Record<string, LivePriceData> = {};
    TRACKED_ASSETS.forEach((asset) => {
      // Realistic default 24h changes
      let change = 0;
      let changePercent = 0;
      if (asset.id === 'gold') { change = 18.20; changePercent = 0.63; }
      else if (asset.id === 'silver') { change = 0.95; changePercent = 1.40; }
      else if (asset.id === 'bitcoin') { change = 1420.50; changePercent = 1.65; }
      else if (asset.id === 'ethereum') { change = -32.80; changePercent = -1.14; }
      else if (asset.id === 'solana') { change = 6.40; changePercent = 3.72; }
      else if (asset.id === 'ripple') { change = 0.084; changePercent = 3.65; }
      else if (asset.id === 'btcd') { change = 0.35; changePercent = 0.60; }

      const p = asset.basePrice;
      const range = p * 0.025;

      initial[asset.id] = {
        price: p,
        change24h: change,
        change24hPercent: changePercent,
        high24h: p + range * 0.6,
        low24h: p - range * 0.4,
        volume24h: asset.type === 'crypto' ? 18450000000 : 4200000000,
        lastUpdated: Date.now(),
        direction: 'neutral',
      };
    });
    return initial;
  });

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const spotWsRef = useRef<WebSocket | null>(null);
  const futuresWsRef = useRef<WebSocket | null>(null);

  // Update a single asset price
  const updatePrice = useCallback((
    assetId: string,
    newPrice: number,
    change24h?: number,
    changePercent?: number,
    high?: number,
    low?: number,
    volume?: number
  ) => {
    // Sanity check: Ensure gold and silver prices are within authentic market ranges
    if (assetId === 'gold' && (newPrice < 1500 || newPrice > 5000 || isNaN(newPrice))) {
      return;
    }
    if (assetId === 'silver' && (newPrice < 20 || newPrice > 250 || isNaN(newPrice))) {
      return;
    }

    setPrices((prev) => {
      const current = prev[assetId];
      if (!current) return prev;

      const direction = newPrice > current.price ? 'up' : newPrice < current.price ? 'down' : 'neutral';
      const c24 = change24h !== undefined ? change24h : current.change24h;
      const cp24 = changePercent !== undefined ? changePercent : current.change24hPercent;

      return {
        ...prev,
        [assetId]: {
          price: newPrice,
          change24h: c24,
          change24hPercent: cp24,
          high24h: high !== undefined ? high : Math.max(current.high24h, newPrice),
          low24h: low !== undefined ? low : Math.min(current.low24h, newPrice),
          volume24h: volume !== undefined ? volume : current.volume24h + (newPrice * 0.5),
          lastUpdated: Date.now(),
          direction,
        },
      };
    });
  }, []);

  // Fetch initial REST prices for all assets (including PAXG Spot Gold and XAGUSDT Silver)
  useEffect(() => {
    let isMounted = true;

    const fetchRestPrices = async () => {
      // 1. Fetch Spot Crypto & PAXG (Gold)
      try {
        const spotRes = await fetch(
          'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","PAXGUSDT"]'
        );
        if (spotRes.ok) {
          const spotData = await spotRes.json();
          if (Array.isArray(spotData) && isMounted) {
            spotData.forEach((item: any) => {
              const s = item.symbol;
              let assetId = '';
              if (s === 'PAXGUSDT') assetId = 'gold';
              else if (s === 'BTCUSDT') assetId = 'bitcoin';
              else if (s === 'ETHUSDT') assetId = 'ethereum';
              else if (s === 'SOLUSDT') assetId = 'solana';
              else if (s === 'XRPUSDT') assetId = 'ripple';

              if (assetId && item.lastPrice) {
                const currentPrice = parseFloat(item.lastPrice);
                const priceChange = parseFloat(item.priceChange);
                const priceChangePercent = parseFloat(item.priceChangePercent);
                const highPrice = parseFloat(item.highPrice);
                const lowPrice = parseFloat(item.lowPrice);
                const volume = parseFloat(item.quoteVolume || '0');

                updatePrice(assetId, currentPrice, priceChange, priceChangePercent, highPrice, lowPrice, volume);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Spot ticker REST fetch error', e);
      }

      // 2. Fetch Silver (XAGUSDT) from Binance Futures ticker
      try {
        const silverRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=XAGUSDT');
        if (silverRes.ok) {
          const silverItem = await silverRes.json();
          if (silverItem && silverItem.lastPrice && isMounted) {
            const currentPrice = parseFloat(silverItem.lastPrice);
            const priceChange = parseFloat(silverItem.priceChange);
            const priceChangePercent = parseFloat(silverItem.priceChangePercent);
            const highPrice = parseFloat(silverItem.highPrice);
            const lowPrice = parseFloat(silverItem.lowPrice);
            const volume = parseFloat(silverItem.quoteVolume || '0');

            updatePrice('silver', currentPrice, priceChange, priceChangePercent, highPrice, lowPrice, volume);
          }
        }
      } catch (e) {
        console.warn('Silver XAGUSDT REST fetch error', e);
      }
    };

    fetchRestPrices();
    const restInterval = setInterval(fetchRestPrices, 12000);

    return () => {
      isMounted = false;
      clearInterval(restInterval);
    };
  }, [updatePrice]);

  // Connect to Binance WebSockets for live Spot (BTC, ETH, SOL, XRP, Gold) & Futures (Silver XAGUSDT)
  useEffect(() => {
    let active = true;

    // A. Connect Spot WebSocket (Crypto + PAXG Gold)
    const connectSpotWebSocket = () => {
      try {
        const streamNames = 'btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker/paxgusdt@ticker';
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamNames}`);
        spotWsRef.current = ws;

        ws.onopen = () => {
          if (active) setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            const symbol = data.s; // e.g. BTCUSDT, PAXGUSDT
            let assetId = '';
            if (symbol === 'PAXGUSDT') assetId = 'gold';
            else if (symbol === 'BTCUSDT') assetId = 'bitcoin';
            else if (symbol === 'ETHUSDT') assetId = 'ethereum';
            else if (symbol === 'SOLUSDT') assetId = 'solana';
            else if (symbol === 'XRPUSDT') assetId = 'ripple';

            if (assetId && data.c) {
              const currentPrice = parseFloat(data.c);
              const priceChange = parseFloat(data.p);
              const priceChangePercent = parseFloat(data.P);
              const highPrice = parseFloat(data.h);
              const lowPrice = parseFloat(data.l);

              updatePrice(assetId, currentPrice, priceChange, priceChangePercent, highPrice, lowPrice);
            }
          } catch (err) {
            console.error('Error parsing live spot price ticker', err);
          }
        };

        ws.onerror = () => {
          // Fallback handled by REST polling
        };

        ws.onclose = () => {
          if (active) {
            setTimeout(connectSpotWebSocket, 4000);
          }
        };
      } catch (e) {
        console.warn('Spot WebSocket error', e);
      }
    };

    // B. Connect Futures WebSocket (Silver XAGUSDT)
    const connectFuturesWebSocket = () => {
      try {
        const ws = new WebSocket('wss://fstream.binance.com/ws/xagusdt@ticker');
        futuresWsRef.current = ws;

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            if (data.s === 'XAGUSDT' && data.c) {
              const currentPrice = parseFloat(data.c);
              const priceChange = parseFloat(data.p);
              const priceChangePercent = parseFloat(data.P);
              const highPrice = parseFloat(data.h);
              const lowPrice = parseFloat(data.l);

              updatePrice('silver', currentPrice, priceChange, priceChangePercent, highPrice, lowPrice);
            }
          } catch (err) {
            console.error('Error parsing live silver futures ticker', err);
          }
        };

        ws.onclose = () => {
          if (active) {
            setTimeout(connectFuturesWebSocket, 4000);
          }
        };
      } catch (e) {
        console.warn('Silver Futures WebSocket error', e);
      }
    };

    connectSpotWebSocket();
    connectFuturesWebSocket();

    // Subtle micro-ticks for Bitcoin Dominance and fallback live feel
    const interval = setInterval(() => {
      if (!active) return;

      // BTCD tick (± 0.01 to 0.03%)
      const btcdDelta = (Math.random() - 0.48) * 0.015;
      setPrices((prev) => {
        const btcd = prev['btcd'];
        if (!btcd) return prev;
        const newBtcdPrice = Number(Math.max(50, Math.min(68, btcd.price + btcdDelta)).toFixed(2));
        const dir = newBtcdPrice >= btcd.price ? 'up' : 'down';
        return {
          ...prev,
          btcd: {
            ...btcd,
            price: newBtcdPrice,
            direction: dir,
            lastUpdated: Date.now(),
          },
        };
      });
    }, 1800);

    return () => {
      active = false;
      clearInterval(interval);
      if (spotWsRef.current) {
        spotWsRef.current.close();
      }
      if (futuresWsRef.current) {
        futuresWsRef.current.close();
      }
    };
  }, [updatePrice]);

  return { prices, isConnected };
}
