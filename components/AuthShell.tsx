// src/components/AuthShell.tsx
export function AuthShell({ children, eyebrow, title }: { children: React.ReactNode, eyebrow?: string, title?: string }) {
  return (
    <div className="min-h-screen bg-[#050807] flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] font-mono">
      {eyebrow && <p className="text-[10px] tracking-[0.3em] text-[#39ff14]/70 mb-3 uppercase">{eyebrow}</p>}
      {title && <h1 className="text-2xl font-bold text-[#39ff14] mb-6 tracking-widest">{title}</h1>}
      <div className="border border-[#39ff14]/40 bg-[#0a0f0d] p-8 w-full max-w-md shadow-[0_0_20px_rgba(57,255,20,0.15)]">
        {children}
      </div>
    </div>
  );
}