'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('User')
        .select('username, isBanned, banReason')
        .eq('id', user.id)
        .single();

      if (profileData && !profileData.isBanned) {
        router.push('/game');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-red-700 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Аккаунт ликвидирован
        </h1>
        <p className="text-gray-300 mb-2">
          Игрок: <span className="text-white font-semibold">{profile?.username || 'Неизвестный'}</span>
        </p>
        <p className="text-gray-400 text-sm mb-6">
          {profile?.banReason || 'Ликвидирован Военным за шпионаж'}
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Вы больше не можете участвовать в текущем игровом цикле.
          Дождитесь его окончания, чтобы начать заново.
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}