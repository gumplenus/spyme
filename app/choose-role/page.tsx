'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = [
  { id: 'REPORTER', name: 'Репортер', icon: '📰', desc: 'Пишу новости и расследую' },
  { id: 'BUSINESSMAN', name: 'Бизнесмен', icon: '💼', desc: 'Торгую и инвестирую' },
  { id: 'POLITICIAN', name: 'Политик', icon: '🏛️', desc: 'Веду дипломатию' },
  { id: 'MILITARY', name: 'Военный', icon: '⚔️', desc: 'Защищаю страну' },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setEmail(user.email || null);

      // Проверяем, есть ли уже готовый профиль
      const { data: profile } = await supabase
        .from('User')
        .select('country, publicRole')
        .eq('id', user.id)
        .single();

      if (profile?.country && profile?.publicRole) {
        // Игрок уже зарегистрирован — отправляем в игру
        router.push('/game');
        return;
      }

      const pendingUsername = localStorage.getItem('pendingUsername');
      const pendingCountry = localStorage.getItem('pendingCountry');

      if (!pendingUsername || !pendingCountry) {
        // Незавершённая регистрация — отправляем на выбор страны
        router.push('/choose-country');
        return;
      }

      setUsername(pendingUsername);
      setCountry(pendingCountry);
      setLoading(false);
    };
    init();
  }, [router]);

  const selectRole = async (roleId: string) => {
    if (!userId || !email || !username || !country || saving) return;
    setSaving(true);

    const balance = roleId === 'BUSINESSMAN' ? 1000 : 500;

    const { error } = await supabase
      .from('User')
      .insert([
        {
          id: userId,
          email: email,
          username: username,
          country: country,
          publicRole: roleId,
          balance: balance,
          createdAt: new Date().toISOString(),
          isBanned: false,
        },
      ]);

    if (error) {
      console.error('Ошибка создания профиля:', error);
      alert('Не удалось создать профиль: ' + error.message);
      setSaving(false);
      return;
    }

    // Чистим localStorage
    localStorage.removeItem('pendingUsername');
    localStorage.removeItem('pendingUserId');
    localStorage.removeItem('pendingUserEmail');
    localStorage.removeItem('pendingCountry');

    router.push('/game');
    router.refresh();
  };

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Link
        href="/choose-country"
        className="absolute top-4 left-4 text-green-400 hover:underline text-sm"
      >
        ← Назад к выбору страны
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-2">SpyMe</h1>
      <p className="text-gray-400 mb-8">Выберите свою роль в игре</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role.id)}
            disabled={saving}
            className="w-full bg-gray-800 hover:bg-gray-700 transition-colors p-6 rounded-xl border border-gray-700 hover:border-green-400 text-left flex flex-col items-center disabled:opacity-50"
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