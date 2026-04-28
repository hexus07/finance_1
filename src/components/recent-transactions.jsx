import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { GlassCard } from './glass-card';
import { TransactionItem } from './transaction-item';
import { api } from '../services/api';

export const RecentTransactions = forwardRef(function RecentTransactions(props, ref) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(10);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions(100, 0);
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setTransactions(sortedData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: loadTransactions
  }));

  const handleViewAll = () => {
    setDisplayedCount(transactions.length);
  };

  const displayedTransactions = transactions.slice(0, displayedCount);

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg mb-1">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest activity</p>
        </div>
      
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        ) : displayedTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          displayedTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>
    </GlassCard>
  );
});