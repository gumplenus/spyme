// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Проверяем, есть ли у пользователя страна и роль
      const { data: profile } = await supabase
        .from('User')
        .select('country, publicRole')
        .eq('id', data.user.id)
        .single();

      if (profile?.country && profile?.publicRole) {
        // Если страна и роль уже выбраны — сразу в игру
        router.push('/game');
      } else {
        // Если нет — отправляем на выбор страны
        router.push('/choose-country');
      }
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="agent@spyme.ru"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="••••••••"
          required
        />
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
      <p className="text-gray-400 text-sm mt-4 text-center">
        Нет аккаунта? <Link href="/register" className="text-green-400 hover:underline">Зарегистрируйтесь</Link>
      </p>
    </form>
  );
}