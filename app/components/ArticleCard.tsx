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

export function ArticleCard({ article, onViewFull }: { article: Article; onViewFull: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-teal-600">{article.title}</h3>
        <span className="text-sm font-bold text-teal-600">{article.relevanceScore}/10</span>
      </div>
      <p className="text-slate-600 text-sm mb-3">{article.content.substring(0, 100)}...</p>
      {article.category && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mb-3">{article.category}</span>}
      <button onClick={onViewFull} className="text-sm text-teal-600 hover:underline">View Full</button>
    </div>
  );
}

