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

export function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">{article.title}</h2>
          <p className="text-slate-600 text-sm mt-2">Score: {article.relevanceScore}/10</p>
        </div>
        <div className="p-6">
          <p className="text-slate-700">{article.content}</p>
        </div>
        <div className="p-6 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}

