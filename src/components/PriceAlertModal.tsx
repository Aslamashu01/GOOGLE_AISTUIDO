import React, { useState } from 'react';
import { AssetConfig, Currency, LivePriceData, PriceAlert } from '../types/market';
import { TRACKED_ASSETS } from '../data/assets';
import { formatPrice } from '../utils/marketData';
import { X, Bell, Trash2, Plus, AlertCircle } from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: AssetConfig;
  prices: Record<string, LivePriceData>;
  currency: Currency;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  prices,
  currency,
}) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      assetId: 'gold',
      targetPrice: 3000.00,
      condition: 'above',
      createdAt: Date.now() - 3600000,
      active: true,
    },
    {
      id: '2',
      assetId: 'bitcoin',
      targetPrice: 90000.00,
      condition: 'above',
      createdAt: Date.now() - 7200000,
      active: true,
    },
  ]);

  const [assetId, setAssetId] = useState(selectedAsset.id);
  const [targetPrice, setTargetPrice] = useState(
    (prices[selectedAsset.id]?.price || selectedAsset.basePrice * 1.03).toFixed(2)
  );
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  if (!isOpen) return null;

  const currentAssetObj = TRACKED_ASSETS.find((a) => a.id === assetId) || selectedAsset;
  const currentPrice = prices[assetId]?.price || currentAssetObj.basePrice;

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);
    if (isNaN(numPrice) || numPrice <= 0) return;

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      assetId,
      targetPrice: numPrice,
      condition,
      createdAt: Date.now(),
      active: true,
    };

    setAlerts([newAlert, ...alerts]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#181B24] border-b border-[#2A2E39] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#EAB308]" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Price Alert Manager</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E39] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Create Alert Form */}
          <form onSubmit={handleAddAlert} className="space-y-3 bg-[#171A23] p-3.5 rounded-lg border border-[#2A2E39]">
            <span className="font-bold text-[#D1D4DC] block text-[11px] uppercase tracking-wider">
              Create New Trigger
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#787B86] mb-1">Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setAssetId(newId);
                    const a = TRACKED_ASSETS.find((x) => x.id === newId);
                    if (a) {
                      setTargetPrice((prices[newId]?.price || a.basePrice).toFixed(a.decimals));
                    }
                  }}
                  className="w-full bg-[#1E222D] border border-[#2A2E39] rounded px-2.5 py-1.5 text-[#D1D4DC] focus:outline-none focus:border-[#2962FF]"
                >
                  {TRACKED_ASSETS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#787B86] mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                  className="w-full bg-[#1E222D] border border-[#2A2E39] rounded px-2.5 py-1.5 text-[#D1D4DC] focus:outline-none focus:border-[#2962FF]"
                >
                  <option value="above">Price Rises Above (≥)</option>
                  <option value="below">Price Drops Below (≤)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#787B86] mb-1">
                <span>Target Price</span>
                <span>Current: <strong className="text-[#D1D4DC]">{formatPrice(currentPrice, currentAssetObj.decimals, currentAssetObj.unit, currency)}</strong></span>
              </div>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#1E222D] border border-[#2A2E39] rounded px-2.5 py-1.5 text-[#F8FAFC] font-mono focus:outline-none focus:border-[#2962FF]"
                placeholder="Enter target price..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#2962FF] hover:bg-[#1E53E5] text-white font-semibold rounded transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set Alert Trigger</span>
            </button>
          </form>

          {/* Active Alerts List */}
          <div>
            <span className="font-bold text-[#787B86] block text-[11px] uppercase tracking-wider mb-2">
              Active Alerts ({alerts.length})
            </span>
            {alerts.length === 0 ? (
              <div className="text-center py-4 text-[#787B86] bg-[#171A23] rounded border border-[#2A2E39]">
                No active price alerts.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((al) => {
                  const ast = TRACKED_ASSETS.find((x) => x.id === al.assetId);
                  if (!ast) return null;
                  const live = prices[ast.id]?.price || ast.basePrice;
                  const isTriggered = al.condition === 'above' ? live >= al.targetPrice : live <= al.targetPrice;

                  return (
                    <div
                      key={al.id}
                      className={`p-2.5 rounded border flex items-center justify-between ${
                        isTriggered
                          ? 'bg-[#089981]/15 border-[#089981]/40 text-[#089981]'
                          : 'bg-[#171A23] border-[#2A2E39] text-[#D1D4DC]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ast.iconColor }} />
                        <div>
                          <span className="font-bold">{ast.symbol}</span>
                          <span className="text-[#787B86] ml-1.5">
                            {al.condition === 'above' ? '≥' : '≤'}{' '}
                            <strong className="font-mono text-[#F8FAFC]">
                              {formatPrice(al.targetPrice, ast.decimals, ast.unit, currency)}
                            </strong>
                          </span>
                          {isTriggered && (
                            <span className="ml-2 text-[10px] px-1 py-0.5 bg-[#089981]/20 text-[#089981] font-bold rounded">
                              TRIGGERED
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(al.id)}
                        className="text-[#787B86] hover:text-[#F23645] p-1 transition-colors"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#181B24] border-t border-[#2A2E39] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2A2E39] hover:bg-[#363A45] text-[#D1D4DC] rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
