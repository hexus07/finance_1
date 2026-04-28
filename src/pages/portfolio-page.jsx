import { GlassCard } from '../components/glass-card';
import { Sparkline } from '../components/sparkline';
import { TrendingUp, TrendingDown, RefreshCw, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SiApple, SiGoogle, SiTesla } from 'react-icons/si';
import { TiVendorMicrosoft } from 'react-icons/ti';
import { useRef, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/actions/modal';
import { AddAssetModal } from '../components/actions/add-asset-modal';

const formatEuro = (value) => `${value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} €`;

const videos = [
  { id: "rGSmG7qp2Eg", title: "How to Build a Portfolio" },
  { id: "bBC-nXj3Ng4", title: "Bitcoin Basics" },
  { id: "Tv4pkivGvdU", title: "ETF Investing Basics" },
  { id: "gFQNPmLKj1k", title: "Investing for Beginners" },
  { id: "WEDIj9JBTC8", title: "ETF Investing Basics" },
];

function VideoPanel() {
  const sliderRef = useRef(null);

  const scrollVideos = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.scrollBy({
      left: direction * (slider.clientWidth * 0.55),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-secondary/30 via-secondary/10 to-transparent overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#10b981]/15 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Learn Investing 🎓</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 rounded-full px-2 py-1">Swipe for more</span>
          <button
            type="button"
            onClick={() => scrollVideos(-1)}
            className="h-8 w-8 rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-[#10b981]/50 transition"
            aria-label="Scroll videos left"
          >
            <ChevronLeft className="mx-auto h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollVideos(1)}
            className="h-8 w-8 rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-[#10b981]/50 transition"
            aria-label="Scroll videos right"
          >
            <ChevronRight className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={sliderRef} className="relative z-10 mt-4 flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#10b981]/40">
        {videos.map((video, index) => (
          <div key={`${video.id}-${index}`} className="group space-y-2 shrink-0 basis-[calc(50%-0.375rem)] max-w-[200px] snap-start">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-[#10b981]/50 transition">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                title={video.title}
                loading="lazy"
                allowFullScreen
              />
              <div className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm">
                <Play className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-snug group-hover:text-foreground transition-colors">
              {video.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const stockLogos = {
  AAPL: { Icon: SiApple, color: '#f5f5f7', background: '#111827' },
  MSFT: { Icon: TiVendorMicrosoft, color: '#ffffff', background: '#00a4ef' },
  GOOGL: { Icon: SiGoogle, color: '#ffffff', background: '#4285F4' },
  TSLA: { Icon: SiTesla, color: '#ffffff', background: '#e11d48' },
};


export function PortfolioPage() {
  const [holdings, setHoldings] = useState([]);
  const [isAddAssetOpen, setAddAssetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const portfolioRef = useRef(null);
  const [portfolioData, setPortfolioData] = useState([]);

  useEffect(() => {
    loadAssets();
    loadPortfolioGrowth();
  }, []);

  const loadPortfolioGrowth = async () => {
    try {
      const growth = await api.getPortfolioGrowth(7);
      setPortfolioData(growth);
    } catch (error) {
      console.error('Failed to load portfolio growth:', error);
    }
  };

  const handleRefreshPrices = async () => {
      try {
        setRefreshing(true);
        await api.refreshAssetPrices();
        await loadAssets(); // Reload to show updated prices
      } catch (error) {
        console.error('Failed to refresh prices:', error);
      } finally {
        setRefreshing(false);
      }
    };

    const handleDeleteAsset = async (assetId, assetSymbol) => {
    if (!window.confirm(`Are you sure you want to delete ${assetSymbol}?`)) {
      return;
    }
    
    try {
      await api.deleteAsset(assetId);
      loadAssets(); // Reload to update list
      loadPortfolioGrowth();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const assets = await api.getAssets();
      
      // Transform API data to match component format
      const transformedAssets = assets.map((asset) => ({
        id: asset.id, 
        ticker: asset.symbol,
        name: asset.name || asset.symbol,
        quantity: asset.quantity || 0,
        price: asset.current_price || 0,
        change: asset.price_change_percent || 0,
        sparklineData: [
          asset.current_price * 0.95,
          asset.current_price * 0.97,
          asset.current_price * 0.96,
          asset.current_price * 0.99,
          asset.current_price * 1.01,
          asset.current_price * 1.02,
          asset.current_price,
        ],
      }));
      
      setHoldings(transformedAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings.reduce((sum, holding) => sum + holding.price * holding.quantity, 0);
  const calculateTotalChange = () => {
  if (portfolioData.length < 2) return 0;
  
    // Use yesterday (second-to-last) to today (last) for meaningful change
    const yesterday = portfolioData[portfolioData.length - 2].value;
    const today = portfolioData[portfolioData.length - 1].value;
    
    // Prevent division by zero
    if (yesterday === 0) return 0;
    
    return ((today - yesterday) / yesterday) * 100;
  };

  const totalChange = calculateTotalChange();

  const handleAddAssetSuccess = () => {
    loadAssets(); // Refresh assets after adding
    setAddAssetOpen(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading portfolio...</div>;
  }

  return (
    <div className="p-8 space-y-8" ref={portfolioRef}>
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Investment Portfolio</h1>
        <p className="text-muted-foreground">Track your investments and portfolio performance</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* Net Worth Card */}
        <GlassCard className="p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#10b981] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-2">Total Net Worth</p>
            <div className="flex items-baseline gap-4 mb-2">
              <h1 className="text-4xl font-bold">{formatEuro(totalValue)}</h1>
              <div className={`flex items-center gap-1 text-lg ${totalChange >= 0 ? 'text-[#10b981]' : 'text-[#ff8a80]'}`}>
                {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% today
              </div>
            </div>
          <p className="text-sm text-muted-foreground">
            {portfolioData.length >= 2 
              ? `${totalChange >= 0 ? '+' : ''}${formatEuro(
                  (portfolioData[portfolioData.length - 1]?.value || 0) - (portfolioData[0]?.value || 0)
                )} gain this week`
              : 'No portfolio data'
            }
          </p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 overflow-hidden"> 
          <VideoPanel />
        </GlassCard>
      </div>

      {/* Portfolio Growth Chart */}
      <GlassCard className="p-6">
        <h3 className="text-xl mb-6">Portfolio Growth - Last 7 Days</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolioData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="day" 
                stroke="#a1a1aa"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="#a1a1aa"
                style={{ fontSize: '14px' }}
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={formatEuro}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 31, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f5f5f7'
                }}
                formatter={(value) => [formatEuro(value), 'Portfolio Value']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3}
                fill="url(#portfolioGradient)"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Held Assets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Held Assets</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setAddAssetOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Add Asset
            </button>
          <button 
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 transition-all font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {holdings.length > 0 ? (
            holdings.map((holding) => (
              <GlassCard key={holding.ticker} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 shadow-lg"
                        style={{
                          backgroundColor: stockLogos[holding.ticker]?.background ?? '#10b981',
                          color: stockLogos[holding.ticker]?.color ?? '#ffffff',
                        }}
                        aria-hidden="true"
                      >
                        {(() => {
                          const Logo = stockLogos[holding.ticker]?.Icon;
                          return Logo ? <Logo className="h-5 w-5" /> : <span className="text-sm font-bold">{holding.ticker.slice(0, 1)}</span>;
                        })()}
                      </div>
                      <h3 className="text-2xl font-bold">{holding.ticker}</h3>
                      <span className={`text-sm px-2 py-1 rounded-lg ${
                        holding.change >= 0 
                          ? 'bg-[#10b981]/20 text-[#10b981]' 
                          : 'bg-[#ff8a80]/20 text-[#ff8a80]'
                      }`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{holding.name}</p>
                  </div>
                  <div className="h-12 w-24">
                    <Sparkline 
                      data={holding.sparklineData} 
                      color={holding.change >= 0 ? '#10b981' : '#ff8a80'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="text-lg font-semibold">{holding.quantity} shares</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                    <p className="text-lg font-semibold">{formatEuro(holding.price)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center gap-6">
                    <button
                      onClick={() => handleDeleteAsset(holding.id, holding.ticker)}
                      className="px-3 py-1 text-sm rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Delete
                    </button>
                    <div className='flex gap-2 items-center'>
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="text-lg font-bold text-[#10b981]">{formatEuro(holding.price * holding.quantity)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground mb-4">No assets yet. Add your first investment!</p>
              <button
                onClick={() => setAddAssetOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all font-medium"
              >
                Add Asset
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddAssetOpen}
        onClose={() => setAddAssetOpen(false)}
        title="Add Asset"
      >
      <AddAssetModal 
        onClose={() => {
          setAddAssetOpen(false);
        }}
        onSuccess={() => {
          loadAssets();
          loadPortfolioGrowth(); // Refresh portfolio
          setAddAssetOpen(false);
        }}
      />
      </Modal>
    </div>
  );
}