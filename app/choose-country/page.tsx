'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/countries';
import { supabase } from '@/lib/supabaseClient'; // <-- Добавили импорт supabase

export default function ChooseCountryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Проверяем, есть ли активная сессия (пользователь уже подтвердил почту)
      const { data: { session } } = await supabase.auth.getSession();

      // Проверяем данные в localStorage
      const pendingEmail = localStorage.getItem('pendingEmail');
      const pendingUsername = localStorage.getItem('pendingUsername');

      // Если нет ни сессии, ни данных в localStorage — отправляем на регистрацию
      if (!session && (!pendingEmail || !pendingUsername)) {
        router.push('/register');
        return;
      }

      // Если сессия есть, но данных нет в localStorage, попробуем достать из метаданных
      if (session && (!pendingEmail || !pendingUsername)) {
        const metaUsername = session.user.user_metadata?.pendingUsername;
        const metaEmail = session.user.email;
        
        if (metaUsername) localStorage.setItem('pendingUsername', metaUsername);
        if (metaEmail) localStorage.setItem('pendingEmail', metaEmail);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const selectCountry = (countryCode: string) => {
    localStorage.setItem('pendingCountry', countryCode);
    router.push('/choose-role');
  };

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)]">
      <Link
        href="/register"
        className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-4 text-green-400 hover:underline text-sm"
      >
        ← Назад к регистрации
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-2">SpyMe</h1>
      <p className="text-gray-400 mb-8">Выберите вашу страну</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            onClick={() => selectCountry(country.code)}
            className="bg-gray-800 hover:bg-gray-700 transition-colors p-6 rounded-xl border border-gray-700 hover:border-green-400 flex flex-col items-center"
          >
            <span className="text-3xl mb-2">{country.code}</span>
            <span className="text-white text-sm">{country.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}