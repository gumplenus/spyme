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
        .from('Evidence')
        .select(`
          id,
          content,
          strength,
          createdAt,
          targetId,
          target:targetId (username, country, publicRole),
          reporter:reporterId (username)
        `)
        .eq('recipientId', user.id)
        .order('createdAt', { ascending: false });

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

  const dismissEvidence = async (evidenceId: string) => {
    setEliminating(evidenceId);
    setMessage(null);

    const { error } = await supabase
      .from('Evidence')
      .delete()
      .eq('id', evidenceId);

    if (error) {
      setMessage({ text: 'Ошибка удаления: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Улика удалена из базы', type: 'success' });
      setEvidences((prev) => prev.filter((e) => e.id !== evidenceId));
      setTimeout(() => setMessage(null), 3000);
    }

    setEliminating(null);
  };

  const eliminateTarget = async (evidence: any) => {
    setEliminating(evidence.id);
    setMessage(null);

    const { data: target, error: targetError } = await supabase
      .from('User')
      .select('isSpy, isBanned, username, publicRole, lastCountryChange')
      .eq('id', evidence.targetId)
      .single();

    if (targetError || !target) {
      setMessage({ text: 'Ошибка: цель не найдена', type: 'error' });
      setEliminating(null);
      return;
    }

    if (target.isBanned === true) {
      await supabase
        .from('Evidence')
        .delete()
        .eq('targetId', evidence.targetId);

      setMessage({
        text: `${target.username} уже был ликвидирован ранее. Улики удалены.`,
        type: 'error',
      });
      setEvidences((prev) => prev.filter((e) => e.targetId !== evidence.targetId));
      setEliminating(null);
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (target.publicRole === 'POLITICIAN' && target.lastCountryChange) {
      const lastChange = new Date(target.lastCountryChange);
      const now = new Date();
      const hoursSince = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 48) {
        const remaining = Math.ceil(48 - hoursSince);
        setMessage({
          text: `${target.username} под дипломатическим иммунитетом. Ликвидация невозможна. Подождите ${remaining} ч.`,
          type: 'error',
        });
        setEliminating(null);
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    }

    if (target.isSpy === true) {
      const { data: { user: militaryUser } } = await supabase.auth.getUser();

      const { error: banError } = await supabase
        .from('User')
        .update({
          isBanned: true,
          banReason: 'Ликвидирован Военным за шпионаж',
          eliminatedBy: militaryUser?.id,
          email: `banned-${evidence.targetId}@spyme.deleted`,
          username: `Ликвидирован #${evidence.targetId.slice(0, 6)}`,
        })
        .eq('id', evidence.targetId);

      if (banError) {
        setMessage({ text: 'Ошибка ликвидации: ' + banError.message, type: 'error' });
      } else {
        try {
          await fetch('/api/release-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: evidence.targetId, type: 'banned' }),
          });
        } catch (err) {
          console.error('Ошибка вызова release-email:', err);
        }

        await supabase
          .from('Evidence')
          .delete()
          .eq('targetId', evidence.targetId);

        await incrementCounter('eliminationsCount');

        setMessage({
          text: `${target.username} ликвидирован! Он был шпионом.`,
          type: 'success',
        });
        setEvidences((prev) => prev.filter((e) => e.targetId !== evidence.targetId));
      }
    } else {
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
          text: `${target.username} не был шпионом. Вы заблокированы на 24 часа.`,
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
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА_УЛИК...</div>
      </div>
    );
  }

  if (blockedUntil) {
    const hoursLeft = Math.ceil((blockedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
    return (
      <div className="min-h-screen bg-[#050807] text-gray-300 flex items-center justify-center p-4 font-mono pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="border border-red-500/50 p-6 max-w-md w-full text-center bg-[#0a0f0d] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="text-4xl mb-4 text-red-500">[ X ]</div>
          <h1 className="text-sm font-bold text-red-500 mb-4 tracking-widest uppercase">
            ДОСТУП_ЗАБЛОКИРОВАН
          </h1>
          <p className="text-gray-400 text-xs mb-2">
            Вы ошиблись при ликвидации.
          </p>
          <p className="text-yellow-500 text-xs font-semibold mb-6">
            БЛОКИРОВКА: {hoursLeft} Ч.
          </p>
          <p className="text-gray-600 text-[10px] mb-6">
            Во время блокировки вы не можете просматривать улики и ликвидировать игроков.
          </p>
          <Link
            href="/game"
            className="inline-block px-6 py-3 border border-gray-600 text-gray-300 hover:text-[#39ff14] hover:border-[#39ff14] rounded-none text-xs font-semibold tracking-wider transition-colors"
          >
            &lt; НАЗАД_В_ИГРУ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono pb-10">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] flex items-center gap-3">
        <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ ВХОДЯЩИЕ_УЛИКИ ]</h1>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+80px)] px-4 pb-4 max-w-3xl mx-auto">
        <p className="text-gray-500 text-xs mb-4 uppercase tracking-wider">
          ЛОКАЦИЯ: <span className="text-white">{profile?.country}</span>
        </p>

        {message && (
          <div
            className={`mb-4 p-3 border text-xs ${
              message.type === 'success'
                ? 'border-[#39ff14] text-[#39ff14] bg-[#39ff14]/5'
                : 'border-red-500/50 text-red-500 bg-red-900/10'
            }`}
          >
            &gt; {message.text}
          </div>
        )}

        {evidences.length === 0 ? (
          <p className="text-gray-600 text-sm italic mt-8">[ ДАННЫЕ НЕ НАЙДЕНЫ. ВХОДЯЩИЕ УЛИКИ ОТСУТСТВУЮТ. ]</p>
        ) : (
          <div className="space-y-3 mt-4">
            {evidences.map((e) => (
              <div key={e.id} className="border border-gray-800 bg-[#0a0f0d] p-4 relative">
                <div className="flex items-center gap-3 mb-3 border-b border-gray-800 pb-2">
                  <span className="text-[#39ff14] text-sm font-semibold truncate">
                    ЦЕЛЬ: @{e.target?.username || 'Неизвестный'}
                  </span>
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                  СТРАНА: {e.target?.country} {'//'} РОЛЬ: {e.target?.publicRole}
                </p>
                <p className="text-gray-600 text-[10px] uppercase tracking-wider mt-1">
                  ОТ: {e.reporter?.username || 'Неизвестный'} {'//'} {new Date(e.createdAt + 'Z').toLocaleDateString()}
                </p>
                <p className="text-gray-300 text-sm mt-3 bg-black border border-gray-800 p-3">
                  &gt; {e.content}
                </p>
                <p className="text-orange-400 text-xs mt-2 font-semibold">
                  СИЛА_УЛИКИ: {e.strength}%
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => eliminateTarget(e)}
                    disabled={eliminating === e.id}
                    className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
                  >
                    {eliminating === e.id ? 'ЛИКВИДАЦИЯ...' : '> ЛИКВИДИРОВАТЬ'}
                  </button>
                  <button
                    onClick={() => dismissEvidence(e.id)}
                    disabled={eliminating === e.id}
                    className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-xs rounded-none transition-colors disabled:opacity-50"
                  >
                    ОТКЛОНИТЬ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}