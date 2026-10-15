'use client';

import { useEffect, useState } from 'react';
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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const pendingUsername = localStorage.getItem('pendingUsername');
    const pendingEmail = localStorage.getItem('pendingEmail');
    const pendingPassword = localStorage.getItem('pendingPassword');
    const pendingCountry = localStorage.getItem('pendingCountry');

    if (!pendingUsername || !pendingEmail || !pendingPassword || !pendingCountry) {
      router.push('/register');
      return;
    }

    setUsername(pendingUsername);
    setEmail(pendingEmail);
    setPassword(pendingPassword);
    setCountry(pendingCountry);
    setLoading(false);
  }, [router]);

  const selectRole = async (roleId: string) => {
    if (saving) return;
    setSaving(true);

    // 1. Создаём auth-пользователя
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      alert('Ошибка регистрации: ' + signUpError.message);
      setSaving(false);
      return;
    }

    if (!signUpData.user) {
      alert('Не удалось создать аккаунт');
      setSaving(false);
      return;
    }

    // 2. Создаём профиль в User
    const balance = roleId === 'BUSINESSMAN' ? 1000 : 500;

    const { error: insertError } = await supabase
      .from('User')
      .insert([
        {
          id: signUpData.user.id,
          email: signUpData.user.email,
          username: username,
          country: country,
          publicRole: roleId,
          balance: balance,
          createdAt: new Date().toISOString(),
          isBanned: false,
        },
      ]);

    if (insertError) {
      console.error('Ошибка создания профиля:', insertError);
      alert('Не удалось создать профиль: ' + insertError.message);
      setSaving(false);
      return;
    }

    // 3. Чистим localStorage
    localStorage.removeItem('pendingUsername');
    localStorage.removeItem('pendingEmail');
    localStorage.removeItem('pendingPassword');
    localStorage.removeItem('pendingCountry');

    // 4. В игру
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
      {saving && (
        <p className="text-green-400 mt-6">Создаём аккаунт...</p>
      )}
    </div>
  );
}