'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/countries';
import { supabase } from '@/lib/supabaseClient';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА_СЕКТОРА...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] font-mono">
      <Link
        href="/register"
        className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-4 text-[#39ff14] hover:text-white text-xs tracking-wider transition-colors"
      >
        ← НАЗАД_К_РЕГИСТРАЦИИ
      </Link>

      <h1 className="text-2xl font-bold text-[#39ff14] mb-2 tracking-widest">[ SPY_ME ]</h1>
      <p className="text-gray-500 mb-8 text-xs uppercase tracking-wider">Выберите вашу локацию</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            onClick={() => selectCountry(country.code)}
            className="bg-[#0a0f0d] hover:bg-[#39ff14]/10 transition-colors p-4 border border-gray-800 hover:border-[#39ff14] flex flex-col items-center group rounded-none"
          >
            <span className="text-2xl font-bold text-gray-600 group-hover:text-[#39ff14] mb-1 transition-colors">{country.code}</span>
            <span className="text-gray-400 group-hover:text-white text-xs text-center transition-colors">{country.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}