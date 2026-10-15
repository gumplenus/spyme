'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/countries';

export default function ChooseCountryPage() {
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

      setUserId(user.id);
      setLoading(false);
    };
    getUser();
  }, [router]);

  const selectCountry = (countryCode: string) => {
    localStorage.setItem('pendingCountry', countryCode);
    router.push('/choose-role');
  };

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
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