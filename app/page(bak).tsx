'use client';

import { useState } from 'react';

type InputMode = 'text' | 'url' | 'update';

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [releaseNotesText, setReleaseNotesText] = useState('');
  const [releaseNotesUrl, setReleaseNotesUrl] = useState('');
  const [existingArticleText, setExistingArticleText] = useState('');
  const [existingArticleUrl, setExistingArticleUrl] = useState('');
  const [existingArticleInputMode, setExistingArticleInputMode] = useState<'file' | 'url' | 'text'>('file');
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [updateAnalysis, setUpdateAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleTitle, setArticleTitle] = useState('');

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      
      // If it's HTML, extract text content
      let content = text;
      if (file.name.endsWith('.html')) {
        // Remove script and style tags
        content = content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          // Remove HTML tags
          .replace(/<[^>]+>/g, ' ')
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      setExistingArticleText(content);
      setError('');
    } catch (err) {
      setError('Error reading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleGenerate = async () => {
    let releaseNotes = '';

    if (inputMode === 'text') {
      releaseNotes = releaseNotesText.trim();
      if (!releaseNotes) {
        setError('Please paste release notes first.');
        return;
      }
    } else if (inputMode === 'url') {
      releaseNotes = releaseNotesUrl.trim();
      if (!releaseNotes) {
        setError('Please paste a URL first.');
        return;
      }
    } else if (inputMode === 'update') {
      releaseNotes = releaseNotesText.trim();
      if (!releaseNotes) {
        setError('Please paste release notes first.');
        return;
      }
      if (!existingArticleText.trim() && !existingArticleUrl.trim()) {
        setError('Please provide existing article (upload file, paste URL, or paste text).');
        return;
      }
    }

    setLoading(true);
    setError('');
    setGeneratedArticle('');
    setUpdateAnalysis('');
    setArticleTitle('');

    try {
      if (inputMode === 'update') {
        // Use update-article API
        const response = await fetch('/api/update-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            releaseNotes,
            existingArticle: existingArticleText,
            articleUrl: existingArticleUrl
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze article');
        }

        const data = await response.json();
        setUpdateAnalysis(data.analysis);
        setGeneratedArticle(data.updatedArticle || '');
        setArticleTitle('Updated Article');
      } else {
        // Use existing generate API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            releaseNotes,
            isUrl: inputMode === 'url'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate article');
        }

        const data = await response.json();
        setGeneratedArticle(data.article);
        setArticleTitle(data.title || 'Help Article');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating article. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const content = inputMode === 'update' ? updateAnalysis : generatedArticle;
    const markdown = `# ${articleTitle}\n\n${content}`;
    downloadFile(markdown, `${articleTitle.toLowerCase().replace(/\s+/g, '-')}.md`, 'text/markdown');
  };

  const exportXML = () => {
    const content = inputMode === 'update' ? generatedArticle : generatedArticle;
    const topicId = articleTitle.toLowerCase().replace(/\s+/g, '-');
    const sections = content.split('\n\n').filter(s => s.trim());
    
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="${topicId}">
  <title>${escapeXml(articleTitle)}</title>
  <shortdesc>Generated from Solibri release notes</shortdesc>
  <body>
`;

    sections.forEach((section, index) => {
      const lines = section.split('\n');
      const title = lines[0];
      
      xmlContent += `    <section id="section-${index + 1}">
      <title>${escapeXml(title)}</title>
`;

      lines.slice(1).forEach(line => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          xmlContent += `      <ul><li>${escapeXml(line.trim().substring(1).trim())}</li></ul>\n`;
        } else if (line.trim()) {
          xmlContent += `      <p>${escapeXml(line.trim())}</p>\n`;
        }
      });

      xmlContent += `    </section>\n`;
    });

    xmlContent += `  </body>
</topic>`;

    downloadFile(xmlContent, `${topicId}.xml`, 'application/xml');
  };

  const exportHTML = () => {
    const content = inputMode === 'update' ? updateAnalysis : generatedArticle;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(articleTitle)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    ul, ol { margin: 15px 0; }
    li { margin: 8px 0; }
    .keep { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .update { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .new { background: #cce5ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(articleTitle)}</h1>
  <div>${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
    downloadFile(htmlContent, `${articleTitle.toLowerCase().replace(/\s+/g, '-')}.html`, 'text/html');
  };

  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const handleClearAll = () => {
    setReleaseNotesText('');
    setReleaseNotesUrl('');
    setExistingArticleText('');
    setExistingArticleUrl('');
    setGeneratedArticle('');
    setUpdateAnalysis('');
    setArticleTitle('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Input
            </h2>

            {/* Input Mode Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-300">
              <button
                onClick={() => {
                  setInputMode('text');
                  setError('');
                }}
                className={`pb-2 px-3 font-semibold transition text-sm ${
                  inputMode === 'text'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 Paste Text
              </button>
              <button
                onClick={() => {
                  setInputMode('url');
                  setError('');
                }}
                className={`pb-2 px-3 font-semibold transition text-sm ${
                  inputMode === 'url'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔗 From URL
              </button>
              <button
                onClick={() => {
                  setInputMode('update');
                  setError('');
                }}
                className={`pb-2 px-3 font-semibold transition text-sm ${
                  inputMode === 'update'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚡ Update Article
              </button>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <textarea
                value={releaseNotesText}
                onChange={(e) => setReleaseNotesText(e.target.value)}
                placeholder="Paste your Solibri release notes here..."
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
              />
            )}

            {/* URL Input */}
            {inputMode === 'url' && (
              <div>
                <input
                  type="url"
                  value={releaseNotesUrl}
                  onChange={(e) => setReleaseNotesUrl(e.target.value)}
                  placeholder="e.g., https://www.solibri.com/articles/release-notes"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
                <p className="mt-2 text-sm text-gray-600">
                  🔍 Paste the URL to your release notes. The tool will fetch and extract the content.
                </p>
              </div>
            )}

            {/* Update Article Input */}
            {inputMode === 'update' && (
              <div className="space-y-4">
                {/* Release Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📋 Release Notes (what changed)
                  </label>
                  <textarea
                    value={releaseNotesText}
                    onChange={(e) => setReleaseNotesText(e.target.value)}
                    placeholder="Paste the new release notes here..."
                    className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                  />
                </div>

                {/* Existing Article - Input Mode Tabs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📄 Existing Help Article (to update)
                  </label>
                  
                  <div className="flex gap-2 mb-3 border-b border-gray-300">
                    <button
                      onClick={() => {
                        setExistingArticleInputMode('file');
                        setExistingArticleText('');
                        setExistingArticleUrl('');
                      }}
                      className={`pb-2 px-3 text-sm font-semibold transition ${
                        existingArticleInputMode === 'file'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📁 Upload HTML
                    </button>
                    <button
                      onClick={() => {
                        setExistingArticleInputMode('url');
                        setExistingArticleText('');
                      }}
                      className={`pb-2 px-3 text-sm font-semibold transition ${
                        existingArticleInputMode === 'url'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🔗 From URL
                    </button>
                    <button
                      onClick={() => {
                        setExistingArticleInputMode('text');
                        setExistingArticleUrl('');
                      }}
                      className={`pb-2 px-3 text-sm font-semibold transition ${
                        existingArticleInputMode === 'text'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✏️ Paste Text
                    </button>
                  </div>

                  {/* File Upload */}
                  {existingArticleInputMode === 'file' && (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (files.length > 0) handleFileUpload(files[0]);
                      }}
                    >
                      <input
                        type="file"
                        accept=".html,.txt,.md"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="articleFileInput"
                      />
                      <label htmlFor="articleFileInput" className="cursor-pointer block">
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          📁 Drop HTML file here or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                          Supported: .html, .txt, .md files
                        </p>
                      </label>
                      {existingArticleText && (
                        <p className="mt-3 text-sm text-green-600">
                          ✅ File loaded ({Math.round(existingArticleText.length / 1024)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* URL Input */}
                  {existingArticleInputMode === 'url' && (
                    <div>
                      <input
                        type="url"
                        value={existingArticleUrl}
                        onChange={(e) => setExistingArticleUrl(e.target.value)}
                        placeholder="e.g., https://help.solibri.com/hc/en-us/articles/..."
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Note: Some sites may block automated access. If URL fails, use file upload instead.
                      </p>
                    </div>
                  )}

                  {/* Text Input */}
                  {existingArticleInputMode === 'text' && (
                    <textarea
                      value={existingArticleText}
                      onChange={(e) => setExistingArticleText(e.target.value)}
                      placeholder="Paste the existing help article content here..."
                      className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                {loading 
                  ? (inputMode === 'update' ? 'Analyzing...' : 'Generating...') 
                  : (inputMode === 'update' ? 'Analyze & Update' : 'Generate Article')
                }
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
              {inputMode === 'update' ? 'Update Analysis' : 'Generated Help Article'}
            </h2>

            {(generatedArticle || updateAnalysis) ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
                  {inputMode === 'update' && updateAnalysis ? (
                    <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                      {updateAnalysis}
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg mb-3">{articleTitle}</h3>
                      <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                        {generatedArticle}
                      </div>
                    </>
                  )}
                </div>

                {/* Export Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const content = inputMode === 'update' ? updateAnalysis : generatedArticle;
                      navigator.clipboard.writeText(content);
                      alert('Copied to clipboard!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={exportMarkdown}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
                  >
                    📄 Markdown
                  </button>
                  <button
                    onClick={exportXML}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
                  >
                    ⚙️ Paligo XML
                  </button>
                  <button
                    onClick={exportHTML}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
                  >
                    🌐 HTML
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-400 text-center px-4">
                  {inputMode === 'update' 
                    ? 'Update analysis will appear here...\n\nCompare release notes against existing articles to see what needs updating.'
                    : 'Generated article will appear here...'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>HAMK AI Project | Solibri AI Documentation Assistant</p>
        </div>
      </div>
    </div>
  );
}
