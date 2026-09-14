'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EvidencePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminating, setEliminating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('User')
        .select('username, country, publicRole')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      if (profileData?.publicRole !== 'MILITARY') {
        router.push('/game');
        return;
      }

      const { data: evidencesData, error } = await supabase
        .rpc('get_evidences_for_military', {
          military_country: profileData.country,
        });

      if (error) {
        console.error('Ошибка загрузки улик:', error);
      }

      setEvidences(evidencesData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const eliminateTarget = async (evidence: any) => {
    setEliminating(evidence.id);
    setMessage(null);

    // Проверяем, является ли цель шпионом
    const { data: target, error: targetError } = await supabase
      .from('User')
      .select('isSpy, username')
      .eq('id', evidence.target_id)
      .single();

    if (targetError || !target) {
      setMessage({ text: 'Ошибка: цель не найдена', type: 'error' });
      setEliminating(null);
      return;
    }

    if (target.isSpy === true) {
      // Успешная ликвидация
      const { error: banError } = await supabase
        .from('User')
        .update({
          isBanned: true,
          banReason: 'Ликвидирован Военным за шпионаж',
        })
        .eq('id', evidence.target_id);

      if (banError) {
        setMessage({ text: 'Ошибка ликвидации: ' + banError.message, type: 'error' });
      } else {
        setMessage({
          text: `✅ ${target.username} ликвидирован! Он был шпионом.`,
          type: 'success',
        });
        // Убираем улику из списка
        setEvidences((prev) => prev.filter((e) => e.id !== evidence.id));
      }
    } else {
      // Цель не шпион — штраф
      setMessage({
        text: `❌ ${target.username} не был шпионом. Военный получает штраф.`,
        type: 'error',
      });
    }

    setEliminating(null);
    // Скрываем сообщение через 5 секунд
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold text-green-400 mb-6">📂 Входящие улики</h1>

      <p className="text-gray-400 mb-4">
        Ваша страна: <span className="text-white">{profile?.country}</span>
      </p>

      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/40 border-green-500 text-green-300'
              : 'bg-red-900/40 border-red-500 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {evidences.length === 0 ? (
        <p className="text-gray-400 mt-8">У вас пока нет улик.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {evidences.map((e) => (
            <div key={e.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-white font-semibold">
                🎯 {e.target_username || 'Неизвестный'}
              </p>
              <p className="text-gray-400 text-sm">
                Страна: {e.target_country} · Роль: {e.target_role}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                От: {e.reporter_username || 'Неизвестный'} · {new Date(e.created_at).toLocaleString()}
              </p>
              <p className="text-gray-300 text-sm mt-2 bg-gray-900 p-2 rounded">
                {e.content}
              </p>
              <p className="text-orange-400 text-xs mt-2">
                Сила улики: {e.strength}%
              </p>
              <button
                onClick={() => eliminateTarget(e)}
                disabled={eliminating === e.id}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm disabled:opacity-50"
              >
                {eliminating === e.id ? 'Ликвидация...' : '⚔️ Ликвидировать'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}