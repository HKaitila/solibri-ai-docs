// app/components/Common/Card.tsx

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export default function Card({
  title,
  description,
  children,
  className = '',
  footer,
}: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || description) && (
        <div className="border-b border-gray-100 px-6 py-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      <div className="px-6 py-4">{children}</div>

      {footer && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}
