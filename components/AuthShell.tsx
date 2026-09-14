// src/components/AuthShell.tsx
export function AuthShell({ children, eyebrow, title }: { children: React.ReactNode, eyebrow?: string, title?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {eyebrow && <p className="text-xs text-green-400 font-mono mb-2">{eyebrow}</p>}
      {title && <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>}
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md border border-gray-700">
        {children}
      </div>
    </div>
  );
}