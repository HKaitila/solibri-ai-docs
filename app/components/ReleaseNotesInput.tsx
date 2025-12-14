'use client';

import { useState } from 'react';

interface ReleaseNotesInputProps {
  onAnalyze: (notes: string) => void;
}

export function ReleaseNotesInput({ onAnalyze }: ReleaseNotesInputProps) {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.');
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    setTextInput(text);
  };

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      alert('Please enter or upload release notes');
      return;
    }

    setLoading(true);
    try {
      onAnalyze(textInput);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📝 Release Notes Input</h3>
      </div>
      <div className="card-content">
        {/* Input Method Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setInputMethod('text')}
            style={{
              padding: '8px 16px',
              backgroundColor: inputMethod === 'text' ? '#06b6d4' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Paste Text
          </button>
          <button
            onClick={() => setInputMethod('file')}
            style={{
              padding: '8px 16px',
              backgroundColor: inputMethod === 'file' ? '#06b6d4' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Upload File
          </button>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className="form-group">
            <label className="form-label">Release Notes</label>
            <textarea
              className="form-control"
              placeholder="Paste your release notes here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={8}
              disabled={loading}
            />
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '8px' }}>
              Characters: {textInput.length}
            </p>
          </div>
        )}

        {/* File Input */}
        {inputMethod === 'file' && (
          <div className="form-group">
            <label className="form-label">Upload File</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.md,.pdf"
              style={{
                padding: '10px',
                border: '1px solid #374151',
                borderRadius: '6px',
                width: '100%',
              }}
              disabled={loading}
            />
            {fileName && (
              <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '8px' }}>
                ✓ Loaded: {fileName}
              </p>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !textInput.trim()}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze Release Notes'}
        </button>
      </div>
    </div>
  );
}