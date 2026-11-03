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
  
  // Состояния для модерации
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleReport = async () => {
    if (!currentUserId || !reportReason.trim()) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('Report')
      .insert({
        reporterId: currentUserId,
        targetId: params.userId,
        reason: reportReason.trim(),
      });

    if (error) {
      alert('Ошибка отправки жалобы: ' + error.message);
    } else {
      alert('Жалоба отправлена. Модераторы рассмотрят её.');
      setIsReportOpen(false);
      setIsMenuOpen(false);
      setReportReason('');
    }
    setActionLoading(false);
  };

  const handleBlock = async () => {
    if (!currentUserId) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('Block')
      .insert({
        blockerId: currentUserId,
        blockedId: params.userId,
      });

    if (error) {
      if (error.code === '23505') { // Ошибка уникальности (уже заблокирован)
        alert('Вы уже заблокировали этого игрока');
      } else {
        alert('Ошибка блокировки: ' + error.message);
      }
    } else {
      alert('Игрок заблокирован. Вы больше не будете видеть его сообщения.');
      router.push('/chat');
    }
    setActionLoading(false);
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
      
      {/* ШАПКА ЧАТА */}
      <div className="flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
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

        {/* КНОПКА МЕНЮ МОДЕРАЦИИ */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="text-gray-500 hover:text-red-500 text-xs border border-gray-700 hover:border-red-500 px-2 py-1 rounded-none transition-colors"
        >
          [!]
        </button>
      </div>

      {/* ЛЕНТА СООБЩЕНИЙ */}
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

      {/* ПОЛЕ ВВОДА */}
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

      {/* МОДАЛКА МЕНЮ МОДЕРАЦИИ */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="border border-gray-600 w-full max-w-sm bg-[#050807] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex flex-col p-4">
            <h3 className="text-sm text-white tracking-widest mb-4 border-b border-gray-800 pb-2">ДЕЙСТВИЯ_С_АБОНЕНТОМ</h3>
            
            <button 
              onClick={() => { setIsMenuOpen(false); setIsReportOpen(true); }}
              className="w-full text-left p-3 mb-2 border border-gray-700 hover:border-yellow-500 text-gray-300 hover:text-yellow-500 text-xs transition-colors"
            >
              {'>'} ПОЖАЛОВАТЬСЯ_НА_ИГРОКА
            </button>
            <button 
              onClick={() => { setIsMenuOpen(false); setIsBlockOpen(true); }}
              className="w-full text-left p-3 mb-4 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-500 text-xs transition-colors"
            >
              {'>'} ЗАБЛОКИРОВАТЬ_ИГРОКА
            </button>

            <button onClick={() => setIsMenuOpen(false)} className="w-full py-2 bg-gray-800 text-gray-400 text-xs hover:bg-gray-700">
              ОТМЕНА
            </button>
          </div>
        </div>
      )}

      {/* МОДАЛКА ЖАЛОБЫ */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="border border-yellow-500 w-full max-w-sm bg-[#050807] shadow-[0_0_20px_rgba(234,179,8,0.2)] flex flex-col p-4">
            <h3 className="text-sm text-yellow-500 tracking-widest mb-2">&gt; ЖАЛОБА_НА_ИГРОКА</h3>
            <p className="text-gray-400 text-[10px] mb-4">Опишите причину жалобы (оскорбления, спам, нарушение правил).</p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-3 bg-transparent text-white border border-gray-700 focus:outline-none focus:border-yellow-500 h-24 text-sm rounded-none placeholder-gray-700 mb-4"
              placeholder="Причина..."
            />
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsReportOpen(false)} className="px-4 py-2 border border-gray-600 text-gray-400 text-xs rounded-none">ОТМЕНА</button>
              <button onClick={handleReport} disabled={actionLoading || !reportReason.trim()} className="px-4 py-2 border border-yellow-500 text-yellow-500 text-xs rounded-none disabled:opacity-50">
                {actionLoading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА БЛОКИРОВКИ */}
      {isBlockOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="border border-red-500 w-full max-w-sm bg-[#050807] shadow-[0_0_20px_rgba(239,68,68,0.2)] flex flex-col p-4">
            <h3 className="text-sm text-red-500 tracking-widest mb-2">&gt; БЛОКИРОВКА_ИГРОКА</h3>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Вы уверены, что хотите заблокировать <span className="text-white font-semibold">@{contact?.username}</span>? Вы больше не будете видеть его сообщения.
            </p>
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsBlockOpen(false)} className="px-4 py-2 border border-gray-600 text-gray-400 text-xs rounded-none">ОТМЕНА</button>
              <button onClick={handleBlock} disabled={actionLoading} className="px-4 py-2 border border-red-500 text-red-500 text-xs rounded-none disabled:opacity-50">
                {actionLoading ? 'БЛОКИРОВКА...' : 'ЗАБЛОКИРОВАТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}