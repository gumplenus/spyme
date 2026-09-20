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
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('User')
        .select('id, username, country, publicRole, militaryBlockedUntil')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      if (profileData?.publicRole !== 'MILITARY') {
        router.push('/game');
        return;
      }

      if (profileData.militaryBlockedUntil) {
        const blocked = new Date(profileData.militaryBlockedUntil);
        if (blocked > new Date()) {
          setBlockedUntil(blocked);
          setLoading(false);
          return;
        }
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

  const incrementCounter = async (counterName: 'eliminationsCount' | 'eliminationsFailed') => {
    if (!profile?.id) return;

    const { data: currentProfile } = await supabase
      .from('User')
      .select(counterName)
      .eq('id', profile.id)
      .single();

    if (currentProfile) {
      const currentValue = (currentProfile as any)[counterName] || 0;
      await supabase
        .from('User')
        .update({ [counterName]: currentValue + 1 })
        .eq('id', profile.id);
    }
  };

  const eliminateTarget = async (evidence: any) => {
    setEliminating(evidence.id);
    setMessage(null);

    const { data: target, error: targetError } = await supabase
      .from('User')
      .select('isSpy, isBanned, username, publicRole, lastCountryChange')
      .eq('id', evidence.target_id)
      .single();

    if (targetError || !target) {
      setMessage({ text: 'Ошибка: цель не найдена', type: 'error' });
      setEliminating(null);
      return;
    }

    // Если цель уже забанена — удаляем все улики на неё, не считаем ликвидацию
    if (target.isBanned === true) {
      await supabase
        .from('Evidence')
        .delete()
        .eq('targetId', evidence.target_id);

      setMessage({
        text: `ℹ️ ${target.username} уже был ликвидирован ранее. Улики удалены.`,
        type: 'error',
      });
      setEvidences((prev) => prev.filter((e) => e.target_id !== evidence.target_id));
      setEliminating(null);
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    // Проверка дипломатического иммунитета
    if (target.publicRole === 'POLITICIAN' && target.lastCountryChange) {
      const lastChange = new Date(target.lastCountryChange);
      const now = new Date();
      const hoursSince = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 48) {
        const remaining = Math.ceil(48 - hoursSince);
        setMessage({
          text: `🛡️ ${target.username} под дипломатическим иммунитетом. Ликвидация невозможна. Подождите ${remaining} ч.`,
          type: 'error',
        });
        setEliminating(null);
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    }

    // Проверка на шпиона
    if (target.isSpy === true) {
      const { data: { user: militaryUser } } = await supabase.auth.getUser();

      const { error: banError } = await supabase
        .from('User')
        .update({
          isBanned: true,
          banReason: 'Ликвидирован Военным за шпионаж',
          eliminatedBy: militaryUser?.id,
        })
        .eq('id', evidence.target_id);

      if (banError) {
        setMessage({ text: 'Ошибка ликвидации: ' + banError.message, type: 'error' });
      } else {
        // Удаляем ВСЕ улики на этого шпиона
        await supabase
          .from('Evidence')
          .delete()
          .eq('targetId', evidence.target_id);

        await incrementCounter('eliminationsCount');

        setMessage({
          text: `✅ ${target.username} ликвидирован! Он был шпионом.`,
          type: 'success',
        });
        setEvidences((prev) => prev.filter((e) => e.target_id !== evidence.target_id));
      }
    } else {
      // Цель не шпион — ШТРАФ
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { error: blockError } = await supabase
        .from('User')
        .update({
          militaryBlockedUntil: blockUntil.toISOString(),
        })
        .eq('id', profile.id);

      if (blockError) {
        setMessage({ text: 'Ошибка блокировки: ' + blockError.message, type: 'error' });
      } else {
        await incrementCounter('eliminationsFailed');

        setMessage({
          text: `❌ ${target.username} не был шпионом. Вы заблокированы на 24 часа.`,
          type: 'error',
        });

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    }

    setEliminating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (blockedUntil) {
    const hoursLeft = Math.ceil((blockedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl border border-red-700 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            Вы заблокированы
          </h1>
          <p className="text-gray-300 mb-2">
            Вы ошиблись при ликвидации.
          </p>
          <p className="text-yellow-400 font-semibold mb-6">
            Осталось: {hoursLeft} ч.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Во время блокировки вы не можете просматривать улики и ликвидировать игроков.
          </p>
          <Link
            href="/game"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
          >
            ← Назад в игру
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      <h1 className="text-3xl font-bold text-green-400 mb-6">📂 Входящие улики</h1>

      <p className="text-gray-400 mb-4">
        Ваша страна: <span className="text-white">{profile?.country}</span>
      </p>

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