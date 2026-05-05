import { Euro, Calendar, Tag, FileText, Hash, Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";

interface AddAssetModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const formatEuro = (value) => `${value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} €`;

export function AssetSearchInput({ 
  value, 
  onChange, 
  onSelectAsset,
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void;
  onSelectAsset: (data: any) => void;
  disabled: boolean;
}) {
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceTimer = useRef<any>(null);

  const handleSearch = async (val: string) => {
    onChange(val);
    setSearchError("");
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!val.trim() || val.length < 1) {
      setSearchResult(null);
      setShowResult(false);
      return;
    }

    // Debounce search - wait 500ms before searching
    debounceTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const result = await api.searchAsset(val);
        
        if (result.success) {
          setSearchResult(result);
          setShowResult(true);
        } else {
          setSearchError(result.message || "Asset not found");
          setSearchResult(null);
          setShowResult(true);
        }
      } catch (error) {
        setSearchError("Failed to search. Try again.");
        setSearchResult(null);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = () => {
    if (searchResult && searchResult.success) {
      // Pass data back to parent for auto-fill
      onSelectAsset(searchResult);
      setShowResult(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search symbol (e.g., AAPL, BTC, TSLA)..."
        disabled={disabled}
        className="w-full px-4 py-4 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:border-[#10b981]/50 disabled:opacity-50"
      />

      {searching && (
        <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10b981] animate-spin" />
      )}

      {showResult && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-border/50 bg-background shadow-lg overflow-hidden">
          {searchResult && searchResult.success ? (
            <button
              type="button"
              onClick={handleSelectResult}
              className="w-full text-left p-4 hover:bg-secondary/50 transition space-y-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{searchResult.symbol}</p>
                  <p className="text-sm text-muted-foreground capitalize">{searchResult.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatEuro(searchResult.price)}</p>
                  <div className={`flex items-center justify-end gap-1 text-sm ${
                    searchResult.change_24h >= 0 ? 'text-[#10b981]' : 'text-[#ff8a80]'
                  }`}>
                    {searchResult.change_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {searchResult.change_24h >= 0 ? '+' : ''}{searchResult.change_24h.toFixed(2)}%
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#10b981]">✨ Click to auto-fill</p>
            </button>
          ) : (
            <div className="p-4 text-sm text-red-400">
              {searchError || "No results found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AddAssetModal({ onClose, onSuccess }: AddAssetModalProps) {
  const [formData, setFormData] = useState({
    type: "",
    symbol: "",
    assetName: "",
    quantity: "",
    price: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSymbolChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      symbol: value,
    }));
    setError("");
  };

  // Auto-fill form when user selects a search result
  const handleSelectAsset = (searchResult: any) => {
    setFormData((prev) => ({
      ...prev,
      symbol: searchResult.symbol,
      assetName: searchResult.symbol, // Use symbol as name for now
      type: searchResult.type === "crypto" ? "crypto" : "stock",
      price: searchResult.price.toString(),
      // Keep other fields as they are
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.type) {
      setError("Please select an asset type");
      return;
    }
    if (!formData.symbol) {
      setError("Please search and select an asset");
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!formData.date) {
      setError("Please select a purchase date");
      return;
    }

    const purchaseDate = new Date(formData.date);
    if (purchaseDate > new Date()) {
      setError("Purchase date cannot be in the future");
      return;
    }

    setLoading(true);
    try {
      await api.createAsset({
        symbol: formData.symbol,
        name: formData.assetName || formData.symbol,
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.price),
        purchase_date: formData.date,
        notes: formData.notes,
      });

      // Reset form
      setFormData({
        type: "",
        symbol: "",
        assetName: "",
        quantity: "",
        price: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      onSuccess?.();
      setTimeout(onClose, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search Asset (Live with Autofill) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Search Asset
        </label>
        <AssetSearchInput 
          value={formData.symbol} 
          onChange={handleSymbolChange}
          onSelectAsset={handleSelectAsset}
          disabled={loading}
        />
        {formData.symbol && (
          <p className="text-xs text-[#10b981] mt-2">✨ Auto-filled from live data</p>
        )}
      </div>

      {/* Asset Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-2">
          Asset Type
        </label>
        <div className="relative">
          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground appearance-none focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          >
            <option value="">Select type</option>
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
            <option value="etf">ETF</option>
            <option value="commodity">Commodity</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium mb-2">
          Quantity
        </label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.0001"
            placeholder="0.00"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Price - Auto-filled from search */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-2">
          Price Bought At
        </label>
        <div className="relative">
          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-2">
          Purchase Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">
          Notes (Optional)
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
          <textarea
            id="notes"
            name="notes"
            placeholder="Add any notes..."
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50 resize-none h-20"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !formData.symbol}
        className="w-full py-4 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#10b981]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Adding Asset...
          </>
        ) : (
          "Add Asset"
        )}
      </button>
    </form>
  );
}