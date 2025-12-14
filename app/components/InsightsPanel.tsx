'use client';
import React from 'react';

interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  updatedAt?: string;
  relevanceScore: number;
}

export function InsightsPanel({ articles, keywords }: { articles: Article[]; keywords: string[] }) {
  const coverage = articles.length > 0 ? Math.round((articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length / 10) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2">📊 Coverage</h3>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${coverage}%` }}></div>
        </div>
        <p className="text-xl font-bold text-teal-600 mt-2">{coverage}%</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2">🏷️ Keywords</h3>
        <div className="space-y-1">
          {keywords.slice(0, 5).map((kw, i) => <p key={i} className="text-sm text-slate-600">• {kw}</p>)}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2">📈 Stats</h3>
        <p className="text-sm">Articles: {articles.length}</p>
        <p className="text-sm">Keywords: {keywords.length}</p>
      </div>
    </div>
  );
}

