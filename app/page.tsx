'use client';

import { useState } from 'react';

export default function Home() {
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [releaseNotesText, setReleaseNotesText] = useState('');
  const [releaseNotesUrl, setReleaseNotesUrl] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleTitle, setArticleTitle] = useState('');

  const handleGenerate = async () => {
    let releaseNotes = '';

    if (inputMode === 'text') {
      releaseNotes = releaseNotesText.trim();
      if (!releaseNotes) {
        setError('Please paste release notes first.');
        return;
      }
    } else {
      releaseNotes = releaseNotesUrl.trim();
      if (!releaseNotes) {
        setError('Please paste a URL first.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setGeneratedArticle('');
    setArticleTitle('');

    try {
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
    const markdown = `# ${articleTitle}\n\n${generatedArticle}`;
    downloadFile(markdown, `${articleTitle.toLowerCase().replace(/\s+/g, '-')}.md`, 'text/markdown');
  };

  const exportXML = () => {
    const topicId = articleTitle.toLowerCase().replace(/\s+/g, '-');
    const sections = generatedArticle.split('\n\n').filter(s => s.trim());
    
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
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(articleTitle)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    ul, ol { margin: 15px 0; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(articleTitle)}</h1>
  <div>${generatedArticle.replace(/\n/g, '<br>')}</div>
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
    setGeneratedArticle('');
    setArticleTitle('');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Release Notes Input
            </h2>

            {/* Input Mode Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-300">
              <button
                onClick={() => {
                  setInputMode('text');
                  setError('');
                }}
                className={`pb-2 px-4 font-semibold transition ${
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
                className={`pb-2 px-4 font-semibold transition ${
                  inputMode === 'url'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔗 From URL
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

            {/* Buttons */}
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
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <h3 className="font-bold text-lg mb-3">{articleTitle}</h3>
                  <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {generatedArticle}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedArticle);
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
