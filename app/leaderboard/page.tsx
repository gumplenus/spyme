'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeaderboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
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
        .select('username, country, balance, eliminationsCount, investigationsCount, spySurvivalDays, countryChanges, totalTransferred')
        .eq('id', user.id)
        .single();

      setCurrentUser(profileData);

      const { data: leaderboardData, error } = await supabase.rpc('get_leaderboard');

      if (error) {
        console.error('Ошибка загрузки рейтинга:', error);
      } else {
        setLeaderboard(leaderboardData);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА_РЕЙТИНГА...</div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="min-h-screen bg-[#050807] text-gray-300 p-4 font-mono">
        <Link href="/game" className="text-[#39ff14] hover:text-white mb-4 inline-block transition-colors">
          ← НАЗАД_В_ИГРУ
        </Link>
        <p className="text-red-500 text-sm border border-red-500/50 p-3 bg-red-900/10">[ ОШИБКА: НЕ УДАЛОСЬ ЗАГРУЗИТЬ ДАННЫЕ ]</p>
      </div>
    );
  }

  const pluralize = (n: number, one: string, few: string, many: string) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  };

  const renderCategory = (
    title: string,
    icon: string,
    categoryKey: string,
    myValue: number,
    colorClass: string,
    valueLabel: [string, string, string]
  ) => {
    const items = leaderboard[categoryKey] || [];
    const myIndex = items.findIndex((item: any) => item.username === currentUser?.username);
    const isInTop = myIndex !== -1;

    return (
      <div className="border border-gray-800 bg-[#0a0f0d] p-4 mb-6">
        <h2 className={`text-xs tracking-widest uppercase mb-4 border-b border-gray-800 pb-2 ${colorClass}`}>
          &gt; {icon} {title}
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-600 text-xs italic">[ ДАННЫЕ ОТСУТСТВУЮТ ]</p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => {
              const isMe = item.username === currentUser?.username;
              const medal =
                index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `[${index + 1}]`;
              const word = pluralize(item.value, valueLabel[0], valueLabel[1], valueLabel[2]);

              return (
                <div
                  key={`${categoryKey}-${index}`}
                  className={`flex items-center justify-between gap-2 p-3 border transition-colors ${
                    isMe
                      ? 'bg-[#39ff14]/5 border-[#39ff14] text-[#39ff14]'
                      : 'bg-transparent border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm w-8 text-center shrink-0">
                      {medal}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isMe ? 'text-[#39ff14] font-semibold' : 'text-white'
                        }`}
                      >
                        @{item.username} {isMe && '[ ВЫ ]'}
                      </p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider truncate mt-0.5">
                        {item.country}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold text-right shrink-0 ${isMe ? 'text-[#39ff14]' : colorClass}`}>
                    {item.value} {word}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!isInTop && myValue > 0 && (
          <div className="mt-4 p-3 border border-[#39ff14]/50 bg-[#39ff14]/5">
            <p className="text-[#39ff14] text-xs">
              &gt; ВАШ_РЕЗУЛЬТАТ: <span className="font-bold">{myValue} {pluralize(myValue, valueLabel[0], valueLabel[1], valueLabel[2])}</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono pb-10">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center gap-3">
        <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ РЕЙТИНГ_ИГРОКОВ ]</h1>
      </header>

      <div className="pt-20 px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          {renderCategory(
            'САМЫЙ_БОГАТЫЙ',
            '💰',
            'richest',
            currentUser?.balance || 0,
            'text-yellow-400',
            ['ВЛИ', 'ВЛИ', 'ВЛИ']
          )}

          {renderCategory(
            'ЛУЧШИЙ_ВОЕННЫЙ',
            '⚔️',
            'best_military',
            currentUser?.eliminationsCount || 0,
            'text-orange-400',
            ['ликвидация', 'ликвидации', 'ликвидаций']
          )}

          {renderCategory(
            'ЛУЧШИЙ_РЕПОРТЕР',
            '📰',
            'best_reporter',
            currentUser?.investigationsCount || 0,
            'text-[#39ff14]',
            ['расследование', 'расследования', 'расследований']
          )}

          {renderCategory(
            'ЛУЧШИЙ_ШПИОН',
            '🕵️',
            'best_spy',
            currentUser?.spySurvivalDays || 0,
            'text-purple-400',
            ['день', 'дня', 'дней']
          )}

          {renderCategory(
            'САМЫЙ_МОБИЛЬНЫЙ',
            '🌍',
            'most_mobile',
            currentUser?.countryChanges || 0,
            'text-cyan-400',
            ['смена', 'смены', 'смен']
          )}

          {renderCategory(
            'САМЫЙ_ЩЕДРЫЙ',
            '💸',
            'most_generous',
            currentUser?.totalTransferred || 0,
            'text-pink-400',
            ['ВЛИ', 'ВЛИ', 'ВЛИ']
          )}
        </div>

        <div className="max-w-3xl mx-auto mt-8 mb-4 flex justify-center">
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