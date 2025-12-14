// app/components/Layout/MainContainer.tsx

interface MainContainerProps {
  children: React.ReactNode;
}

export default function MainContainer({ children }: MainContainerProps) {
  return (
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {children}
      </div>
    </main>
  );
}

