'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Zap, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Article {
  id: number;
  title: string;
  content: string;
  relevanceScore?: number;
}

interface AnalysisResult {
  score: number;
  severity: string;
  category: string;
  affectedRoles: string[];
  summary: string;
  actionRequired: string;
  riskAssessment: string;
}

interface AnalysisResponse {
  success: boolean;
  data: {
    extraction?: AnalysisResult;
    suggestedArticles?: Article[];
  };
}

interface CompareResponse {
  success: boolean;
  data: {
    shouldUpdate: boolean;
    suggestedUpdate: string;
    impactAnalysis: AnalysisResult;
  };
}

export default function ReleaseNotesPage() {
  const [inputTab, setInputTab] = useState<'analyze' | 'create'>('analyze');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  // Loading states
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [suggestedArticles, setSuggestedArticles] = useState<Article[]>([]);
  const [compareResult, setCompareResult] = useState<CompareResponse['data'] | null>(null);
  const [createResult, setCreateResult] = useState<string | null>(null);

  // Errors
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!releaseNotes.trim()) {
      setError('Please enter release notes');
      return;
    }

    setLoadingAnalysis(true);
    setError('');
    setCompareResult(null);
    setCreateResult(null);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseNotes }),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.data?.extraction?.summary || 'Failed to analyze');
      }

      setAnalysisResult(data.data.extraction || null);
      setSuggestedArticles(data.data.suggestedArticles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleCompare = async (article: Article) => {
    if (!releaseNotes.trim()) {
      setError('Please enter release notes');
      return;
    }

    setLoadingCompare(true);
    setError('');
    setSelectedArticleId(article.id);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseNotes,
          articleId: article.id,
          articleContent: article.content,
        }),
      });

      const data: CompareResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Failed to compare');
      }

      setCompareResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!releaseNotes.trim()) {
      setError('Please enter release notes');
      return;
    }

    if (!articleTitle.trim()) {
      setError('Please enter an article title');
      return;
    }

    setLoadingCreate(true);
    setError('');
    setAnalysisResult(null);
    setSuggestedArticles([]);
    setCompareResult(null);

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseNotes,
          title: articleTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate article');
      }

      setCreateResult(data.data.content);
      setArticleTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Article creation failed');
    } finally {
      setLoadingCreate(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'LOW':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Release Notes Analyzer</h1>
          </div>
          <p className="text-gray-600">Analyze release notes, compare with existing articles, or create new ones</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => {
                    setInputTab('analyze');
                    setError('');
                  }}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    inputTab === 'analyze'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analyze & Compare
                </button>
                <button
                  onClick={() => {
                    setInputTab('create');
                    setError('');
                  }}
                  className={`px-4 py-2 font-medium transition border-b-2 flex items-center gap-2 ${
                    inputTab === 'create'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Create New
                </button>
              </div>

              {/* Analyze Tab */}
              {inputTab === 'analyze' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Release Notes</h2>

                  <textarea
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="Paste your release notes here..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />

                  <button
                    onClick={handleAnalyze}
                    disabled={loadingAnalysis || !releaseNotes.trim()}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    {loadingAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Analyze Impact & Find Articles
                  </button>
                </div>
              )}

              {/* Create Tab */}
              {inputTab === 'create' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Article</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Article Title</label>
                      <input
                        type="text"
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        placeholder="e.g., Solibri 25.9.0 Release Notes"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Release Notes Content</label>
                      <textarea
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        placeholder="Paste your release notes here..."
                        className="w-full h-56 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateArticle}
                    disabled={loadingCreate || !releaseNotes.trim() || !articleTitle.trim()}
                    className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    {loadingCreate ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Generate Article
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis Result */}
            {analysisResult && (
              <div className={`rounded-xl shadow-sm border p-6 ${getSeverityColor(analysisResult.severity)}`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Impact Analysis
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeColor(analysisResult.severity)}`}>
                    {analysisResult.severity}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm opacity-75">Summary</p>
                    <p className="font-medium">{analysisResult.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-75">Impact Score</p>
                      <p className="text-2xl font-bold">{analysisResult.score}/10</p>
                    </div>

                    <div>
                      <p className="text-sm opacity-75">Action Required</p>
                      <p className="font-medium">{analysisResult.actionRequired}</p>
                    </div>
                  </div>

                  {analysisResult.affectedRoles && analysisResult.affectedRoles.length > 0 && (
                    <div>
                      <p className="text-sm opacity-75 mb-2">Affected Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.affectedRoles.map((role) => (
                          <span key={role} className="px-2 py-1 bg-white bg-opacity-30 rounded text-sm">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm opacity-75">Risk Assessment</p>
                    <p className="text-sm">{analysisResult.riskAssessment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Articles */}
            {suggestedArticles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Relevant Articles ({suggestedArticles.length})
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {suggestedArticles.map((article) => (
                    <div
                      key={article.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{article.title}</h4>
                          {article.relevanceScore && (
                            <p className="text-xs text-gray-500 mt-1">
                              Relevance: {(article.relevanceScore * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleCompare(article)}
                          disabled={loadingCompare}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded font-medium whitespace-nowrap transition"
                        >
                          {loadingCompare && selectedArticleId === article.id ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            'Compare'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compare Result */}
            {compareResult && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Result</h3>

                <div className="space-y-4">
                  {compareResult.impactAnalysis && (
                    <div className={`rounded-lg p-4 ${getSeverityColor(compareResult.impactAnalysis.severity)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Impact Analysis</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getSeverityBadgeColor(compareResult.impactAnalysis.severity)}`}>
                          {compareResult.impactAnalysis.severity}
                        </span>
                      </div>
                      <p className="text-sm">{compareResult.impactAnalysis.summary}</p>
                    </div>
                  )}

                  {compareResult.suggestedUpdate && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Suggested Update</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                            h3: ({ ...props }) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                            p: ({ ...props }) => <p className="mb-2 text-gray-700" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 text-gray-700" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 text-gray-700" {...props} />,
                            li: ({ ...props }) => <li className="mb-1" {...props} />,
                            strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                            em: ({ ...props }) => <em className="italic" {...props} />,
                            code: ({ ...props }) => <code className="bg-gray-200 px-1 rounded text-sm font-mono" {...props} />,
                          }}
                        >
                          {compareResult.suggestedUpdate}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {compareResult.shouldUpdate && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-900">
                        <strong>Recommendation:</strong> Update this article with the new information.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Result */}
            {createResult && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Generated Article
                </h3>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
                      p: ({ ...props }) => <p className="mb-2 text-gray-700" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 text-gray-700" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 text-gray-700" {...props} />,
                      li: ({ ...props }) => <li className="mb-1" {...props} />,
                      strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                      em: ({ ...props }) => <em className="italic" {...props} />,
                      code: ({ ...props }) => <code className="bg-gray-200 px-1 rounded text-sm font-mono" {...props} />,
                      blockquote: ({ ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                    }}
                  >
                    {createResult}
                  </ReactMarkdown>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createResult);
                    alert('Article copied to clipboard!');
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Copy Article
                </button>
              </div>
            )}

            {/* Empty State */}
            {!analysisResult && suggestedArticles.length === 0 && !compareResult && !createResult && releaseNotes.trim() && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">Select an action above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
