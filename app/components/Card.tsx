// app/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md hover:shadow-lg 
        border border-slate-100 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-slate-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}