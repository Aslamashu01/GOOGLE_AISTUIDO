import React from 'react';
import { AssetConfig, Currency, LivePriceData } from '../types/market';
import { TRACKED_ASSETS } from '../data/assets';
import { calculateAssetStatistics, formatPrice } from '../utils/marketData';
import { ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';

interface AssetComparisonTableProps {
  prices: Record<string, LivePriceData>;
  currency: Currency;
  onSelectAsset: (asset: AssetConfig) => void;
}

export const AssetComparisonTable: React.FC<AssetComparisonTableProps> = ({
  prices,
  currency,
  onSelectAsset,
}) => {
  return (
    <div className="bg-[#1E222D] rounded-lg border border-[#2A2E39] overflow-hidden shadow-lg">
      <div className="p-4 bg-[#181B24] border-b border-[#2A2E39] flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
            Cross-Asset Historical Analytics & Average Matrix
          </h2>
          <p className="text-xs text-[#787B86] mt-0.5">
            Real-time comparison of average prices (Today, 7D, 30D) and historical peaks (Current Month, Last Month, 3M)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#151821] text-[#787B86] border-b border-[#2A2E39] text-[11px] uppercase tracking-wider font-sans">
              <th className="py-3 px-4 font-semibold">Asset / Symbol</th>
              <th className="py-3 px-3 font-semibold">Live Price</th>
              <th className="py-3 px-3 font-semibold">24h Change</th>
              <th className="py-3 px-3 font-semibold text-[#2962FF]">Avg Today</th>
              <th className="py-3 px-3 font-semibold text-[#2962FF]">Avg 7 Days</th>
              <th className="py-3 px-3 font-semibold text-[#2962FF]">Avg 30 Days</th>
              <th className="py-3 px-3 font-semibold text-[#089981]">High MTD</th>
              <th className="py-3 px-3 font-semibold text-[#089981]">High Last Mo</th>
              <th className="py-3 px-3 font-semibold text-[#089981]">High 3 Mos</th>
              <th className="py-3 px-3 font-semibold">RSI (14)</th>
              <th className="py-3 px-4 font-semibold text-right font-sans">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2E39]/70 text-[#D1D4DC]">
            {TRACKED_ASSETS.map((asset) => {
              const liveData = prices[asset.id];
              const price = liveData?.price || asset.basePrice;
              const changePercent = liveData?.change24hPercent || 0;
              const isUp = changePercent >= 0;
              const stats = calculateAssetStatistics(asset, price, changePercent);

              return (
                <tr
                  key={asset.id}
                  id={`table-row-${asset.id}`}
                  className="hover:bg-[#252936] transition-colors group cursor-pointer"
                  onClick={() => onSelectAsset(asset)}
                >
                  {/* Asset Name & Icon */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: asset.iconColor }}
                      />
                      <div>
                        <span className="font-bold text-[#F8FAFC] block">{asset.symbol}</span>
                        <span className="text-[11px] text-[#787B86] block">{asset.name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Live Price */}
                  <td className="py-3.5 px-3 font-bold text-[#F8FAFC]">
                    {formatPrice(price, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isUp ? 'text-[#089981] bg-[#089981]/15' : 'text-[#F23645] bg-[#F23645]/15'
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* Avg Today */}
                  <td className="py-3.5 px-3 text-[#D1D4DC]">
                    {formatPrice(stats.avgToday, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* Avg 7D */}
                  <td className="py-3.5 px-3 text-[#D1D4DC]">
                    {formatPrice(stats.avg7Days, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* Avg 30D */}
                  <td className="py-3.5 px-3 text-[#D1D4DC]">
                    {formatPrice(stats.avg30Days, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* High MTD */}
                  <td className="py-3.5 px-3 text-[#089981] font-semibold">
                    {formatPrice(stats.highCurrentMonth, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* High Last Mo */}
                  <td className="py-3.5 px-3 text-[#D1D4DC]">
                    {formatPrice(stats.highLastMonth, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* High 3 Mos */}
                  <td className="py-3.5 px-3 text-[#D1D4DC]">
                    {formatPrice(stats.highLast3Months, asset.decimals, asset.unit, currency)}
                  </td>

                  {/* RSI */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        stats.rsi14 > 70
                          ? 'bg-[#F23645]/20 text-[#F23645]'
                          : stats.rsi14 < 30
                          ? 'bg-[#089981]/20 text-[#089981]'
                          : 'bg-[#2A2E39] text-[#787B86]'
                      }`}
                    >
                      {stats.rsi14}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(asset);
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2A2E39] hover:bg-[#2962FF] text-[#D1D4DC] hover:text-white text-xs transition-colors"
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>Chart</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
