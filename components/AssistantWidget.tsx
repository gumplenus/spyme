'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';
import { findAnswer, getAssistantName, getAssistantGreeting } from '@/lib/assistantKnowledge';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input.trim(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input.trim();
    setInput('');

    setTimeout(() => {
      const answer = findAnswer(question, role, isSpy);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        text:
          answer ||
          'Я не могу ответить на этот вопрос. Попробуйте переформулировать или спросить о ролях, механиках или интерфейсе игры.\n\n🤖 Скоро здесь будет ИИ-агент. Он будет лучше понимать и отвечать на ваши вопросы.',
        isUser: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 300);
  };

  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
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
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[500px] bg-gray-900 border border-green-500 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xl">🤖</span>
              <span className="text-white font-semibold">{assistantName}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xl leading-none"
              title="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-line ${
                    msg.isUser
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 bg-gray-800 border-t border-gray-700 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Задайте вопрос..."
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:border-green-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
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