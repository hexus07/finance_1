import { Euro, Calendar, Tag, FileText, Hash } from 'lucide-react';
import { useState } from "react";
import { api } from "../../services/api";

interface AddAssetModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const mockAssets = [
  "Apple (AAPL)",
  "Tesla (TSLA)",
  "Microsoft (MSFT)",
  "Bitcoin (BTC)",
  "Ethereum (ETH)",
  "S&P 500 ETF (SPY)",
];

export function AssetSearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [filtered, setFiltered] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  const handleChange = (val: string) => {
    onChange(val);
    setShow(true);

    if (val.trim()) {
      const results = mockAssets.filter((asset) =>
        asset.toLowerCase().includes(val.toLowerCase())
      );
      setFiltered(results);
    } else {
      setFiltered([]);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search asset (e.g. AAPL, Bitcoin)"
        className="w-full px-4 py-4 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:border-[#10b981]/50"
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-border/50 bg-background shadow-lg overflow-hidden">
          {filtered.map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => {
                onChange(asset);
                setShow(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition"
            >
              {asset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddAssetModal({ onClose, onSuccess }: AddAssetModalProps) {
  const [formData, setFormData] = useState({
    type: "",
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

  const handleAssetNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      assetName: value,
    }));
    setError("");
  };

  const extractSymbol = (assetName: string): string => {
    // Extract symbol from "Asset Name (SYMBOL)" format
    const match = assetName.match(/\(([^)]+)\)$/);
    return match ? match[1] : assetName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.type) {
      setError("Please select an asset type");
      return;
    }
    if (!formData.assetName) {
      setError("Please select or enter an asset name");
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
      const symbol = extractSymbol(formData.assetName);
      
      await api.createAsset({
        symbol: symbol,
        name: formData.assetName,
        type: formData.type,
        quantity: formData.quantity,
        purchase_price: formData.price,
        purchase_date: formData.date,
        notes: formData.notes,
      });

      // Success feedback
      setFormData({
        type: "",
        assetName: "",
        quantity: "",
        price: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      // Call parent callback if provided
      onSuccess?.();

      // Close modal after brief delay
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

      {/* Asset Name */}
      <div>
        <label htmlFor="assetName" className="block text-sm font-medium mb-2">
          Asset Name
        </label>
        <AssetSearchInput value={formData.assetName} onChange={handleAssetNameChange} />
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

      {/* Buy Price */}
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
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
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
          Notes
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional notes..."
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 transition-all resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#0ea574] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Adding..." : "Add Asset"}
        </button>
      </div>
    </form>
  );
}