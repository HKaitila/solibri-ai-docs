// app/components/Layout/Header.tsx

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Release Notes Analyzer
              </h1>
              <p className="mt-0.5 text-sm text-gray-600">
                Analyze releases & suggest article updates
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
