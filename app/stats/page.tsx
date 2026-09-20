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

      // Если шпион — обновляем счётчик дней
      const { data: profileData } = await supabase
        .from('User')
        .select('id, username, country, publicRole, balance, createdAt, isSpy, spyActivated, spyActivatedAt, spySurvivalDays, spyMissionProgress, spyMissionCompleted, spyCodeWord, investigationsCount, evidencesTransferred, eliminationsCount, eliminationsFailed, totalTransferred, countryChanges')
        .eq('id', user.id)
        .single();

      // Обновляем счётчик выживания, если шпион
      if (profileData?.isSpy === true) {
        await supabase.rpc('update_spy_survival_days', {
          spy_id: profileData.id,
        });

        // Перезагружаем профиль с обновлённым счётчиком
        const { data: updatedProfile } = await supabase
          .from('User')
          .select('id, username, country, publicRole, balance, createdAt, isSpy, spyActivated, spyActivatedAt, spySurvivalDays, spyMissionProgress, spyMissionCompleted, spyCodeWord, investigationsCount, evidencesTransferred, eliminationsCount, eliminationsFailed, totalTransferred, countryChanges')
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
          ← Назад в игру
        </Link>
        <p className="text-gray-400">Не удалось загрузить статистику.</p>
      </div>
    );
  }

  // Считаем дней в игре
  const daysInGame = Math.floor(
    (new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Процент успеха военного
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
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-2 text-center">
        📊 Моя статистика
      </h1>
      <p className="text-center text-gray-400 mb-8">
        {profile.username} · {profile.country} · {profile.publicRole}
      </p>

      {/* ОБЩАЯ СТАТИСТИКА */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-green-400">{daysInGame}</p>
          <p className="text-gray-400 text-sm mt-1">Дней в игре</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-yellow-400">{profile.balance}</p>
          <p className="text-gray-400 text-sm mt-1">Баланс ВЛИ</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-purple-400">{profile.publicRole}</p>
          <p className="text-gray-400 text-sm mt-1">Роль</p>
        </div>
      </div>

      {/* СТАТИСТИКА ПО РОЛЯМ */}
      <div className="max-w-4xl mx-auto space-y-4">

        {/* РЕПОРТЕР */}
        {isReporter && (
          <div className="bg-gray-800 p-6 rounded-xl border border-green-600">
            <h2 className="text-2xl font-bold text-green-400 mb-4">📰 Как Репортер</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">{profile.investigationsCount || 0}</p>
                <p className="text-gray-400 text-sm mt-1">Расследований проведено</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">{profile.evidencesTransferred || 0}</p>
                <p className="text-gray-400 text-sm mt-1">Улик передано Военным</p>
              </div>
            </div>
          </div>
        )}

        {/* ВОЕННЫЙ */}
        {isMilitary && (
          <div className="bg-gray-800 p-6 rounded-xl border border-orange-600">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">⚔️ Как Военный</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-400">{profile.eliminationsCount || 0}</p>
                <p className="text-gray-400 text-sm mt-1">Успешных ликвидаций</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-400">{profile.eliminationsFailed || 0}</p>
                <p className="text-gray-400 text-sm mt-1">Ошибочных ликвидаций</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-400">{successRate}%</p>
                <p className="text-gray-400 text-sm mt-1">Процент успеха</p>
              </div>
            </div>
          </div>
        )}

        {/* БИЗНЕСМЕН */}
        {isBusinessman && (
          <div className="bg-gray-800 p-6 rounded-xl border border-yellow-600">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">💰 Как Бизнесмен</h2>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">{profile.totalTransferred || 0}</p>
              <p className="text-gray-400 text-sm mt-1">ВЛИ переведено другим игрокам</p>
            </div>
          </div>
        )}

        {/* ПОЛИТИК */}
        {isPolitician && (
          <div className="bg-gray-800 p-6 rounded-xl border border-cyan-600">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">🌍 Как Политик</h2>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">{profile.countryChanges || 0}</p>
              <p className="text-gray-400 text-sm mt-1">Смен страны</p>
            </div>
          </div>
        )}

        {/* ШПИОН — ТОЛЬКО ЕМУ */}
        {isSpy && (
          <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500">
            <h2 className="text-2xl font-bold text-purple-300 mb-4">🕵️ Как Шпион (скрыто)</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-900/50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-300">{profile.spySurvivalDays || 0}</p>
                <p className="text-gray-400 text-sm mt-1">Дней в роли шпиона</p>
              </div>
              <div className="bg-purple-900/50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-300">{profile.spyMissionProgress || 0}%</p>
                <p className="text-gray-400 text-sm mt-1">Прогресс миссии</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm text-center">
              Кодовое слово: <span className="text-purple-300 font-semibold">{profile.spyCodeWord || '—'}</span>
            </p>
            {profile.spyMissionCompleted && (
              <p className="text-green-400 text-sm text-center mt-2">
                🎉 Первая миссия выполнена
              </p>
            )}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-8 mb-4 flex justify-center">
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