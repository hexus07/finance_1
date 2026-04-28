import { Wallet, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SetMonthlyBudgetModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [amount, setAmount] = useState(user?.monthly_budget?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const value = parseFloat(amount);

      if (isNaN(value)) {
        setError('Please enter a valid number');
        setLoading(false);
        return;
      }

      if (value < 0) {
        setError('Budget cannot be negative');
        setLoading(false);
        return;
      }

      // Call API to update budget
      const response = await api.updateBudget(value);

      // Update user state
      if (user && setUser) {
        setUser({
          ...user,
          monthly_budget: value,
        });
      }

      setSuccess(`Monthly budget set to €${value.toFixed(2)}!`);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Budget Info */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
        <p className="text-sm text-muted-foreground mb-2">Current Budget</p>
        <p className="text-2xl font-semibold text-[#10b981]">
          €{user?.monthly_budget?.toFixed(2) || '0.00'}
        </p>
      </div>

      {/* Budget Input */}
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-2">
          New Monthly Budget
        </label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter budget amount"
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 text-lg disabled:opacity-50"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Wallet className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Set your monthly spending limit. This helps you track your expenses and stay within budget.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#ff8a80]/10 border border-[#ff8a80]/20 rounded-xl p-3">
          <p className="text-sm text-[#ff8a80]">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-3">
          <p className="text-sm text-[#10b981]">{success}</p>
        </div>
      )}

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
          className="flex-1 py-4 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#0ea574] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Set Budget'}
        </button>
      </div>
    </form>
  );
}