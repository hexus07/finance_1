import { Home, TrendingUp, DollarSign, Target, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: TrendingUp, label: 'Portfolio', path: '/portfolio' },
  { icon: DollarSign, label: 'Sandbox Trading', path: '/trading' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();  // Clear token and user state
    navigate('/login');  // Redirect to login
  };

  return (
    <div className="w-64 h-screen bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--glass-border)] flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">FinanceHub</h1>
            <p className="text-xs text-muted-foreground">Student Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : 'hover:bg-secondary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>  

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] flex items-center justify-center">
            <span className="text-sm font-semibold text-white">DC</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Daniil Chuhai</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all text-sm"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}