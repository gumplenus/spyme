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
          .in('id', userIds)
          .eq('isBanned', false)
          .is('deletedAt', null);

        const chatList = Array.from(uniqueUsers.values())
          .map((chat: any) => {
            const profile = profiles?.find((p: any) => p.id === chat.userId);
            if (!profile) return null;
            return {
              ...chat,
              username: profile.username || 'Неизвестный',
              country: profile.country || null,
              publicRole: profile.publicRole || null,
              avatarUrl: profile.avatarUrl || null,
            };
          })
          .filter(Boolean);

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
      .neq('id', currentUserId)
      .eq('isBanned', false)
      .is('deletedAt', null);

    setAllUsers(users || []);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ДЕШИФРОВКА_КАНАЛОВ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
            ←
          </Link>
          <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ КАНАЛЫ_СВЯЗИ ]</h1>
        </div>
        <button
          onClick={openNewChatModal}
          className="px-3 py-1.5 border border-[#39ff14]/50 text-[#39ff14] hover:bg-[#39ff14]/10 hover:border-[#39ff14] rounded-none text-xs shrink-0 transition-colors uppercase tracking-wider"
        >
          + НОВЫЙ_КАНАЛ
        </button>
      </header>

      <div className="pt-20 px-4 pb-4">
        {chats.length === 0 ? (
          <p className="text-gray-600 text-sm italic mt-8">[ Данные не найдены. Инициируйте новый канал связи. ]</p>
        ) : (
          <div className="space-y-3 mt-4">
            {chats.map((chat) => (
              <div
                key={chat.userId}
                className="relative border border-gray-800 bg-[#0a0f0d] hover:border-[#39ff14]/50 transition-colors group"
              >
                <Link href={`/chat/${chat.userId}`} className="block p-3 pr-12">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                      {chat.avatarUrl ? (
                        <img src={chat.avatarUrl} alt={chat.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">USR</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2 border-b border-gray-800 pb-1 mb-1">
                        <p className="text-[#39ff14] text-sm font-medium truncate">@{chat.username}</p>
                        <p className="text-gray-600 text-[10px] whitespace-nowrap shrink-0">
                          {new Date(chat.lastMessageTime).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                        {chat.publicRole && chat.country ? `${chat.publicRole} // ${chat.country}` : chat.country || chat.publicRole || ''}
                      </p>
                      <p className="text-gray-400 text-sm truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => openDeleteChatModal(chat)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-gray-600 hover:text-red-500 transition-colors text-lg"
                  title="Удалить чат"
                >
                  [x]
                </button>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="border border-[#39ff14] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
              <div className="flex items-center justify-between p-4 border-b border-[#39ff14]/30 shrink-0">
                <h3 className="text-sm text-[#39ff14] tracking-widest">&gt; ВЫБОР_АБОНЕНТА</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="p-4 overflow-y-auto">
                <PlayerSelector
                  players={allUsers}
                  getHref={(p) => `/chat/${p.id}`}
                  onSelect={() => setIsModalOpen(false)}
                  emptyText="Нет доступных абонентов"
                />
              </div>
            </div>
          </div>
        )}

        {deleteChatTarget && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="border border-red-500 p-6 w-full max-w-md bg-[#050807] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <h3 className="text-sm text-red-500 tracking-widest mb-3">&gt; УДАЛИТЬ_КАНАЛ?</h3>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Канал связи с <span className="text-white font-semibold">{deleteChatTarget.username || 'Неизвестный'}</span> будет удалён только на вашем устройстве. У собеседника переписка останется.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteChatTarget(null)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white text-xs rounded-none transition-colors">
                  ОТМЕНА
                </button>
                <button onClick={confirmDeleteChat} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs rounded-none transition-colors">
                  УДАЛИТЬ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}