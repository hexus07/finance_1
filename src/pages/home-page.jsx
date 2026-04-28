import { BalanceCard } from '../components/balance-card';
import { Modal } from '../components/actions/modal';
import { AddToSavingsModal } from '../components/actions/add-to-savings-modal';
import { AddTransactionModal } from '../components/actions/add-transaction-modal';
import { SetBudgetModal } from '../components/actions/set-budget-modal';
import { ViewReportsModal } from '../components/actions/view-reports-modal';
import {SetMonthlyBudgetModal} from '../components/actions/set-montly-budget-modal';
import { RecentTransactions } from '../components/recent-transactions';
import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/glass-card';
import { TrendingUp, TrendingDown, Wallet, Target, BookOpen, Award, Edit2, Plus, Minus } from 'lucide-react';
import { WithdrawSavingsModal } from '../components/actions/withdraw-savings-modal';




import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';



export function HomePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAddSavingsOpen, setIsAddSavingsOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isMonthlyBudgetModalOpen, setIsMonthlyBudgetModalOpen] = useState(false);
  const [isWithdrawSavingsOpen, setIsWithdrawSavingsOpen] = useState(false);

  const recentTransactionsRef = useRef(); // ADD THIS HERE
  const balanceCardRef = useRef();

  const savingsProgress = user?.savings_goal > 0    
  ? Math.round((user?.savings_balance / user?.savings_goal) * 100)
  : 0;

  const stats = [
    { label: 'Monthly Budget', value: user?.monthlyBudget || '0', change: '+3.1%', trend: 'up', icon: Wallet },
    { label: 'Savings Goal', value: user?.savingsGoal || '0', current_value: user?.savings_balance || '0', change: '+6%', trend: 'up', icon: Target },
    { label: 'Portfolio Value', value: '1,180€', change: '+1.2%', trend: 'up', icon: TrendingUp },
  ];



  useEffect(() => {
      loadData();
    }, []);

    const loadData = async () => {
      try {
        setLoading(true);
        const [txns, assetsData] = await Promise.all([
          api.getTransactions(),
          api.getAssets(),
        ]);
        setTransactions(txns);
        setAssets(assetsData);
        
        // Calculate portfolio value from assets
        const total = assetsData.reduce((sum, asset) => 
          sum + (asset.current_price * asset.quantity), 0
        );
        setPortfolioValue(total);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
  };
  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-muted-foreground">Here's your financial overview for today</p>
      </div>


      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6">
        {/* Monthly Budget Card */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#10b981]/20">
              <Wallet className="w-6 h-6 text-[#10b981]" />
            </div>
           
          </div>
          <p className="text-sm text-muted-foreground mb-3">Monthly Budget</p>
          <p className="text-2xl font-semibold mb-4">{user?.monthly_budget?.toFixed(2) || '0.00'}€</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
            <h3 className="text-lg font-semibold">Your monthly spending limit</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMonthlyBudgetModalOpen(true)}
                className="p-2 rounded-lg bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all"
                title="Set Budget"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Savings Goal Card */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#10b981]/20">
              <Target className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="flex items-center gap-1 text-sm text-[#10b981]">
              <TrendingUp className="w-4 h-4" />
              {savingsProgress}% of goal
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Savings Goal</p>
          <p className="text-2xl font-semibold mb-4">{user?.savings_balance || '0'}/{user?.savings_goal || '0'}€</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
            <h3 className="text-lg font-semibold">{user?.savings_goal_description}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="p-2 rounded-lg bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all"
                title="Edit Goal"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAddSavingsOpen(true)}
                className="p-2 rounded-lg bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all"
                title="Add to Savings"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsWithdrawSavingsOpen(true)}
                className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                title="Withdraw Savings"
              >
                <Minus className="w-4 h-4" />
            </button>
            </div>
          </div>
        </GlassCard>

        {/* Portfolio Value Card */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#10b981]/20">
              <TrendingUp className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="flex items-center gap-1 text-sm text-[#10b981]">
              <TrendingUp className="w-4 h-4" />
              +1.2%
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Portfolio Value</p>
          <p className="text-2xl font-semibold">{portfolioValue?.toFixed(2) || '0.00'}€</p>
        </GlassCard>
      </div>

         {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <BalanceCard ref={balanceCardRef} />
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="w-full p-4 rounded-xl bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all text-left font-medium"
              >
                Add Transaction
              </button>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="w-full p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all text-left"
              >
                Set Saving Goal
              </button>
              <button
                onClick={() => setIsReportsModalOpen(true)}
                className="w-full p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all text-left"
              >
                View Reports
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <RecentTransactions ref={recentTransactionsRef} />


        {/* Modals */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Add Transaction"
      >
        <AddTransactionModal 
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={() => {
            balanceCardRef.current?.refresh();
            recentTransactionsRef.current?.refresh();
          }}
        />
      </Modal>

      <Modal
        isOpen={isAddSavingsOpen}
        onClose={() => setIsAddSavingsOpen(false)}
        title="Add to Savings"
      >
        <AddToSavingsModal onClose={() => setIsAddSavingsOpen(false)} onSuccess={loadData} />
      </Modal>

      <Modal
        isOpen={isMonthlyBudgetModalOpen}
        onClose={() => setIsMonthlyBudgetModalOpen(false)}
        title="Set Monthly Budget"
      >
        <SetMonthlyBudgetModal onClose={() => setIsMonthlyBudgetModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Set Saving Goal"
      >
        <SetBudgetModal onClose={() => setIsBudgetModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        title="Financial Reports"
      >
        <ViewReportsModal onClose={() => setIsReportsModalOpen(false)} />
      </Modal>
      <Modal
        isOpen={isWithdrawSavingsOpen}
        onClose={() => setIsWithdrawSavingsOpen(false)}
        title="Withdraw from Savings"
      >
        <WithdrawSavingsModal 
          onClose={() => setIsWithdrawSavingsOpen(false)} 
          onSuccess={() => {
            balanceCardRef.current?.refresh();
            recentTransactionsRef.current?.refresh();
          }}
        />
      </Modal>
    </div>  
  );
}