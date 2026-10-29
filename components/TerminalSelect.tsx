'use client';

import { useState } from 'react';

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export default function TerminalSelect({ value, onChange, options, placeholder = 'ВЫБЕРИТЕ...', className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex justify-between items-center text-left w-full px-3 py-2 bg-[#050807] text-[#39ff14] border border-gray-700 hover:border-[#39ff14] focus:border-[#39ff14] outline-none text-sm rounded-none transition-colors ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="opacity-50 text-xs ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-[#39ff14]/50 w-full max-w-sm bg-[#050807] shadow-[0_0_20px_rgba(57,255,20,0.2)] flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-[#39ff14]/30">
              <h3 className="text-xs text-[#39ff14] tracking-widest">&gt; ВЫБОР_ПАРАМЕТРА</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="overflow-y-auto p-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-gray-800 transition-colors ${
                    value === opt.value
                      ? 'text-[#39ff14] bg-[#39ff14]/10 border-l-2 border-l-[#39ff14]'
                      : 'text-gray-300 hover:bg-[#39ff14]/5 hover:text-[#39ff14]'
                  }`}
                >
                  {value === opt.value ? '[x] ' : '> '} {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}