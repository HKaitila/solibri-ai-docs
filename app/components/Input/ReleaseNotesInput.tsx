// app/components/Input/ReleaseNotesInput.tsx
// Input panel for release notes with file upload and auto-detection

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import FileUploader from './FileUploader';

interface ReleaseNotesInputProps {
  onAnalyze: (notes: string, version: string, date: string) => void;
  onReset: () => void;
  isLoading: boolean;
  hasResults: boolean;
  detectedVersion: string;
  detectedDate: string;
}

export default function ReleaseNotesInput({
  onAnalyze,
  onReset,
  isLoading,
  hasResults,
  detectedVersion,
  detectedDate,
}: ReleaseNotesInputProps) {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [notes, setNotes] = useState('');
  const [version, setVersion] = useState(detectedVersion);
  const [releaseDate, setReleaseDate] = useState(detectedDate);

  // Auto-detect version and date from notes
  useEffect(() => {
    if (!notes.trim()) return;

    // Auto-detect version (e.g., v25.0.0, 25.0.0, etc.)
    const versionMatch = notes.match(/v?(\d+\.\d+(?:\.\d+)?)/);
    if (versionMatch && !version) {
      setVersion(versionMatch[1]);
    }

    // Auto-detect date (various formats)
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /\w+\s+\d{1,2},?\s+\d{4}/, // Month DD, YYYY or Month DD YYYY
    ];

    for (const pattern of datePatterns) {
      const dateMatch = notes.match(pattern);
      if (dateMatch && !releaseDate) {
        setReleaseDate(dateMatch[0]);
        break;
      }
    }
  }, [notes, version, releaseDate]);

  const handleFileUpload = (content: string) => {
    setNotes(content);
    setInputMethod('text');
  };

  const handleAnalyze = () => {
    if (notes.trim()) {
      onAnalyze(notes, version, releaseDate);
    }
  };

  const handleReset = () => {
    setNotes('');
    setVersion('');
    setReleaseDate('');
    onReset();
  };

  const characterCount = notes.length;
  const maxCharacters = 10000;
  const percentFull = (characterCount / maxCharacters) * 100;

  return (
    <Card
      title="📝 Release Notes Input"
      description="Paste your release notes or upload a file"
    >
      <div className="space-y-4">
        {/* Input Method Tabs */}
        <div className="flex gap-0 border-b border-gray-200 bg-gray-50 rounded-t-lg p-2">
          <button
            onClick={() => setInputMethod('text')}
            className={`flex-1 px-4 py-2 font-medium text-sm rounded-t transition-all ${
              inputMethod === 'text'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Text
          </button>
          <button
            onClick={() => setInputMethod('file')}
            className={`flex-1 px-4 py-2 font-medium text-sm rounded-t transition-all ${
              inputMethod === 'file'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📎 File
          </button>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your release notes here..."
            className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        )}

        {/* File Input */}
        {inputMethod === 'file' && (
          <FileUploader onFileUpload={handleFileUpload} disabled={isLoading} />
        )}

        {/* Character Counter with Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>{characterCount} / {maxCharacters} characters</span>
            {characterCount > maxCharacters * 0.8 && (
              <span className="text-amber-600 font-medium">
                ⚠️ Approaching limit
              </span>
            )}
          </div>
          {characterCount > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentFull > 90
                    ? 'bg-red-500'
                    : percentFull > 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentFull, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Version & Date Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v25.0.0"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            {version && (
              <p className="text-xs text-green-600 mt-1">✓ Detected</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date
            </label>
            <input
              type="text"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="e.g., Dec 11, 2025"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            {releaseDate && (
              <p className="text-xs text-green-600 mt-1">✓ Detected</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAnalyze}
            disabled={!notes.trim() || isLoading}
            isLoading={isLoading}
            className="flex-1"
            title={!notes.trim() ? 'Please enter release notes first' : 'Analyze release notes'}
          >
            🔍 Analyze
          </Button>
          {hasResults && (
            <Button
              onClick={handleReset}
              variant="secondary"
              disabled={isLoading}
              className="flex-1"
              title="Clear results and start over"
            >
              ↻ Reset
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">💡 Tips:</span>
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Version and date are auto-detected from your notes</li>
            <li>You can manually adjust detected values if needed</li>
            <li>Paste the full release notes for best results</li>
            <li>Analysis usually takes 3-5 seconds</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}