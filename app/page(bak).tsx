'use client';

import { useToast, ToastContainer } from '@/components/ToastContainer';
import { ReleaseNotesInput } from '@/components/ReleaseNotesInput';
// ExportMenu will be added in Phase 2 - comment out for now
// import { ExportMenu } from '@/components/ExportMenu';
import { useState, useCallback } from 'react';

export default function Home() {
  // ============================================================================
  // TOAST NOTIFICATIONS HOOK
  // ============================================================================
  // Provides showToast() function to display success/error/info messages
  // Automatically dismisses after 3 seconds
  const { toasts, showToast, removeToast } = useToast();

  // ============================================================================
  // STATE MANAGEMENT - RELEASE NOTES INPUT & ANALYSIS
  // ============================================================================
  // releaseNotes: Current release notes text (from textarea or file upload)
  const [releaseNotes, setReleaseNotes] = useState('');
  
  // results: API response containing articles to update and improvements
  // Structure: { articles: [], gaps: [], summary: '' }
  const [results, setResults] = useState<any>(null);
  
  // loading: Shows loading state during API call to /api/compare
  const [loading, setLoading] = useState(false);
  
  // error: Stores error messages if analysis fails
  const [error, setError] = useState<string | null>(null);
  
  // analysisGaps: List of documentation gaps found (topics in release but no articles)
  const [analysisGaps, setAnalysisGaps] = useState<any[]>([]);

  // ============================================================================
  // STATE MANAGEMENT - TAB NAVIGATION & ARTICLE CREATION
  // ============================================================================
  // selectedTab: Switches between "analyze" (release notes analysis) and "create" (new article generation)
  const [selectedTab, setSelectedTab] = useState<'analyze' | 'create'>('analyze');
  
  // newArticleTopic: User input for the topic of article to generate
  const [newArticleTopic, setNewArticleTopic] = useState('');
  
  // creatingArticle: Shows loading state during article generation via /api/generate-article
  const [creatingArticle, setCreatingArticle] = useState(false);

  // ============================================================================
  // FUNCTION: ANALYZE RELEASE NOTES
  // ============================================================================
  // Analyzes release notes against existing help articles
  const handleAnalyze = useCallback(async (notes: string) => {
    setReleaseNotes(notes);
    setLoading(true);
    setError(null);
    
    try {
      // Call backend API to compare release notes against help articles
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          releaseNotes: notes,
          articles: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze release notes');
      }

      const data = await response.json();
      setResults(data.data);
      setAnalysisGaps(data.data?.gaps || []);
      showToast('✅ Analysis complete!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      showToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ============================================================================
  // FUNCTION: GENERATE NEW HELP ARTICLE
  // ============================================================================
  // Creates a new help article based on user input topic
  const handleCreateArticle = useCallback(async () => {
    if (!newArticleTopic.trim()) {
      showToast('Please enter a topic', 'error');
      return;
    }

    setCreatingArticle(true);
    
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newArticleTopic,
          context: releaseNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const data = await response.json();
      
      // Download the generated markdown
      const blob = new Blob([data.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newArticleTopic.replace(/\s+/g, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('✅ Article generated and downloaded!', 'success');
      setNewArticleTopic('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      showToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setCreatingArticle(false);
    }
  }, [newArticleTopic, releaseNotes, showToast]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* ====================================================================
              HEADER - PAGE TITLE & DESCRIPTION
              ==================================================================== */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-text mb-2">
              Release Notes Analyzer
            </h1>
            <p className="text-lg text-text-secondary">
              Analyze release notes and get smart documentation recommendations
            </p>
          </div>

          {/* ====================================================================
              TAB NAVIGATION - SWITCH BETWEEN ANALYZE & CREATE
              ==================================================================== */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setSelectedTab('analyze')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'analyze'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text hover:bg-secondary-hover'
              }`}
            >
              📊 Analyze Release Notes
            </button>
            <button
              onClick={() => setSelectedTab('create')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'create'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text hover:bg-secondary-hover'
              }`}
            >
              ✨ Create Article
            </button>
          </div>

          {/* ====================================================================
              TAB 1: ANALYZE RELEASE NOTES
              ==================================================================== */}
          {selectedTab === 'analyze' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN: RELEASE NOTES INPUT */}
              <div>
                <ReleaseNotesInput onAnalyze={handleAnalyze} />
              </div>

              {/* RIGHT COLUMN: ANALYSIS RESULTS */}
              <div>
                {!releaseNotes && (
                  <div className="card">
                    <div className="card-content">
                      <p className="text-text-secondary text-center py-8">
                        📝 Enter release notes to see which articles should be updated
                      </p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="card">
                    <div className="card-content">
                      <p className="text-center py-8">⏳ Analyzing...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="card border-l-4 border-error">
                    <div className="card-content">
                      <p className="text-error font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {results && !loading && (
                  <div className="space-y-6">
                    {/* Articles to Update */}
                    {results.articles && results.articles.length > 0 && (
                      <div className="card">
                        <div className="card-header">
                          <h3 className="card-title">
                            📄 Articles Recommended for Update ({results.articles.length})
                          </h3>
                        </div>
                        <div className="card-content">
                          <p className="text-text-secondary mb-4">
                            These articles should be reviewed and updated to reflect the new release:
                          </p>
                          <div className="space-y-4">
                            {results.articles.map((article: any, idx: number) => (
                              <div
                                key={idx}
                                className="border border-card-border rounded-lg p-4 hover:bg-secondary transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-text">
                                    {article.title}
                                  </h4>
                                  <span className="bg-primary text-white px-2 py-1 rounded text-sm font-medium">
                                    Match: {article.relevanceScore}/10
                                  </span>
                                </div>
                                <p className="text-text-secondary text-sm">
                                  {article.content
                                    .replace(/<[^>]*>/g, '')
                                    .substring(0, 150)}
                                  ...
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Documentation Gaps */}
                    {analysisGaps.length > 0 && (
                      <div className="card">
                        <div className="card-header">
                          <h3 className="card-title">
                            ⚠️ Documentation Gaps ({analysisGaps.length})
                          </h3>
                        </div>
                        <div className="card-content">
                          <p className="text-text-secondary mb-4">
                            These topics are mentioned in the release but have no matching help articles:
                          </p>
                          <div className="space-y-2">
                            {analysisGaps.map((gap: any, idx: number) => (
                              <div key={idx} className="bg-bg-4 border-l-4 border-warning p-3 rounded">
                                <p className="font-medium text-text">{gap.topic}</p>
                                <p className="text-text-secondary text-sm">{gap.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====================================================================
              TAB 2: CREATE NEW HELP ARTICLE
              ==================================================================== */}
          {selectedTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">✨ Create New Help Article</h3>
                </div>
                <div className="card-content">
                  <div className="bg-bg-3 border-l-4 border-info p-4 rounded mb-6">
                    <p className="font-semibold text-text mb-2">💡 Tip:</p>
                    <p className="text-text-secondary">
                      The AI will generate a well-structured help article in Solibri's style with sections, examples, and practical guidance.
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-text mb-4">How It Works:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-text-secondary">
                      <li>Enter the article topic you want to create</li>
                      <li>Optionally include release notes for context</li>
                      <li>Click "Generate Article Draft"</li>
                      <li>A markdown file will be generated and downloaded</li>
                      <li>Edit and refine in your editor, then import to Paligo</li>
                    </ol>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Article Topic</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., How to configure advanced filters"
                        value={newArticleTopic}
                        onChange={(e) => setNewArticleTopic(e.target.value)}
                        disabled={creatingArticle}
                      />
                    </div>

                    <div>
                      <label className="form-label">Release Notes (Optional)</label>
                      <textarea
                        className="form-control"
                        placeholder="Paste release notes to give context to the AI..."
                        rows={6}
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        disabled={creatingArticle}
                      />
                    </div>

                    <button
                      onClick={handleCreateArticle}
                      disabled={creatingArticle || !newArticleTopic.trim()}
                      className="btn btn-primary btn-lg btn-full"
                    >
                      {creatingArticle ? '⏳ Generating...' : '📝 Generate Article Draft'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOAST CONTAINER - NOTIFICATION DISPLAY */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}