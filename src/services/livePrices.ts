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
      else if (asset.id === 'silver') { change = 0.48; changePercent = 1.48; }
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
  const wsRef = useRef<WebSocket | null>(null);

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
    // Sanity check: Ensure gold and silver prices are not corrupted or halved
    if (assetId === 'gold' && (newPrice < 1500 || isNaN(newPrice))) {
      return;
    }
    if (assetId === 'silver' && (newPrice < 15 || newPrice > 150 || isNaN(newPrice))) {
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

  // Fetch initial REST prices for all assets (including PAXG Spot Gold)
  useEffect(() => {
    let isMounted = true;

    const fetchRestPrices = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","PAXGUSDT"]');
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data) && isMounted) {
          data.forEach((item: any) => {
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
      } catch (e) {
        console.warn('Initial REST price fetch skipped, using live defaults/WebSocket', e);
      }
    };

    fetchRestPrices();
    const restInterval = setInterval(fetchRestPrices, 15000);

    return () => {
      isMounted = false;
      clearInterval(restInterval);
    };
  }, [updatePrice]);

  // Connect to Binance WebSocket for live crypto & physical gold (PAXG) feeds
  useEffect(() => {
    let active = true;

    const connectWebSocket = () => {
      try {
        const streamNames = 'btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker/paxgusdt@ticker';
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamNames}`);
        wsRef.current = ws;

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
            console.error('Error parsing live price ticker', err);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnecting after delay
          if (active) {
            setTimeout(connectWebSocket, 4000);
          }
        };
      } catch (e) {
        console.warn('WebSocket connection error, running in synthetic mode', e);
      }
    };

    connectWebSocket();

    // Subtle micro-ticks for Silver and Bitcoin Dominance and fallback
    const interval = setInterval(() => {
      if (!active) return;

      // Silver tick (± 0.005 to 0.015)
      const silverDelta = (Math.random() - 0.49) * 0.012;
      setPrices((prev) => {
        const silver = prev['silver'];
        if (!silver) return prev;
        const newSilverPrice = Number((silver.price + silverDelta).toFixed(2));
        const dir = newSilverPrice >= silver.price ? 'up' : 'down';
        return {
          ...prev,
          silver: {
            ...silver,
            price: newSilverPrice,
            direction: dir,
            lastUpdated: Date.now(),
          },
        };
      });

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
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [updatePrice]);

  return { prices, isConnected };
}

