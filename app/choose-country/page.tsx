'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'US', name: 'США' },
  { code: 'RU', name: 'Россия' },
  { code: 'GB', name: 'Великобритания' },
  { code: 'DE', name: 'Германия' },
  { code: 'IL', name: 'Израиль' },
];

export default function ChooseCountryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [router]);

  const selectCountry = async (countryCode: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('User')
      .update({ country: countryCode })
      .eq('id', user?.id);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/choose-role');
    }
  };

  if (loading) return <div className="text-white p-8 text-center">Загрузка...</div>;
  if (error) return <div className="text-red-400 p-8 text-center">Ошибка: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-green-400 mb-2">SpyMe</h1>
      <p className="text-gray-400 mb-8">Выберите вашу страну</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
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