'use client';
import React from 'react';

export function LoadingState() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-bold">Analyzing...</h3>
        <p className="text-sm text-slate-600 mt-1">Matching keywords with articles</p>
      </div>
    </div>
  );
}
