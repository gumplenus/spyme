'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StatsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('User')
        .select('id, username, country, publicRole, balance, createdAt, isSpy, spyActivated, spyActivatedAt, spySurvivalDays, investigationsCount, evidencesTransferred, eliminationsCount, eliminationsFailed, totalTransferred, countryChanges')
        .eq('id', user.id)
        .single();

      if (profileData?.isSpy === true) {
        await supabase.rpc('update_spy_survival_days', {
          spy_id: profileData.id,
        });

        const { data: updatedProfile } = await supabase
          .from('User')
          .select('id, username, country, publicRole, balance, createdAt, isSpy, spyActivated, spyActivatedAt, spySurvivalDays, investigationsCount, evidencesTransferred, eliminationsCount, eliminationsFailed, totalTransferred, countryChanges')
          .eq('id', user.id)
          .single();

        setProfile(updatedProfile);
      } else {
        setProfile(profileData);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА_ДОСЬЕ...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050807] text-gray-300 p-4 font-mono">
        <Link href="/game" className="text-[#39ff14] hover:text-white mb-4 inline-block transition-colors">
          ← НАЗАД_В_ИГРУ
        </Link>
        <p className="text-red-500 text-sm border border-red-500/50 p-3 bg-red-900/10">[ ОШИБКА: НЕ УДАЛОСЬ ЗАГРУЗИТЬ СТАТИСТИКУ ]</p>
      </div>
    );
  }

  const daysInGame = Math.floor(
    (new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalEliminations = profile.eliminationsCount + profile.eliminationsFailed;
  const successRate = totalEliminations > 0
    ? Math.round((profile.eliminationsCount / totalEliminations) * 100)
    : 0;

  const isReporter = profile.publicRole === 'REPORTER';
  const isMilitary = profile.publicRole === 'MILITARY';
  const isBusinessman = profile.publicRole === 'BUSINESSMAN';
  const isPolitician = profile.publicRole === 'POLITICIAN';
  const isSpy = profile.isSpy === true;

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono pb-10">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center gap-3">
        <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ СТАТИСТИКА_ПРОФИЛЯ ]</h1>
      </header>

      <div className="pt-20 px-4 pb-4 max-w-4xl mx-auto">
        <div className="mb-6 border-b border-gray-800 pb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            ПОЛЬЗОВАТЕЛЬ: <span className="text-white">{profile.username}</span> {'//'} 
            ЛОКАЦИЯ: <span className="text-white">{profile.country}</span> {'//'} 
            ДОПУСК: <span className="text-white">{profile.publicRole}</span>
          </p>
        </div>

        {/* ОБЩАЯ СТАТИСТИКА */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
          <div className="border border-gray-800 bg-[#0a0f0d] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">ДНЕЙ_В_СЕТИ</p>
            <p className="text-2xl font-bold text-[#39ff14]">{daysInGame}</p>
          </div>
          <div className="border border-gray-800 bg-[#0a0f0d] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">БАЛАНС_ВЛИ</p>
            <p className="text-2xl font-bold text-yellow-400">{profile.balance}</p>
          </div>
          <div className="border border-gray-800 bg-[#0a0f0d] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">ТЕКУЩИЙ_ДОПУСК</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{profile.publicRole}</p>
          </div>
        </div>

        {/* СТАТИСТИКА ПО РОЛЯМ */}
        <div className="space-y-4">
          
          {/* РЕПОРТЕР */}
          {isReporter && (
            <div className="border border-[#39ff14]/30 bg-[#0a0f0d] p-4">
              <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-gray-800 pb-2">&gt; РАССЛЕДОВАНИЯ (РЕПОРТЕР)</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-gray-700 p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">РАССЛЕДОВАНИЙ</p>
                  <p className="text-xl text-white mt-1">{profile.investigationsCount || 0}</p>
                </div>
                <div className="border border-gray-700 p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">УЛИК_ПЕРЕДАНО</p>
                  <p className="text-xl text-white mt-1">{profile.evidencesTransferred || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* ВОЕННЫЙ */}
          {isMilitary && (
            <div className="border border-orange-500/50 bg-[#0a0f0d] p-4">
              <h2 className="text-xs tracking-widest text-orange-400 mb-4 border-b border-gray-800 pb-2">&gt; ЛИКВИДАЦИИ (ВОЕННЫЙ)</h2>
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-gray-700 p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">УСПЕШНЫХ</p>
                  <p className="text-xl text-[#39ff14] mt-1">{profile.eliminationsCount || 0}</p>
                </div>
                <div className="border border-gray-700 p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">ОШИБОЧНЫХ</p>
                  <p className="text-xl text-red-500 mt-1">{profile.eliminationsFailed || 0}</p>
                </div>
                <div className="border border-gray-700 p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">УСПЕХ_%</p>
                  <p className="text-xl text-yellow-400 mt-1">{successRate}%</p>
                </div>
              </div>
            </div>
          )}

          {/* БИЗНЕСМЕН */}
          {isBusinessman && (
            <div className="border border-yellow-500/50 bg-[#0a0f0d] p-4">
              <h2 className="text-xs tracking-widest text-yellow-500 mb-4 border-b border-gray-800 pb-2">&gt; ПЕРЕВОДЫ ВЛИ (БИЗНЕСМЕН)</h2>
              <div className="border border-gray-700 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase">ПЕРЕВЕДЕНО_ВЛИ</p>
                <p className="text-xl text-white mt-1">{profile.totalTransferred || 0}</p>
              </div>
            </div>
          )}

          {/* ПОЛИТИК */}
          {isPolitician && (
            <div className="border border-cyan-500/50 bg-[#0a0f0d] p-4">
              <h2 className="text-xs tracking-widest text-cyan-400 mb-4 border-b border-gray-800 pb-2">&gt; СМЕНА СТРАНЫ (ПОЛИТИК)</h2>
              <div className="border border-gray-700 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase">СМЕН_ЛОКАЦИИ</p>
                <p className="text-xl text-white mt-1">{profile.countryChanges || 0}</p>
              </div>
            </div>
          )}

          {/* ШПИОН */}
          {isSpy && (
            <div className="border border-purple-500/50 bg-purple-900/10 p-4">
              <h2 className="text-xs tracking-widest text-purple-400 mb-4 border-b border-gray-800 pb-2">&gt; ВЫЖИВАНИЕ (ШПИОН)</h2>
              <div className="border border-gray-700 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase">ДНЕЙ_В_РОЛИ</p>
                <p className="text-xl text-purple-300 mt-1">{profile.spySurvivalDays || 0}</p>
              </div>
            </div>
          )}

        </div>

        <div className="mt-8 mb-4 flex justify-center">
          <Link
            href="/game"
            className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-[#39ff14] hover:border-[#39ff14] rounded-none text-xs font-semibold tracking-wider transition-colors"
          >
            &lt; НАЗАД_В_ИГРУ
          </Link>
        </div>
      </div>
    </div>
  );
}