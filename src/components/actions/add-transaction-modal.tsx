import { useState } from 'react';
import { Euro, Calendar, Tag, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransactionModal({ onClose, onSuccess }: AddTransactionModalProps) {
  const { user, setUser } = useAuth();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const transactionAmount = parseFloat(amount);

      if (isNaN(transactionAmount)) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (transactionAmount <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      // Prepare transaction data
      const transactionData = {
        type: transactionType,
        amount: transactionAmount,
        category,
        notes: description,
        date: new Date(date).toISOString(),
      };

      // Call API to create transaction
      const response = await api.createTransaction(transactionData);
      response.onSuccess?.(); // This will refresh the list
      onClose();

      if (user && setUser) {
        setUser({
          ...user,
          balance: response.new_balance,
        });
      }

      // Update balance based on transaction type
      if (user && setUser) {
        const newBalance = transactionType === 'income' 
          ? user.balance + transactionAmount 
          : user.balance - transactionAmount;

        setUser({
          ...user,
          balance: newBalance,
        });
      }

      setSuccess(`Transaction added successfully!`);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Type Toggle */}
      <div>
        <label className="block text-sm font-medium mb-3">Transaction Type</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTransactionType('income')}
            className={`py-4 rounded-xl border-2 font-bold transition-all ${
              transactionType === 'income'
                ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('expense')}
            className={`py-4 rounded-xl border-2 font-bold transition-all ${
              transactionType === 'expense'
                ? 'bg-[#ff8a80]/20 border-[#ff8a80] text-[#ff8a80]'
                : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-2">
          Amount
        </label>
        <div className="relative">
          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground text-2xl font-bold placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Category
        </label>
        <div className="relative">
          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground appearance-none focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
          >
            <option value="">Select a category</option>
            {transactionType === 'income' ? (
              <>
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="investment">Investment</option>
                <option value="other-income">Other Income</option>
              </>
            ) : (
              <>
                <option value="housing">Housing</option>
                <option value="food">Food & Dining</option>
                <option value="transportation">Transportation</option>
                <option value="shopping">Shopping</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
          <textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note (optional)"
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#10b981]/50 transition-all resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-2">
          Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-[#10b981]/50 transition-all disabled:opacity-50"
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
          className={`flex-1 py-4 rounded-xl font-bold transition-all ${
            transactionType === 'income'
              ? 'bg-[#10b981]/20 border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981]/30 disabled:opacity-50'
              : 'bg-[#ff8a80]/20 border-2 border-[#ff8a80] text-[#ff8a80] hover:bg-[#ff8a80]/30 disabled:opacity-50'
          }`}
        >
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}