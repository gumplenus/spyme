'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';
import { getAssistantName, getAssistantGreeting } from '@/lib/assistantKnowledge';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export function AssistantWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpy, setIsSpy] = useState(false);
  const [role, setRole] = useState<string>('REPORTER');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('User')
        .select('publicRole, isSpy')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRole(profile.publicRole || 'REPORTER');
        setIsSpy(profile.isSpy === true);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          text: getAssistantGreeting(role, isSpy),
          isUser: false,
        },
      ]);
    }
  }, [isOpen, role, isSpy, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input.trim(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: question,
          role: role,
          isSpy: isSpy,
          history: messages
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        text: data.reply,
        isUser: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Ошибка: ${err.message}`,
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/chat') ||
    pathname === '/'
  ) {
    return null;
  }

  const assistantName = getAssistantName(role, isSpy);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-4 z-50 w-14 h-14 border border-[#39ff14] bg-[#050807] text-[#39ff14] text-xl shadow-[0_0_15px_rgba(57,255,20,0.3)] flex items-center justify-center font-mono hover:bg-[#39ff14]/10 transition-colors rounded-none"
          title={`${assistantName} — помощник`}
        >
          [?]
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-full sm:w-96 h-[100dvh] sm:h-[500px] bg-[#050807] sm:border border-[#39ff14]/50 shadow-[0_0_20px_rgba(57,255,20,0.2)] flex flex-col overflow-hidden font-mono rounded-none">
          
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f0d] border-b border-[#39ff14]/30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#39ff14] text-sm font-bold tracking-widest uppercase">
                &gt; {assistantName}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white text-lg leading-none font-mono transition-colors"
              title="Закрыть"
            >
              [x]
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 bg-[#050807]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 border text-sm whitespace-pre-wrap rounded-none ${
                    msg.isUser
                      ? 'border-[#39ff14]/50 bg-[#39ff14]/5 text-[#39ff14]'
                      : 'border-gray-800 bg-[#0a0f0d] text-gray-300'
                  }`}
                >
                  <div className={`text-[9px] uppercase tracking-wider mb-2 border-b pb-1 ${msg.isUser ? 'border-[#39ff14]/30 text-[#39ff14]/70' : 'border-gray-800 text-gray-600'}`}>
                    {msg.isUser ? '> ВЫ' : `> ${assistantName}`}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 border border-gray-800 bg-[#0a0f0d] text-gray-500 text-xs italic animate-pulse">
                  [ СИСТЕМА_АНАЛИЗИРУЕТ... ]
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-3 bg-[#0a0f0d] border-t border-[#39ff14]/30 shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="> ВВЕДИТЕ_ЗАПРОС..."
                className="flex-1 px-3 py-2 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-600"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10 text-xs font-semibold tracking-wider disabled:opacity-50 rounded-none transition-colors"
              >
                ОТПРАВИТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}