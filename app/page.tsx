'use client';

import { useState } from 'react';

export default function Home() {
  const [releaseNotes, setReleaseNotes] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!releaseNotes.trim()) {
      setError('Please paste release notes first.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedArticle('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const data = await response.json();
      setGeneratedArticle(data.article);
    } catch (err) {
      setError('Error generating article. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setReleaseNotes('');
    setGeneratedArticle('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Solibri AI Documentation Generator
          </h1>
          <p className="text-xl text-gray-600">
            Convert release notes into professional help center articles
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Release Notes Input
            </h2>

            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Paste your Solibri release notes here..."
              className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                {loading ? 'Generating...' : 'Generate Article'}
              </button>

              <button
                onClick={handleClearAll}
                disabled={loading}
                className="px-6 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-bold py-3 rounded-lg transition duration-200"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Generated Help Article
            </h2>

            {generatedArticle ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-96 overflow-y-auto prose prose-sm">
                  <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {generatedArticle}
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedArticle);
                    alert('Copied to clipboard!');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  Copy to Clipboard
                </button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-400 text-center">
                  Generated article will appear here...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>University Project | Solibri AI Documentation Assistant</p>
        </div>
      </div>
    </div>
  );
}
