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

      // Загружаем свой профиль
      const { data: profileData } = await supabase
        .from('User')
        .select('username, country, balance, eliminationsCount, investigationsCount, spySurvivalDays, countryChanges, totalTransferred')
        .eq('id', user.id)
        .single();

      setCurrentUser(profileData);

      // Загружаем рейтинг
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
          ← Назад в игру
        </Link>
        <p className="text-gray-400">Не удалось загрузить рейтинг.</p>
      </div>
    );
  }

  // Функция для отображения блока рейтинга
  const renderCategory = (
    title: string,
    icon: string,
    categoryKey: string,
    myValue: number,
    color: string,
    valueLabel: string
  ) => {
    const items = leaderboard[categoryKey] || [];

    // Проверяем, есть ли я в топе
    const myIndex = items.findIndex((item: any) => item.username === currentUser?.username);
    const isInTop = myIndex !== -1;

    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
        <h2 className={`text-2xl font-bold ${color} mb-4`}>
          {icon} {title}
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">Пока нет данных</p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => {
              const isMe = item.username === currentUser?.username;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

              return (
                <div
                  key={`${categoryKey}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isMe
                      ? 'bg-green-900/40 border border-green-500'
                      : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{medal}</span>
                    <div>
                      <p className={`font-semibold ${isMe ? 'text-green-300' : 'text-white'}`}>
                        {item.username} {isMe && '(вы)'}
                      </p>
                      <p className="text-gray-400 text-xs">{item.country}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${color}`}>
                    {item.value} {valueLabel}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Мой результат, если я не в топе */}
        {!isInTop && myValue > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-900/40 border border-green-500">
            <p className="text-green-300 text-sm font-semibold">
              Ваш результат: <span className="font-bold">{myValue} {valueLabel}</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-8 text-center">
        🏆 Рейтинг игроков
      </h1>

      <div className="max-w-3xl mx-auto">
        {renderCategory(
          'Самый богатый',
          '💰',
          'richest',
          currentUser?.balance || 0,
          'text-yellow-400',
          'ВЛИ'
        )}

        {renderCategory(
          'Лучший Военный',
          '⚔️',
          'best_military',
          currentUser?.eliminationsCount || 0,
          'text-orange-400',
          'ликвидаций'
        )}

        {renderCategory(
          'Лучший Репортер',
          '📰',
          'best_reporter',
          currentUser?.investigationsCount || 0,
          'text-green-400',
          'расследований'
        )}

        {renderCategory(
          'Лучший Шпион',
          '🕵️',
          'best_spy',
          currentUser?.spySurvivalDays || 0,
          'text-purple-400',
          'дней'
        )}

        {renderCategory(
          'Самый мобильный',
          '🌍',
          'most_mobile',
          currentUser?.countryChanges || 0,
          'text-cyan-400',
          'смен'
        )}

        {renderCategory(
          'Самый щедрый',
          '💸',
          'most_generous',
          currentUser?.totalTransferred || 0,
          'text-pink-400',
          'ВЛИ'
        )}
      </div>

      <div className="max-w-3xl mx-auto mt-8 mb-4 flex justify-center">
        <Link
          href="/game"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
        >
          ← Назад в игру
        </Link>
      </div>
    </div>
  );
}