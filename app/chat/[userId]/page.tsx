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
    setTimeout(() => {
      scrollToBottom();
    }, 100);
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
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ПОДКЛЮЧЕНИЕ_К_КАНАЛУ...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#050807] text-gray-300 flex flex-col overflow-hidden z-50 font-mono">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 shrink-0">
        <Link href="/chat" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <div className="w-10 h-10 rounded-full border border-[#39ff14]/30 overflow-hidden flex items-center justify-center shrink-0">
          {contact?.avatarUrl ? (
            <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-500">USR</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#39ff14] truncate tracking-widest">@{contact?.username || 'Неизвестный'}</h1>
          <p className="text-gray-500 text-[10px] truncate uppercase tracking-wider">
            {contact?.publicRole && contact?.country ? `${contact.publicRole} // ${contact.country}` : contact?.country || contact?.publicRole || 'КАНАЛ_ЗАЩИЩЕН'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-sm italic text-center mt-8">[ КАНАЛ ПУСТ. ПЕРЕДАЙТЕ ПЕРВОЕ СООБЩЕНИЕ. ]</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 border ${isMine ? 'border-[#39ff14]/50 bg-[#39ff14]/5' : 'border-gray-800 bg-[#0a0f0d]'}`}>
                  <div className="flex justify-between items-center gap-4 mb-1 border-b border-gray-800/50 pb-1">
                    <span className={`text-[10px] tracking-wider ${isMine ? 'text-[#39ff14]' : 'text-gray-500'}`}>
                      {isMine ? '> ВЫ' : `> ${contact?.username || 'АБОНЕНТ'}`}
                    </span>
                    <span className="text-[9px] text-gray-600">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-[#050807] border-t border-[#39ff14]/30 shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="> ВВОД_СООБЩЕНИЯ..."
            className="flex-1 p-3 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-700"
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-4 py-3 border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10 text-xs font-semibold tracking-wider disabled:opacity-50 transition-colors rounded-none">
            {sending ? '...' : 'ОТПРАВИТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
}