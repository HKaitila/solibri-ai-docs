// app/page.tsx - Enhanced with file upload, working Create New tab, and 4 export formats
'use client';

import { useState, useRef } from 'react';

interface Article {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
}

interface AnalysisGap {
  topic: string;
  mentions: number;
}

interface AnalysisResults {
  articles: Article[];
  gaps: AnalysisGap[];
  summary: string;
}

type Tab = 'analyze' | 'create';
type InputMethod = 'text' | 'file';

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [editingNewArticle, setEditingNewArticle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Create New tab states
  const [articleTopic, setArticleTopic] = useState('');
  const [articleContext, setArticleContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New stuff
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedArticleForSuggestion, setSelectedArticleForSuggestion] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [draftExportLoading, setDraftExportLoading] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);


  // Expanded article
  const [expandedDraftArticleId, setExpandedDraftArticleId] = useState<string | null>(null);

  const detectMetadata = (text: string) => {
    const versionMatch = text.match(/v?(\d+\.\d+\.\d+)/);
    const dateMatch = text.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (versionMatch) setVersion(versionMatch[1]);
    if (dateMatch) setReleaseDate(`${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    setReleaseNotes(text);
    detectMetadata(text);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  setIsDragOver(true);
};

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    setReleaseNotes(text);
    detectMetadata(text);
  };


  const handleAnalyze = async () => {
    if (!releaseNotes.trim()) {
      setError('Please enter or upload release notes');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseNotes,
          version: version || 'Unknown',
          date: releaseDate || 'Unknown',
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Analysis failed');
      setAnalysisResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (!articleTopic.trim()) {
      setError('Please enter an article topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: articleTopic,
          context: articleContext || '',
        }),
      });

      if (!response.ok) throw new Error('Article generation failed');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');
      
      setGeneratedArticle(data.data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadArticle = (format: 'markdown' | 'xml' | 'html' | 'json') => {
    if (!generatedArticle) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';

    const title = articleTopic.toLowerCase().replace(/\s+/g, '-');

    switch (format) {
      case 'markdown':
        content = generatedArticle;
        filename = `${title}.md`;
        mimeType = 'text/markdown';
        break;

      case 'xml': {
        // Paligo-friendly XML format
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<section>
  <title>${articleTopic}</title>
  <body>
${generatedArticle
  .split('\n')
  .map(line => {
    if (line.startsWith('# ')) {
      return `    <title>${line.replace('# ', '').trim()}</title>`;
    } else if (line.startsWith('## ')) {
      return `    <section>
      <title>${line.replace('## ', '').trim()}</title>`;
    } else if (line.startsWith('### ')) {
      return `      <title>${line.replace('### ', '').trim()}</title>`;
    } else if (line.trim()) {
      return `    <para>${line.trim()}</para>`;
    }
    return '';
  })
  .filter(line => line)
  .join('\n')}
  </body>
</section>`;
        content = xmlContent;
        filename = `${title}.xml`;
        mimeType = 'application/xml';
        break;
      }

      case 'html': {
        // HTML format for Paligo/web import
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${articleTopic}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 20px; }
    h3 { color: #666; }
    p { color: #333; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    ul, ol { color: #333; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
${generatedArticle
  .split('\n')
  .map(line => {
    if (line.startsWith('# ')) {
      return `  <h1>${line.replace('# ', '').trim()}</h1>`;
    } else if (line.startsWith('## ')) {
      return `  <h2>${line.replace('## ', '').trim()}</h2>`;
    } else if (line.startsWith('### ')) {
      return `  <h3>${line.replace('### ', '').trim()}</h3>`;
    } else if (line.startsWith('- ')) {
      return `  <li>${line.replace('- ', '').trim()}</li>`;
    } else if (line.startsWith('* ')) {
      return `  <li>${line.replace('* ', '').trim()}</li>`;
    } else if (line.trim()) {
      return `  <p>${line.trim()}</p>`;
    }
    return '';
  })
  .filter(line => line)
  .join('\n')}
</body>
</html>`;
        content = htmlContent;
        filename = `${title}.html`;
        mimeType = 'text/html';
        break;
      }

      case 'json': {
        // Structured JSON for programmatic import
        const jsonContent = {
          metadata: {
            title: articleTopic,
            created: new Date().toISOString(),
            format: 'paligo-article',
          },
          article: {
            title: articleTopic,
            content: generatedArticle,
            sections: generatedArticle
              .split('\n## ')
              .map((section, idx) => {
                const lines = section.split('\n');
                return {
                  title: idx === 0 ? articleTopic : lines[0],
                  content: lines.slice(1).join('\n').trim(),
                };
              }),
          },
        };
        content = JSON.stringify(jsonContent, null, 2);
        filename = `${title}.json`;
        mimeType = 'application/json';
        break;
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportGeneratedWithTranslation = async (
  format: 'markdown' | 'html',
  targetLanguage?: 'FI' | 'DE' | 'NL' | 'FR',
) => {
  if (!generatedArticle || !articleTopic.trim()) return;

  try {
    const response = await fetch('/api/export-generated-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: articleTopic,
        content: generatedArticle,
        format,
        targetLanguage,
      }),
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const base = articleTopic.toLowerCase().replace(/\s+/g, '-');
    const ext = format === 'html' ? 'html' : 'md';
    const langSuffix = targetLanguage ? `-${targetLanguage.toLowerCase()}` : '';
    a.href = url;
    a.download = `${base}-article${langSuffix}.${ext}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Failed to export generated article');
  }
};

  const handleReset = () => {
    setAnalysisResults(null);
    setReleaseNotes('');
    setVersion('');
    setReleaseDate('');
    setFileName(null);
    setError(null);
  };

  const calculateCoverage = (articles: Article[]) => {
    return articles.length > 0 ? Math.round((articles.length / 10) * 100) : 0;
  };

  const handleExport = async (format: 'xml' | 'markdown' | 'json') => {
  if (!analysisResults) return;

  // new
  setExportLoading(true);
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        analysis: {
          version: analysisResults.version || version || 'Unknown',
          releaseDate: releaseDate || new Date().toISOString().split('T'),
          releaseNotes,
          matchedArticles: analysisResults.articles,
          gaps: analysisResults.gaps,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${new Date().toISOString().split('T')}.${
      format === 'xml' ? 'xml' : format === 'markdown' ? 'md' : 'json'
    }`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
    alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setExportLoading(false);
  }
};

  const handleExportDraft = async (
  format: 'markdown' | 'xml' | 'json',
  article: any,
  targetLanguage?: 'FI' | 'DE' | 'NL' | 'FR',
) => {
  if (!article.draftUpdate || !article.updateSummary) return;

  setDraftExportLoading(true);
  try {
    const response = await fetch('/api/export-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleTitle: article.title,
        suggestion: article.updateSummary,
        draftUpdate: article.draftUpdate,
        articleUrl: article.url,
        releaseVersion: version || 'Unknown',
        format,
        targetLanguage, // can be undefined
      }),
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title
      .toLowerCase()
      .replace(/\s+/g, '-')}-draft-update.${
      format === 'xml' ? 'xml' : format === 'json' ? 'json' : 'md'
    }`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Failed to export draft');
  } finally {
    setDraftExportLoading(false);
  }
};


/*  const exportAnalysisToMarkdown = () => {
    if (!analysisResults) return;
    const md = `# Release ${version} - Help Article Audit\n\n## Summary\n- **Version**: ${version}\n- **Release Date**: ${releaseDate}\n- **Matching Articles**: ${analysisResults.articles.length}\n- **Coverage**: ${calculateCoverage(analysisResults.articles)}%\n- **Documentation Gaps**: ${analysisResults.gaps.length}\n\n## Articles to Update\n${analysisResults.articles.map(a => `- ${a.title} (${Math.round(a.relevanceScore)}%)`).join('\n')}\n\n## Documentation Gaps\n${analysisResults.gaps.map(g => `- ${g.topic}`).join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release-${version}-analysis.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
*/

  // Inline Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
    } as React.CSSProperties,
    
    header: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      // align with main:
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 24px',
    } as React.CSSProperties,

    headerTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
      color: '#000000',
    } as React.CSSProperties,
    
    headerDesc: {
      fontSize: '16px',
      color: '#666666',
      margin: '0',
    } as React.CSSProperties,
    
    tabs: {
      display: 'flex',
      gap: '32px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      padding: '0 24px',
      maxWidth: '1200px',
      margin: '0 auto',
    } as React.CSSProperties,
    
    tabButton: (active: boolean) => ({
      padding: '16px 0',
      background: 'none',
      border: 'none',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      color: active ? '#0066cc' : '#666666',
      borderBottom: active ? '3px solid #0066cc' : '3px solid transparent',
      transition: 'all 0.2s',
    } as React.CSSProperties),
    
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '32px',
    } as React.CSSProperties,
    
    sidebar: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
      position: 'sticky',
      top: '100px',
      height: 'fit-content',
    } as React.CSSProperties,
    
    sidebarTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
      color: '#000000',
    } as React.CSSProperties,
    
    sidebarDesc: {
      fontSize: '13px',
      color: '#666666',
      margin: '0 0 16px 0',
    } as React.CSSProperties,

    inputTabs: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
    } as React.CSSProperties,

    inputTabButton: (active: boolean) => ({
      flex: 1,
      padding: '8px 12px',
      backgroundColor: active ? '#0066cc' : '#f0f0f0',
      color: active ? '#ffffff' : '#000000',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s',
    } as React.CSSProperties),
    
    textarea: {
      width: '100%',
      height: '200px',
      padding: '12px',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
      marginBottom: '8px',
      color: '#000000',
      backgroundColor: '#ffffff',
    } as React.CSSProperties,
    
    fileInput: {
      display: 'none',
    } as React.CSSProperties,

    fileUploadButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#f0f0f0',
      border: '2px dashed #d0d0d0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#666666',
      marginBottom: '8px',
      transition: 'all 0.2s',
    } as React.CSSProperties,

    fileName: {
      fontSize: '12px',
      color: '#0066cc',
      marginBottom: '12px',
      fontWeight: '500',
    } as React.CSSProperties,
    
    charCount: {
      fontSize: '12px',
      color: '#999999',
      textAlign: 'right' as const,
      marginBottom: '16px',
    } as React.CSSProperties,
    
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box',
      marginBottom: '4px',
      color: '#000000',
      backgroundColor: '#ffffff',
    } as React.CSSProperties,
    
    label: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#333333',
      display: 'block',
      marginBottom: '8px',
      marginTop: '12px',
    } as React.CSSProperties,
    
    detected: {
      fontSize: '12px',
      color: '#00aa00',
      fontWeight: 'bold',
      marginTop: '4px',
    } as React.CSSProperties,
    
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    } as React.CSSProperties,

    exportButtonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    } as React.CSSProperties,
    
    buttonPrimary: {
      flex: 1,
      padding: '12px 16px',
      backgroundColor: '#005bb5',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background 0.2s',
    } as React.CSSProperties,
    
    buttonSecondary: {
      flex: 1,
      padding: '12px 16px',
      backgroundColor: '#f0f0f0',
      color: '#000000',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background 0.2s',
    } as React.CSSProperties,
    
    tips: {
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #e0e0e0',
      fontSize: '12px',
    } as React.CSSProperties,
    
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    } as React.CSSProperties,
    
    error: {
      backgroundColor: '#ffebee',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      padding: '16px',
    } as React.CSSProperties,
    
    errorText: {
      color: '#cc0000',
      fontSize: '14px',
      margin: 0,
    } as React.CSSProperties,
    
    loading: {
      backgroundColor: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      padding: '48px 24px',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    
    empty: {
      backgroundColor: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      padding: '48px 24px',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    } as React.CSSProperties,
    
    statCard: (bgColor: string) => ({
      backgroundColor: bgColor,
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center' as const,
    } as React.CSSProperties),
    
    statLabel: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#333333',
      margin: '0 0 8px 0',
    } as React.CSSProperties,
    
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#000000',
      margin: 0,
    } as React.CSSProperties,
    
    card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
  } as React.CSSProperties,
    
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '0 0 16px 0',
      color: '#000000',
    } as React.CSSProperties,
    
    articleCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
      marginBottom: '12px',
    } as React.CSSProperties,

    generatedContent: {
      backgroundColor: '#f8f8f8',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '400px',
      overflow: 'auto',
      marginBottom: '16px',
      color: '#000000',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
    } as React.CSSProperties,

    exportLabel: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#333333',
      margin: '0 0 12px 0',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>⚡ Documentation Update Assistant</h1>
        <p style={styles.headerDesc}>Analyze releases to update existing help articles. Generate new articles with AI assistance.</p>
      </header>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={styles.tabButton(activeTab === 'analyze')}
          onClick={() => setActiveTab('analyze')}
        >
          📊 Analyze & Compare
        </button>
        <button
          style={styles.tabButton(activeTab === 'create')}
          onClick={() => setActiveTab('create')}
        >
          ✍️ Create New
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {activeTab === 'analyze' && (
          <>
            {/* SIDEBAR */}
            <div style={styles.sidebar}>
              <h2 style={styles.sidebarTitle}>Release Notes</h2>
              <p style={styles.sidebarDesc}>Paste your release notes or upload a file</p>

              {/* Input Method Tabs */}
              <div style={styles.inputTabs}>
                <button
                  style={styles.inputTabButton(inputMethod === 'text')}
                  onClick={() => setInputMethod('text')}
                >
                  📝 Text
                </button>
                <button
                  style={styles.inputTabButton(inputMethod === 'file')}
                  onClick={() => setInputMethod('file')}
                >
                  📄 File
                </button>
              </div>

              {inputMethod === 'text' ? (
                <>
                  <textarea
                    style={styles.textarea}
                    placeholder="Paste your release notes here..."
                    value={releaseNotes}
                    onChange={(e) => {
                      setReleaseNotes(e.target.value);
                      detectMetadata(e.target.value);
                    }}
                  />
                  <div style={styles.charCount}>{releaseNotes.length} / 10000</div>
                </>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={handleFileUpload}
                    style={styles.fileInput}
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <button
                      style={{
                        ...styles.fileUploadButton,
                        borderColor: isDragOver ? '#0284c7' : '#d0d0d0',
                        backgroundColor: isDragOver ? '#e0f2fe' : '#f0f0f0',
                        color: isDragOver ? '#0c4a6e' : '#666666',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📤 Click to upload file or drag & drop
                    </button>

                    {fileName && <div style={styles.fileName}>✓ Loaded: {fileName}</div>}
                  </div>
                </>
              )}

              <label style={styles.label}>Version</label>
              <input
                style={styles.input}
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 25.0.0"
              />
              {version && <div style={styles.detected}>✓ Detected</div>}

              <label style={styles.label}>Release Date</label>
              <input
                style={styles.input}
                type="text"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                placeholder="e.g., Dec 11, 2025"
              />
              {releaseDate && <div style={styles.detected}>✓ Detected</div>}

              <div style={styles.buttonGroup}>
                <button
                  style={{...styles.buttonPrimary, opacity: isLoading || !releaseNotes.trim() ? 0.6 : 1}}
                  onClick={handleAnalyze}
                  disabled={isLoading || !releaseNotes.trim()}
                >
                  {isLoading ? '⏳ Analyzing...' : '🔍 Analyze'}
                </button>
                <button style={styles.buttonSecondary} onClick={handleReset}>
                  Reset
                </button>
              </div>

              <div style={styles.tips}>
                <p style={{fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0'}}>💡 Tips</p>
                <ul style={{margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666666'}}>
                  <li>✓ Version & date auto-detected</li>
                  <li>✓ Adjust values manually if needed</li>
                  <li>✓ Full notes for best results</li>
                </ul>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div style={styles.content}>
              {error && (
                <div style={styles.error}>
                  <p style={styles.errorText}>⚠️ Error: {error}</p>
                </div>
              )}

              {isLoading && (
                <div style={styles.loading}>
                  <div style={{fontSize: '48px', marginBottom: '16px'}}>⚙️</div>
                  <p style={{fontSize: '16px', fontWeight: 'bold', margin: 0}}>Analyzing release notes...</p>
                  <p style={{fontSize: '13px', color: '#666666', marginTop: '8px'}}>This usually takes 3-5 seconds</p>
                </div>
              )}

              {!isLoading && !analysisResults && (
                <div style={styles.empty}>
                  <div style={{fontSize: '64px', marginBottom: '16px'}}>📊</div>
                  <p style={{fontSize: '18px', fontWeight: 'bold', margin: 0}}>No analysis yet</p>
                  <p style={{fontSize: '14px', color: '#666666', marginTop: '8px'}}>Paste or upload release notes and click "Analyze" to get started</p>
                </div>
              )}

              {!isLoading && analysisResults && (
                <>
                  {/* STATS */}
                  <div style={styles.stats}>
                    <div style={styles.statCard('#e3f2fd')}>
                      <p style={styles.statLabel}>Articles Found</p>
                      <p style={styles.statValue}>{analysisResults.articles.length}</p>
                    </div>
                    <div style={styles.statCard('#e8f5e9')}>
                      <p style={styles.statLabel}>Coverage</p>
                      <p style={styles.statValue}>{calculateCoverage(analysisResults.articles)}%</p>
                    </div>
                    <div style={styles.statCard('#fff3e0')}>
                      <p style={styles.statLabel}>Gaps</p>
                      <p style={styles.statValue}>{analysisResults.gaps.length}</p>
                    </div>
                  </div>

                  {/* ARTICLES */}
                      <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Articles to Update</h3>
                        {analysisResults.articles.map((article) => (
                          <div key={article.id} style={styles.articleCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong style={{ color: '#000000' }}>{article.title}</strong>
                              <span
                                style={{
                                  backgroundColor: '#e3f2fd',
                                  color: '#0066cc',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                {Math.round(article.relevanceScore)}% match
                              </span>
                            </div>

                            {selectedArticleForSuggestion === article.id && suggestionText && (
                              <div
                                style={{
                                  padding: '10px',
                                  marginBottom: '8px',
                                  backgroundColor: '#fefce8',
                                  border: '1px solid #facc15',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  lineHeight: '1.5',
                                  color: '#713f12',
                                }}
                              >
                                <strong>✨ AI Suggestion:</strong>
                                <p style={{ margin: '6px 0 0 0' }}>{suggestionText}</p>
                              </div>
                            )}

                            <div style={{ fontSize: '13px', color: '#666666', margin: 0 }}>
                              <span style={{ display: 'block', marginBottom: '8px' }}>
                           
                              </span>
                            </div>


                            {/* 1) UPDATED suggestion line */}
                            <div style={{ marginTop: '4px', fontSize: '13px', color: '#666' }}>
                              <strong>Suggestion:</strong>{' '}
                              {article.updateSummary || article.suggestedUpdates || 'Review for relevance'}
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#0066cc',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid #0066cc',
                                    paddingBottom: '2px',
                                  }}
                                >
                                  View original article →
                                </a>
                              </div>

                            {/* 2) NEW: View draft update button */}
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDraftArticleId(
                                    expandedDraftArticleId === article.id ? null : article.id,
                                  )
                                }
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  border: '1px solid #0ea5e9',
                                  backgroundColor:
                                    expandedDraftArticleId === article.id ? '#0ea5e9' : '#ffffff',
                                  color:
                                    expandedDraftArticleId === article.id ? '#ffffff' : '#0ea5e9',
                                  cursor: 'pointer',
                                }}
                                disabled={false} //{!article.draftUpdate || article.draftUpdate.trim().length === 0}
                              >
                                {expandedDraftArticleId === article.id ? 'Hide draft update' : 'View draft update'}
                              </button>
                            </div>

                            {/* 3) NEW: Draft panel */}
                            {expandedDraftArticleId === article.id && article.draftUpdate && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '10px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #e5e7eb',
                                  fontSize: '13px',
                                  color: '#374151',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {article.draftUpdate}

                                <div
                                  style={{
                                    marginTop: '12px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #e5e7eb',
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleExportDraft('markdown', article)}
                                    disabled={draftExportLoading}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      backgroundColor: '#059669',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: draftExportLoading ? 'not-allowed' : 'pointer',
                                      opacity: draftExportLoading ? 0.6 : 1,
                                    }}
                                  >
                                    📄 Markdown
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExportDraft('xml', article)}
                                    disabled={draftExportLoading}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      backgroundColor: '#dc2626',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: draftExportLoading ? 'not-allowed' : 'pointer',
                                      opacity: draftExportLoading ? 0.6 : 1,
                                    }}
                                  >
                                    ⚙️ XML
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExportDraft('json', article)}
                                    disabled={draftExportLoading}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      backgroundColor: '#7c3aed',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: draftExportLoading ? 'not-allowed' : 'pointer',
                                      opacity: draftExportLoading ? 0.6 : 1,
                                    }}
                                  >
                                    {} JSON
                                  </button>
                                </div>
                                

                              <div
                                style={{
                                  marginTop: '8px',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                  fontSize: '11px',
                                  color: '#666666',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>Translate draft to (Markdown):</span>
                                <button
                                  type="button"
                                  onClick={() => handleExportDraft('markdown', article, 'FI')}
                                  disabled={draftExportLoading}
                                  style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                                >
                                  Finnish
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportDraft('markdown', article, 'DE')}
                                  disabled={draftExportLoading}
                                  style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                                >
                                  German
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportDraft('markdown', article, 'NL')}
                                  disabled={draftExportLoading}
                                  style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                                >
                                  Dutch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportDraft('markdown', article, 'FR')}
                                  disabled={draftExportLoading}
                                  style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                                >
                                  French
                                </button>
                              </div>
                            </div>
                          )}
                            

                          </div>
                        ))}
                      </div>

                  
                  {/* GAPS */}

                  {/* 
                  {analysisResults.gaps.length > 0 && (
                    <div style={{...styles.card, backgroundColor: '#fffbf0', borderColor: '#ffd699'}}>
                      <h3 style={styles.cardTitle}>📍 Documentation Gaps</h3>
                      {analysisResults.gaps.map((gap, idx) => (
                        <div key={idx} style={{...styles.articleCard, backgroundColor: '#ffffff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                          <strong style={{color: '#000000'}}>{gap.topic}</strong>
                          <span style={{backgroundColor: '#fff8e1', color: '#cc7a00', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px'}}>
                            {gap.mentions} mentions
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  */}
                </>
              )}

              {!isLoading && analysisResults && (
                <section
                  style={{
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: '#eff6ff',
                    border: '2px solid #0284c7',
                    borderRadius: '8px',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#0c4a6e',
                    }}
                  >
                    📥 Export Analysis
                  </h3>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={exportLoading}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: exportLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: exportLoading ? 0.6 : 1,
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      Select format {showExportMenu ? '▲' : '▼'}
                    </button>

                    {showExportMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #0284c7',
                          borderRadius: '4px',
                          marginTop: '4px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          zIndex: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => {
                            handleExport('markdown');
                            setShowExportMenu(false);
                          }}
                          disabled={exportLoading}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            color: '#0c4a6e',
                            border: 'none',
                            cursor: exportLoading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            textAlign: 'left',
                            borderBottom: '1px solid #e0e0e0',
                          }}
                        >
                          📝 Download as Markdown
                        </button>
                        <button
                          onClick={() => {
                            handleExport('xml');
                            setShowExportMenu(false);
                          }}
                          disabled={exportLoading}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            color: '#0c4a6e',
                            border: 'none',
                            cursor: exportLoading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            textAlign: 'left',
                            borderBottom: '1px solid #e0e0e0',
                          }}
                        >
                          ⚙️ Download as XML
                        </button>
                        <button
                          onClick={() => {
                            handleExport('json');
                            setShowExportMenu(false);
                          }}
                          disabled={exportLoading}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            color: '#0c4a6e',
                            border: 'none',
                            cursor: exportLoading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            textAlign: 'left',
                          }}
                        >
                          {} 🏷️ Download as JSON
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>
          </>
        )}

        {activeTab === 'create' && (
          <div style={{...styles.card, gridColumn: '1 / -1', maxWidth: '800px'}}>
            <h2 style={styles.cardTitle}>Create New Help Article</h2>
            
            <label style={styles.label}>Article Topic *</label>
            <input
              style={{...styles.input, marginBottom: '16px'}}
              type="text"
              placeholder="e.g., Advanced Filtering in BIM Models"
              value={articleTopic}
              onChange={(e) => setArticleTopic(e.target.value)}
            />

            <label style={styles.label}>Release Notes (Optional)</label>
            <p style={{fontSize: '12px', color: '#666666', marginTop: '-8px', marginBottom: '8px'}}>Add release notes as context for more relevant articles</p>
            <textarea
              style={{...styles.textarea, height: '120px', marginBottom: '8px'}}
              placeholder="Paste release notes for context..."
              value={articleContext}
              onChange={(e) => setArticleContext(e.target.value)}
            />

            <div style={styles.buttonGroup}>
              <button
                style={{...styles.buttonPrimary, opacity: isGenerating || !articleTopic.trim() ? 0.6 : 1}}
                onClick={handleGenerateArticle}
                disabled={isGenerating || !articleTopic.trim()}
              >
                {isGenerating ? '⏳ Generating...' : '✨ Generate Article Draft'}
              </button>
            </div>

            {error && (
              <div style={{...styles.error, marginTop: '16px'}}>
                <p style={styles.errorText}>⚠️ Error: {error}</p>
              </div>
            )}

            {generatedArticle && (
              <>
                <h3 style={{...styles.cardTitle, marginTop: '32px'}}>Generated Article</h3>
                <div style={styles.generatedContent}>
                  {generatedArticle}
                </div>
                
                <div style={{marginBottom: '16px'}}>
                  <p style={styles.exportLabel}>Export Format:</p>
                  <div style={styles.exportButtonGrid}>
                    <button
                      style={styles.buttonPrimary}
                      onClick={() => handleDownloadArticle('markdown')}
                    >
                      📝 Markdown (.md)
                    </button>
                    <button
                      style={styles.buttonPrimary}
                      onClick={() => handleDownloadArticle('xml')}
                    >
                      🏷️ Paligo XML (.xml)
                    </button>
                    <button
                      style={styles.buttonPrimary}
                      onClick={() => handleDownloadArticle('html')}
                    >
                      🌐 HTML (.html)
                    </button>
                    <button
                      style={styles.buttonPrimary}
                      onClick={() => handleDownloadArticle('json')}
                    >
                      ⚙️ JSON (.json)
                    </button>
                  </div>
                </div>
                
                    {/* NEW: translation for generated article */}
                    <div
                      style={{
                        marginBottom: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        fontSize: '11px',
                        color: '#666666',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Translate generated article to:</span>
                      <button
                        type="button"
                        onClick={() => handleExportGeneratedWithTranslation('markdown', 'FI')}
                        style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                      >
                        Finnish (MD)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportGeneratedWithTranslation('markdown', 'DE')}
                        style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                      >
                        German (MD)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportGeneratedWithTranslation('markdown', 'NL')}
                        style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                      >
                        Dutch (MD)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportGeneratedWithTranslation('markdown', 'FR')}
                        style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer' }}
                      >
                        French (MD)
                      </button>
                    </div>

                    <div style={styles.buttonGroup}>
                      <button
                        style={styles.buttonSecondary}
                        onClick={() => {
                          setGeneratedArticle(null);
                          setArticleTopic('');
                          setArticleContext('');
                        }}
                      >
                    ✏️ Create Another
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
