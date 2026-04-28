import { PiggyBank, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function WithdrawSavingsModal({ onClose, onSuccess }) {
  const { user, setUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const savingsProgress = user?.savings_goal > 0    
    ? Math.round((user?.savings_balance / user?.savings_goal) * 100)
    : 0;

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

      if (value <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      if (value > user.savings_balance) {
        setError(`Insufficient savings (available: €${user.savings_balance.toFixed(2)})`);
        setLoading(false);
        return;
      }

      // Withdraw from savings API call (you'll need to add this to backend)
      const response = await api.withdrawFromSavings(value);
      

      
      // Update user state
      if (user && setUser) {
        setUser({
          ...user,
          balance: response.balance,
          savings_balance: response.savings_balance,
        });
      }
      
      setSuccess(`€${value.toFixed(2)} withdrawn from savings!`);
      setAmount('');
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to withdraw from savings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-muted-foreground">Savings Progress</p>
          <p className="text-sm font-semibold text-[#10b981]">{savingsProgress}%</p>
        </div>
        <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#10b981] to-[#059669] h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(savingsProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          €{user?.savings_balance?.toFixed(2) || '0.00'} / €{user?.savings_goal?.toFixed(2) || '0.00'}
        </p>
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-2">
          Amount to Withdraw
        </label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 text-lg disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Available in savings: €{user?.savings_balance?.toFixed(2) || '0.00'}
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4">
        <div className="flex gap-3">
          <PiggyBank className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Withdraw money from your savings back to your main balance.
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
          {loading ? 'Withdrawing...' : 'Withdraw'}
        </button>
      </div>
    </form>
  );
}