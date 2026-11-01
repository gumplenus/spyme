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
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ПРОВЕРКА_СТАТУСА...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] font-mono">
      <div className="border border-red-500/50 p-8 max-w-md w-full text-center bg-[#0a0f0d] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
        <div className="text-4xl mb-4 text-red-500">[ X ]</div>
        <h1 className="text-sm font-bold text-red-500 mb-4 tracking-widest uppercase">
          АККАУНТ_ЛИКВИДИРОВАН
        </h1>
        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
          ИГРОК: <span className="text-white font-semibold">{profile?.username || 'Неизвестный'}</span>
        </p>
        <p className="text-red-400/80 text-xs mb-6 border border-red-500/30 p-2 bg-red-900/10">
          &gt; {profile?.banReason || 'Ликвидирован Военным за шпионаж'}
        </p>
        <p className="text-gray-600 text-[10px] mb-6 uppercase tracking-wider leading-relaxed">
          Вы больше не можете участвовать в текущем игровом цикле. Дождитесь его окончания, чтобы начать заново.
        </p>
        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs font-semibold tracking-wider rounded-none transition-colors"
        >
          ВЫЙТИ_ИЗ_СИСТЕМЫ
        </button>
      </div>
    </div>
  );
}