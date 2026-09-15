'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResultsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.rpc('get_cycle_statistics');

    if (error) {
      console.error('Ошибка загрузки статистики:', error);
      setMessage('Ошибка: ' + error.message);
    } else {
      setStats(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const finishCycle = async () => {
    setFinishing(true);
    setMessage(null);

    const { data, error } = await supabase.rpc('finish_cycle');

    if (error) {
      setMessage('Ошибка: ' + error.message);
    } else {
      setMessage('✅ Цикл завершён! Создан новый цикл.');
      setTimeout(() => {
        fetchStats();
        setMessage(null);
      }, 3000);
    }
    setFinishing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold text-green-400 mb-6">📊 Отчёт цикла</h1>
        <p className="text-gray-400">Не удалось загрузить статистику.</p>
        <Link href="/game" className="text-green-400 hover:underline mt-4 inline-block">
          ← Назад в игру
        </Link>
      </div>
    );
  }

  const startDate = stats.start_date ? new Date(stats.start_date).toLocaleDateString() : '—';
  const endDate = stats.end_date ? new Date(stats.end_date).toLocaleDateString() : '—';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold text-green-400 mb-2 text-center">
        📊 Отчёт цикла #{stats.cycle_id}
      </h1>
      <p className="text-center text-gray-400 mb-8">
        {startDate} — {endDate}
      </p>

      {message && (
        <div className="mb-6 p-3 rounded-lg border bg-green-900/40 border-green-500 text-green-300 text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.total_users}</p>
          <p className="text-gray-400 text-sm mt-1">Игроков всего</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.total_spies}</p>
          <p className="text-gray-400 text-sm mt-1">Шпионов</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.spies_completed}</p>
          <p className="text-gray-400 text-sm mt-1">Выполнили миссию</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.spies_eliminated}</p>
          <p className="text-gray-400 text-sm mt-1">Ликвидировано</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-yellow-600">
          <h2 className="text-xl font-semibold text-yellow-400 mb-3">🏆 Лучший Репортер</h2>
          <p className="text-white text-2xl font-bold">
            {stats.best_reporter?.username || 'Нет данных'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Страна: {stats.best_reporter?.country || '—'}
          </p>
          <p className="text-gray-400 text-sm">
            Расследований: {stats.best_reporter?.count || 0}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-orange-600">
          <h2 className="text-xl font-semibold text-orange-400 mb-3">⚔️ Лучший Военный</h2>
          <p className="text-white text-2xl font-bold">
            {stats.best_military?.username || 'Нет данных'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Страна: {stats.best_military?.country || '—'}
          </p>
          <p className="text-gray-400 text-sm">
            Улик обработано: {stats.best_military?.count || 0}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
        <Link
          href="/game"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
        >
          ← Назад в игру
        </Link>
        <button
          onClick={finishCycle}
          disabled={finishing}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold disabled:opacity-50"
        >
          {finishing ? 'Завершение...' : '🔄 Завершить цикл'}
        </button>
      </div>
    </div>
  );
}