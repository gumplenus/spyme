'use client';

import { useEffect, useState } from 'react';
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
  const [contactUsername, setContactUsername] = useState('');
  const [isSpy, setIsSpy] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Проверяем, является ли текущий пользователь шпионом
const { data: myProfile } = await supabase
  .from('User')
  .select('isSpy')
  .eq('id', user.id)
  .single();
setIsSpy(myProfile?.isSpy === true);

      // 2. Загружаем имя собеседника
      const { data: profile } = await supabase
        .from('User')
        .select('username')
        .eq('id', params.userId)
        .single();
      setContactUsername(profile?.username || 'Неизвестный');

      // 3. Загружаем историю сообщений
      const { data: messagesData } = await supabase
        .from('Message')
        .select('*')
        .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
        .or(`senderId.eq.${params.userId},recipientId.eq.${params.userId}`)
        .order('createdAt', { ascending: true });

      setMessages(messagesData || []);
      setLoading(false);
    };

    fetchData();
  }, [router, params.userId]);

  // Realtime подписка на новые сообщения
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('chat-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Добавляем только сообщения, относящиеся к этому чату
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
    setSending(true);

    const { data: inserted, error } = await supabase
  .from('Message')
  .insert({
    senderId: currentUserId,
    recipientId: params.userId,
    content: newMessage.trim(),
    isSpyCode: false,
    isZoned: false,
  })
  .select()
  .single();

if (error) {
  console.error('Ошибка отправки:', error);
  alert('Не удалось отправить сообщение');
} else if (inserted) {
  // Проверяем кодовое слово
  await supabase.rpc('check_spy_code', {
    message_id: inserted.id,
    sender_id: currentUserId,
    message_text: newMessage.trim(),
  });

  // Начисляем прогресс, если отправитель — шпион, а получатель — его цель
  await supabase.rpc('increase_spy_progress', {
    sender: currentUserId,
    recipient: params.userId,
  });

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
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/chat" className="text-green-400 hover:underline">
          ←
        </Link>
        <h1 className="text-3xl font-bold text-green-400">💬 {contactUsername}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  isMine
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p>
  {msg.content}
  {isSpy && msg.isSpyCode && (
    <span 
      className="ml-2 text-yellow-300 text-xs cursor-help"
      title="Игрок использовал кодовое слово. Вероятно, он шпион."
    >
      ⚠️
    </span>
  )}
</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

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
  );
}