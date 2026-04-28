import { Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { api } from '../services/api';
import { calculateIncome, calculateExpenses } from './utils/calculations';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from './glass-card';

export const BalanceCard = forwardRef(function BalanceCard(props, ref) {
  const [showBalance, setShowBalance] = useState(true);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const { user } = useAuth();

  const loadTransactions = async () => {
    try {
      const txns = await api.getTransactions();
      setIncome(calculateIncome(txns));
      setExpenses(calculateExpenses(txns));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: loadTransactions
  }));

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <GlassCard className="p-10 relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-60 h-64 bg-[#10b981] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Main Balance</p>
            <div className="flex items-baseline gap-2">
              {showBalance ? (
                <h1 className="text-4xl tracking-tight">€{user.balance?.toFixed(2) || '0.00'}</h1>
              ) : (
                <h1 className="text-4xl tracking-tight">••••••</h1>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-colors"
          >
            {showBalance ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#10b981]/10 rounded-2xl p-4 border border-[#10b981]/20">
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-xl text-[#10b981]">+{income.toFixed(2)}€</p>
          </div>
          <div className="bg-[#ff8a80]/10 rounded-2xl p-4 border border-[#ff8a80]/20">
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-xl text-[#ff8a80]">-{expenses.toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
});