import { Target, Euro } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SetBudgetModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function SetBudgetModal({ onClose, onSuccess }: SetBudgetModalProps) {
  const { user, setUser } = useAuth();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(targetAmount);

      if (isNaN(amount)) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount < 0) {
        setError('Target amount cannot be negative');
        return;
      }

      // Call API to update savings goal
      const response = await api.updateSavingsGoal(amount, goalName);
      if (setUser) {
      setUser({
        ...user,
        savings_goal: amount,
        savings_goal_description: goalName
      });
      }
      
      
      setSuccess(`Goal "${goalName}" set to €${amount.toFixed(2)}!`);
      setTargetAmount('');
      setGoalName('');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to set goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Name */}
      <div>
        <label htmlFor="goalName" className="block text-sm font-medium mb-2">
          Goal Name
        </label>
        <div className="relative">
          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="goalName"
            name="goalName"
            type="text"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="e.g., Emergency Fund, New Laptop"
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Target Amount */}
      <div>
        <label htmlFor="targetAmount" className="block text-sm font-medium mb-2">
          Target Amount
        </label>
        <div className="relative">
          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="targetAmount"
            name="targetAmount"
            type="number"
            step="0.01"
            min="0"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground text-2xl font-bold placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
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

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all font-bold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 rounded-xl bg-[#10b981] text-white font-bold hover:bg-[#0ea574] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting...' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
}