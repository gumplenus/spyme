'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/countries';

export default function ChooseCountryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, что игрок начал регистрацию (есть данные в localStorage)
    const pendingEmail = localStorage.getItem('pendingEmail');
    const pendingUsername = localStorage.getItem('pendingUsername');

    if (!pendingEmail || !pendingUsername) {
      // Регистрация не начата — отправляем на регистрацию
      router.push('/register');
      return;
    }

    setLoading(false);
  }, [router]);

  const selectCountry = (countryCode: string) => {
    localStorage.setItem('pendingCountry', countryCode);
    router.push('/choose-role');
  };

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Link
        href="/register"
        className="absolute top-4 left-4 text-green-400 hover:underline text-sm"
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