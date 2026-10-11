'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerSelector, { Player } from '@/components/PlayerSelector';

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteChatTarget, setDeleteChatTarget] = useState<any>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: allMessages } = await supabase
        .from('Message')
        .select('senderId, recipientId, content, createdAt, deletedForSender, deletedForRecipient')
        .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
        .order('createdAt', { ascending: false });

      const messages = (allMessages || []).filter((m: any) => {
        if (m.senderId === user.id && m.deletedForSender) return false;
        if (m.recipientId === user.id && m.deletedForRecipient) return false;
        return true;
      });

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
          .select('id, username, country, publicRole, avatarUrl')
          .in('id', userIds);

        const chatList = Array.from(uniqueUsers.values()).map((chat: any) => {
          const profile = profiles?.find((p: any) => p.id === chat.userId);
          return {
            ...chat,
            username: profile?.username || 'Неизвестный',
            country: profile?.country || null,
            publicRole: profile?.publicRole || null,
            avatarUrl: profile?.avatarUrl || null,
          };
        });

        setChats(chatList);
      }

      setLoading(false);
    };

    fetchChats();
  }, [router]);

    const openDeleteChatModal = (chat: any) => {
    setDeleteChatTarget(chat);
  };

  const confirmDeleteChat = async () => {
    if (!currentUserId || !deleteChatTarget) return;

    const contactId = deleteChatTarget.userId;
    setDeleteChatTarget(null);

    await supabase
      .from('Message')
      .update({ deletedForSender: true })
      .eq('senderId', currentUserId)
      .eq('recipientId', contactId);

    await supabase
      .from('Message')
      .update({ deletedForRecipient: true })
      .eq('recipientId', currentUserId)
      .eq('senderId', contactId);

    setChats((prev) => prev.filter((c) => c.userId !== contactId));
  };

  const openNewChatModal = async () => {
    if (!currentUserId) return;

    const { data: users } = await supabase
      .from('User')
      .select('id, username, country, publicRole, avatarUrl')
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
            <div
              key={chat.userId}
              className="relative bg-gray-800 rounded-xl border border-gray-700 hover:border-green-400 transition-colors"
            >
              <Link
                href={`/chat/${chat.userId}`}
                className="block p-4 pr-12"
              >
                <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                  {chat.avatarUrl ? (
                    <img
                      src={chat.avatarUrl}
                      alt={chat.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-white font-semibold truncate">{chat.username}</p>
                    <p className="text-gray-500 text-xs whitespace-nowrap shrink-0">
                      {new Date(chat.lastMessageTime).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-500 text-xs truncate">
                    {chat.publicRole && chat.country
                      ? `${chat.publicRole} · ${chat.country}`
                      : chat.country || chat.publicRole || ''}
                  </p>
                  <p className="text-gray-400 text-sm truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
              </Link>
              <button
                onClick={() => openDeleteChatModal(chat)}
                className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 text-lg"
                title="Удалить чат"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
            <PlayerSelector
              title="Выберите собеседника"
              players={allUsers}
              getHref={(p) => `/chat/${p.id}`}
              onSelect={() => setIsModalOpen(false)}
              emptyText="Нет игроков по заданным фильтрам"
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

            {deleteChatTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-red-700">
            <h3 className="text-xl font-semibold text-white mb-3">
              🗑 Удалить чат?
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Чат с{' '}
              <span className="text-white font-semibold">
                {deleteChatTarget.username || 'Неизвестный'}
              </span>{' '}
              будет удалён только у вас. У собеседника переписка останется.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteChatTarget(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}