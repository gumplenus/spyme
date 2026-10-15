'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<{ username: string; country: string | null; publicRole: string | null; avatarUrl: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('User')
        .select('username, country, publicRole, avatarUrl')
        .eq('id', params.userId)
        .single();
      setContact({
        username: profile?.username || 'Неизвестный',
        country: profile?.country || null,
        publicRole: profile?.publicRole || null,
        avatarUrl: profile?.avatarUrl || null,
      });

      const { data: messagesData } = await supabase
        .from('Message')
        .select('*')
        .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
        .or(`senderId.eq.${params.userId},recipientId.eq.${params.userId}`)
        .order('createdAt', { ascending: true });

      const visibleMessages = (messagesData || []).filter((m: any) => {
        if (m.senderId === user.id && m.deletedForSender) return false;
        if (m.recipientId === user.id && m.deletedForRecipient) return false;
        return true;
      });

      setMessages(visibleMessages);
      setLoading(false);
    };

    fetchData();
  }, [router, params.userId]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('chat-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload) => {
          const newMsg = payload.new as any;
          if (
            (newMsg.senderId === currentUserId && newMsg.recipientId === params.userId) ||
            (newMsg.senderId === params.userId && newMsg.recipientId === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, params.userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    // Проверяем, что получатель не забанен и не удалён
    const { data: recipientCheck } = await supabase
      .from('User')
      .select('isBanned, deletedAt')
      .eq('id', params.userId)
      .single();

    if (recipientCheck?.isBanned || recipientCheck?.deletedAt) {
      alert('Нельзя отправить сообщение этому игроку');
      return;
    }

    setSending(true);

    const { data: inserted, error } = await supabase
      .from('Message')
      .insert({
        senderId: currentUserId,
        recipientId: params.userId,
        content: newMessage.trim(),
        isZoned: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка отправки:', error);
      alert('Не удалось отправить сообщение');
    } else if (inserted) {

      setNewMessage('');
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* ХЭДЕР */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <Link href="/chat" className="text-green-400 hover:underline text-xl">
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
          {contact?.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={contact.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-green-400 truncate">
            {contact?.username || 'Неизвестный'}
          </h1>
          <p className="text-gray-400 text-xs truncate">
            {contact?.publicRole && contact?.country
              ? `${contact.publicRole} · ${contact.country}`
              : contact?.country || contact?.publicRole || ''}
          </p>
        </div>
      </div>

      {/* СООБЩЕНИЯ */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">
            Начните диалог с {contact?.username || 'Неизвестный'}
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg ${
                    isMine ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ФУТЕР */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold disabled:opacity-50"
          >
            {sending ? '...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}