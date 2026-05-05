import { ExternalLink, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function NewsPanel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await api.getMarketNews();
      if (response.success) {
        setArticles(response.articles);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-secondary/30 via-secondary/10 to-transparent overflow-hidden h-full">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#10b981]/15 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#10b981]" />
          Market News 📰
        </h3>
      </div>

      <div className="relative z-10 space-y-3 max-h-35 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading news...</div>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-[#10b981]/50 hover:bg-secondary/50 transition-all"
            >
              <div className="flex gap-3">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-[#10b981] transition-colors">
                    {article.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{article.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(article.publishedAt)}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#10b981] flex-shrink-0 mt-1 transition-colors" />
              </div>
            </a>
          ))
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">No news available</div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        ✨ Market news from NewsAPI
      </p>
    </div>
  );
}