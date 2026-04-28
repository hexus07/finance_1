import { 
  ShoppingBag, Home, Zap, TrendingUp, Film, BookOpen, 
  Utensils, Truck, DollarSign, Code, BarChart3, MoreHorizontal 
} from 'lucide-react';

const categoryIcons = {
  // Expense categories
  housing: Home,
  food: Utensils,
  transportation: Truck,
  shopping: ShoppingBag,
  utilities: Zap,
  entertainment: Film,
  education: BookOpen,
  other: MoreHorizontal,
  
  // Income categories
  salary: DollarSign,
  freelance: Code,
  investment: BarChart3,
  'other-income': MoreHorizontal,
};

export function TransactionItem({ transaction }) {
  const Icon = categoryIcons[transaction.category] || MoreHorizontal;
  const isIncome = transaction.type === 'sell';

  // Better date parsing
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 backdrop-blur-sm border border-border/50 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${isIncome ? 'bg-[#10b981]/20' : 'bg-[#ff8a80]/20'}`}>
          <Icon className={`w-5 h-5 ${isIncome ? 'text-[#10b981]' : 'text-[#ff8a80]'}`} />
        </div>
        <div>
          <p className="font-medium">{transaction.category}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isIncome ? 'text-[#10b981]' : 'text-[#ff8a80]'}`}>
          {isIncome ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)}€
        </p>
      </div>
    </div>
  );
}