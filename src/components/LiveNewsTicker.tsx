import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types/news';
import { fetchLiveNews, formatNewsDate } from '../services/newsService';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  X,
  Clock,
  Radio,
  SlidersHorizontal,
  FileText,
  TrendingUp,
  Volume2,
} from 'lucide-react';

interface LiveNewsTickerProps {
  onSelectAssetCategory?: (category: string) => void;
}

export const LiveNewsTicker: React.FC<LiveNewsTickerProps> = ({ onSelectAssetCategory }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStory, setSelectedStory] = useState<NewsItem | null>(null);
  const [showAllNewsModal, setShowAllNewsModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'banner' | 'ticker'>('banner');

  // Load news on mount and refresh every 90 seconds
  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      const items = await fetchLiveNews();
      if (isMounted) {
        setNews(items);
        setIsLoading(false);
      }
    };

    loadNews();
    const interval = setInterval(loadNews, 90000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filtered news list based on category filter
  const displayedNews = React.useMemo(() => {
    if (filterCategory === 'all') return news;
    if (filterCategory === 'commodities') {
      return news.filter((n) => n.category === 'gold' || n.category === 'silver');
    }
    if (filterCategory === 'crypto') {
      return news.filter((n) => ['bitcoin', 'ethereum', 'solana', 'ripple', 'crypto'].includes(n.category));
    }
    return news.filter((n) => n.category === filterCategory);
  }, [news, filterCategory]);

  // Auto rotate news item every 8 seconds if in banner mode and not paused
  useEffect(() => {
    if (isPaused || displayedNews.length <= 1 || viewMode !== 'banner') return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayedNews.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isPaused, displayedNews.length, viewMode]);

  const currentItem = displayedNews[currentIndex] || displayedNews[0];

  const handleNext = () => {
    if (displayedNews.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % displayedNews.length);
    }
  };

  const handlePrev = () => {
    if (displayedNews.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + displayedNews.length) % displayedNews.length);
    }
  };

  // Get styling colors based on asset category
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'gold':
        return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
      case 'silver':
        return 'bg-[#94A3B8]/20 text-[#E2E8F0] border-[#94A3B8]/40';
      case 'bitcoin':
        return 'bg-[#F7931A]/20 text-[#F7931A] border-[#F7931A]/40';
      case 'ethereum':
        return 'bg-[#627EEA]/20 text-[#8B9FF7] border-[#627EEA]/40';
      case 'solana':
        return 'bg-[#14F195]/20 text-[#14F195] border-[#14F195]/40';
      case 'ripple':
        return 'bg-[#008CE7]/20 text-[#38BDF8] border-[#008CE7]/40';
      case 'macro':
        return 'bg-[#EAB308]/20 text-[#FACC15] border-[#EAB308]/40';
      default:
        return 'bg-[#2962FF]/20 text-[#60A5FA] border-[#2962FF]/40';
    }
  };

  if (isLoading || !currentItem) {
    return (
      <div className="bg-[#181B24] border-b border-[#2A2E39] px-4 py-2 text-xs text-[#787B86] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" />
          <span>Synchronizing live financial headlines & commodities news archive...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. FULL HEADER NEWS BAR (UNTRUNCATED COMPLETE HEADLINES) */}
      <div
        id="live-news-headline-bar"
        className="bg-[#151922] border-b border-[#2A2E39] px-3 sm:px-5 py-2 select-none relative z-20 transition-all hover:bg-[#181C26] shadow-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left section: Flash Badge + Asset Tag + COMPLETE UNTRUNCATED HEADLINE */}
          <div className="flex items-start md:items-center gap-2.5 flex-1 min-w-0">
            {/* Live Flashing News Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F23645]/15 border border-[#F23645]/40 text-[#F23645] font-black tracking-wider text-[11px] uppercase shrink-0 shadow-xs"
              title="Real-time breaking market headlines"
            >
              <Radio className="w-3.5 h-3.5 text-[#F23645] animate-pulse" />
              <span className="font-mono">LIVE FLASH</span>
            </div>

            {/* Asset / Category Tag */}
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border shrink-0 ${getCategoryBadgeStyle(
                currentItem.category
              )}`}
            >
              {currentItem.assetSymbol || currentItem.category}
            </span>

            {/* Complete Full Headline (Untruncated) */}
            <div
              onClick={() => setSelectedStory(currentItem)}
              className="cursor-pointer group flex-1"
              title="Click to view full story and market analysis"
            >
              <h2 className="text-xs sm:text-sm font-semibold text-[#F1F5F9] group-hover:text-[#2962FF] transition-colors leading-relaxed break-normal">
                {currentItem.title}
                <ExternalLink className="w-3 h-3 text-[#787B86] group-hover:text-[#2962FF] inline ml-1.5 align-middle" />
              </h2>
            </div>
          </div>

          {/* Right section: Exact Date & Time + Source + Action Controls */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 text-xs text-[#787B86] shrink-0 font-mono pt-1 md:pt-0 border-t md:border-t-0 border-[#2A2E39]/40">
            {/* Full Date & Timestamp */}
            <div
              className="flex items-center gap-1.5 text-[#94A3B8] bg-[#10131B] px-2.5 py-1 rounded border border-[#2A2E39]"
              title="Published Date and Time"
            >
              <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span className="text-[11px] font-medium text-[#D1D4DC]">
                {formatNewsDate(currentItem.publishedAt || currentItem.timestamp)}
              </span>
            </div>

            {/* News Source Badge */}
            <span
              className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#787B86] bg-[#1E222D] px-2 py-1 rounded border border-[#2A2E39] max-w-[140px] truncate"
              title={`Source: ${currentItem.source}`}
            >
              {currentItem.source}
            </span>

            {/* Progress Counter (e.g. 1 / 10) */}
            <span className="text-[11px] text-[#787B86] bg-[#1E222D] px-2 py-1 rounded border border-[#2A2E39]">
              {currentIndex + 1}/{displayedNews.length}
            </span>

            {/* Navigation Slider Controls */}
            <div className="flex items-center gap-0.5 bg-[#10131B] p-0.5 rounded border border-[#2A2E39]">
              <button
                id="btn-news-prev"
                onClick={handlePrev}
                className="p-1 hover:bg-[#2A2E39] hover:text-white rounded transition-colors"
                title="Previous Headline"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-news-pause"
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 hover:bg-[#2A2E39] hover:text-white rounded transition-colors"
                title={isPaused ? 'Resume Auto-Play' : 'Pause Auto-Play'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-[#089981]" /> : <Pause className="w-3.5 h-3.5 text-[#787B86]" />}
              </button>
              <button
                id="btn-news-next"
                onClick={handleNext}
                className="p-1 hover:bg-[#2A2E39] hover:text-white rounded transition-colors"
                title="Next Headline"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Open Full Archive / All Headlines Button */}
            <button
              id="btn-view-all-news"
              onClick={() => setShowAllNewsModal(true)}
              className="px-2.5 py-1 bg-[#2962FF]/15 hover:bg-[#2962FF]/30 border border-[#2962FF]/40 text-[#60A5FA] hover:text-white rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 shadow-xs"
              title="Open Complete Market News Archive & Headlines Matrix"
            >
              <FileText className="w-3 h-3" />
              <span>All News</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STORY DETAIL MODAL (FULL STORY & IMPACT ANALYSIS) */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            id="news-detail-modal"
            className="bg-[#1E222D] border border-[#2A2E39] rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[#D1D4DC] relative animate-in fade-in zoom-in duration-150"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#2A2E39] pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getCategoryBadgeStyle(
                    selectedStory.category
                  )}`}
                >
                  {selectedStory.assetSymbol || selectedStory.category}
                </span>
                <span className="text-xs text-[#94A3B8] flex items-center gap-1 font-mono bg-[#131722] px-2 py-0.5 rounded border border-[#2A2E39]">
                  <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                  {formatNewsDate(selectedStory.publishedAt || selectedStory.timestamp)}
                </span>
              </div>
              <button
                id="btn-close-story-modal"
                onClick={() => setSelectedStory(null)}
                className="p-1.5 rounded bg-[#131722] hover:bg-[#2A2E39] text-[#787B86] hover:text-white border border-[#2A2E39] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Complete Full Headline */}
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {selectedStory.title}
            </h2>

            {/* Source & Metadata */}
            <div className="flex items-center justify-between text-xs text-[#787B86] bg-[#131722] p-2.5 rounded-lg border border-[#2A2E39]">
              <span>Source: <strong className="text-[#D1D4DC]">{selectedStory.source}</strong></span>
              <span className="capitalize">
                Sentiment:{' '}
                <strong className={selectedStory.sentiment === 'bullish' ? 'text-[#089981]' : selectedStory.sentiment === 'bearish' ? 'text-[#F23645]' : 'text-[#EAB308]'}>
                  {selectedStory.sentiment || 'Neutral'}
                </strong>
              </span>
            </div>

            {/* Body / Summary */}
            <div className="text-sm leading-relaxed text-[#CBD5E1] space-y-3 bg-[#161922] p-4 rounded-lg border border-[#2A2E39]">
              <p>{selectedStory.summary}</p>
              <div className="pt-2.5 border-t border-[#2A2E39] text-xs text-[#787B86]">
                Target Asset Correlation:{' '}
                <strong className="text-[#D1D4DC]">
                  {selectedStory.category === 'gold' ? 'Spot Gold (XAU/USD), LBMA Bullion, GLD' : selectedStory.category === 'silver' ? 'Spot Silver (XAG/USD), Industrial Demand, SLV' : selectedStory.category === 'bitcoin' ? 'Bitcoin (BTC/USDT), Spot ETFs, Macro Liquidity' : selectedStory.category === 'ethereum' ? 'Ethereum (ETH/USDT), Layer-2 Rollups' : selectedStory.category === 'solana' ? 'Solana (SOL/USDT), High-Throughput L1' : selectedStory.category === 'ripple' ? 'XRP (XRP/USDT), Global Banking Liquidity' : 'Global Sovereign Debt & Commodity Markets'}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2.5 pt-2">
              {selectedStory.url && (
                <a
                  href={selectedStory.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#2962FF] hover:bg-[#1E50D8] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Read Full Article on Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setSelectedStory(null)}
                className="px-4 py-2 bg-[#131722] hover:bg-[#2A2E39] border border-[#2A2E39] text-[#D1D4DC] text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FULL NEWS ARCHIVE & HEADLINES MODAL */}
      {showAllNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs">
          <div
            id="all-news-archive-modal"
            className="bg-[#1E222D] border border-[#2A2E39] rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl text-[#D1D4DC] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#161922] border-b border-[#2A2E39] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-[#F23645]" />
                <div>
                  <h2 className="text-base font-bold text-white">Live & Historical Market News Matrix</h2>
                  <p className="text-xs text-[#787B86]">Real-time live feeds and dated historical market archives</p>
                </div>
              </div>
              <button
                id="btn-close-all-news"
                onClick={() => setShowAllNewsModal(false)}
                className="p-1.5 rounded bg-[#131722] hover:bg-[#2A2E39] text-[#787B86] hover:text-white border border-[#2A2E39] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="p-3 bg-[#10131B] border-b border-[#2A2E39] flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(['all', 'commodities', 'crypto', 'gold', 'silver', 'bitcoin', 'ethereum', 'solana', 'ripple'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full capitalize font-medium transition-colors shrink-0 ${
                    filterCategory === cat
                      ? 'bg-[#2962FF] text-white font-semibold shadow-sm'
                      : 'bg-[#1E222D] text-[#787B86] hover:text-white border border-[#2A2E39]'
                  }`}
                >
                  {cat === 'all' ? 'All Headlines' : cat}
                </button>
              ))}
            </div>

            {/* List of News Items with Complete Titles & Dates */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#2A2E39]/60 scrollbar-thin">
              {displayedNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedStory(item)}
                  className="pt-3.5 first:pt-0 cursor-pointer group hover:bg-[#151922] p-3.5 rounded-lg transition-colors border border-transparent hover:border-[#2A2E39]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getCategoryBadgeStyle(
                          item.category
                        )}`}
                      >
                        {item.assetSymbol || item.category}
                      </span>
                      <span className="text-xs text-[#787B86] font-medium">{item.source}</span>
                    </div>
                    {/* Timestamp & Date */}
                    <span className="text-[11px] font-mono text-[#94A3B8] bg-[#10131B] px-2.5 py-0.5 rounded border border-[#2A2E39] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#60A5FA]" />
                      {formatNewsDate(item.publishedAt || item.timestamp)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-[#2962FF] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1.5 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#161922] border-t border-[#2A2E39] flex items-center justify-between text-xs text-[#787B86]">
              <span>Showing {displayedNews.length} verified market stories</span>
              <button
                onClick={() => setShowAllNewsModal(false)}
                className="px-3.5 py-1.5 bg-[#131722] hover:bg-[#2A2E39] border border-[#2A2E39] text-[#D1D4DC] rounded text-xs transition-colors"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
