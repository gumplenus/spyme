'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const ROLES = [
  { id: 'REPORTER', name: 'Репортер', icon: '📰', desc: 'Пишу новости и расследую' },
  { id: 'BUSINESSMAN', name: 'Бизнесмен', icon: '💼', desc: 'Торгую и инвестирую' },
  { id: 'POLITICIAN', name: 'Политик', icon: '🏛️', desc: 'Веду дипломатию' },
  { id: 'MILITARY', name: 'Военный', icon: '⚔️', desc: 'Защищаю страну' },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    getUser();
  }, [router]);

  const selectRole = async (roleId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('User')
      .update({ publicRole: roleId })
      .eq('id', userId);

    if (error) {
      console.error('Ошибка сохранения роли:', error);
    } else {
      router.push('/game');
    }
  };

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-green-400 mb-2">SpyMe</h1>
      <p className="text-gray-400 mb-8">Выберите свою роль в игре</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role.id)}
            className="w-full bg-gray-800 hover:bg-gray-700 transition-colors p-6 rounded-xl border border-gray-700 hover:border-green-400 text-left flex flex-col items-center"
          >
            <span className="text-4xl mb-2">{role.icon}</span>
            <span className="text-lg font-semibold text-white">{role.name}</span>
            <span className="text-sm text-gray-400">{role.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}