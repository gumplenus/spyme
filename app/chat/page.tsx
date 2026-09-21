'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: messages } = await supabase
        .from('Message')
        .select('senderId, recipientId, content, createdAt')
        .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
        .order('createdAt', { ascending: false });

      if (messages) {
        const uniqueUsers = new Map();
        messages.forEach((msg: any) => {
          const contactId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
          if (!uniqueUsers.has(contactId)) {
            uniqueUsers.set(contactId, {
              userId: contactId,
              lastMessage: msg.content,
              lastMessageTime: msg.createdAt,
            });
          }
        });

        const userIds = Array.from(uniqueUsers.keys());
        const { data: profiles } = await supabase
          .from('User')
          .select('id, username')
          .in('id', userIds);

        const chatList = Array.from(uniqueUsers.values()).map((chat: any) => {
          const profile = profiles?.find((p: any) => p.id === chat.userId);
          return {
            ...chat,
            username: profile?.username || 'Неизвестный',
          };
        });

        setChats(chatList);
      }

      setLoading(false);
    };

    fetchChats();
  }, [router]);

  const openNewChatModal = async () => {
    if (!currentUserId) return;

    const { data: users } = await supabase
      .from('User')
      .select('id, username')
      .neq('id', currentUserId);

    setAllUsers(users || []);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-400">💬 Чаты</h1>
        <button
          onClick={openNewChatModal}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm"
        >
          ➕ Новое сообщение
        </button>
      </div>

      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      {chats.length === 0 ? (
        <p className="text-gray-400 mt-8">Нет сообщений. Нажмите «Новое сообщение», чтобы начать диалог.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {chats.map((chat) => (
            <Link
              key={chat.userId}
              href={`/chat/${chat.userId}`}
              className="block bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-green-400 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">{chat.username}</p>
                  <p className="text-gray-400 text-sm truncate max-w-xs">
                    {chat.lastMessage}
                  </p>
                </div>
                <p className="text-gray-500 text-xs">
                  {new Date(chat.lastMessageTime).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Выберите собеседника</h3>
            {allUsers.length === 0 ? (
              <p className="text-gray-400">Нет других игроков</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/chat/${u.id}`}
                    onClick={() => setIsModalOpen(false)}
                    className="block bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-white">{u.username || 'Неизвестный'}</p>
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}