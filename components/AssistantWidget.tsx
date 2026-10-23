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
    scrollToBottom();
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
          isSpy: isSpy
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
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white text-2xl shadow-lg flex items-center justify-center"
          title={`${assistantName} — помощник`}
        >
          ❓
        </button>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-full sm:w-96 bg-gray-900 sm:border sm:border-green-500 sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 'var(--app-height, 100dvh)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xl">🤖</span>
              <span className="text-white font-semibold">{assistantName}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-2xl leading-none p-2"
              title="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-line ${
                    msg.isUser
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg text-sm bg-gray-700 text-gray-400 italic">
                  Печатает...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-3 bg-gray-800 border-t border-gray-700 shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Задайте вопрос..."
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white text-base border border-gray-600 focus:outline-none focus:border-green-400"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}