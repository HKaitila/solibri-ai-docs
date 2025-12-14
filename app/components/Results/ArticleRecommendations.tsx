// app/components/Results/ArticleRecommendations.tsx

import Card from '@/components/Common/Card';

interface Article {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  category?: string;
  updatedAt?: string;
}

interface ArticleRecommendationsProps {
  articles: Article[];
}

export default function ArticleRecommendations({
  articles,
}: ArticleRecommendationsProps) {
  if (!articles.length) {
    return null;
  }

  return (
    <Card
      title="✅ Matching Articles"
      description={`${articles.length} article${articles.length !== 1 ? 's' : ''} found`}
    >
      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="overflow-hidden rounded-lg border border-green-100 bg-green-50 transition-all hover:border-green-200 hover:bg-green-100/50"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-900 truncate">
                    {article.title}
                  </h3>
                  {article.category && (
                    <p className="mt-1 text-xs text-green-700">
                      📁 {article.category}
                    </p>
                  )}
                  {article.updatedAt && (
                    <p className="mt-1 text-xs text-green-600">
                      Updated {article.updatedAt}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-900">
                        {Math.round(article.relevanceScore * 100)}%
                      </p>
                      <p className="text-xs text-green-700">match</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-green-200 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
        <p className="text-xs text-green-900">
          <span className="font-semibold">💡 Tip:</span> These articles already cover topics in
          your release notes. Review them to understand what updates might be needed.
        </p>
      </div>
    </Card>
  );
}
