'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerSelector, { Player } from '@/components/PlayerSelector';

export default function InvestigatePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserCountry, setCurrentUserCountry] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<Player[]>([]);
  const [militaryList, setMilitaryList] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [evidenceToTransfer, setEvidenceToTransfer] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from('User')
        .select('country')
        .eq('id', user.id)
        .single();
      setCurrentUserCountry(profileData?.country || null);

      await supabase.rpc('complete_investigations');

      const { data: invData } = await supabase
        .from('Investigation')
        .select(`
          *,
          target:targetId (username, country, publicRole, avatarUrl)
        `)
        .eq('reporterId', user.id)
        .order('startedAt', { ascending: false });

      setInvestigations(invData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const openNewInvestigationModal = async () => {
    if (!currentUserId) return;

    const { data: users } = await supabase
      .from('User')
      .select('id, username, country, publicRole, avatarUrl')
      .neq('id', currentUserId)
      .eq('isBanned', false)
      .is('deletedAt', null);

    setAllUsers(users || []);
    setIsModalOpen(true);
  };

  const startInvestigation = async (targetId: string) => {
    if (!currentUserId) return;
    setStarting(true);

    const { error } = await supabase
      .from('Investigation')
      .insert({
        reporterId: currentUserId,
        targetId,
        status: 'IN_PROGRESS',
      });

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      const { data: currentProfile } = await supabase
        .from('User')
        .select('investigationsCount')
        .eq('id', currentUserId)
        .single();

      if (currentProfile) {
        await supabase
          .from('User')
          .update({ investigationsCount: (currentProfile.investigationsCount || 0) + 1 })
          .eq('id', currentUserId);
      }

      setIsModalOpen(false);

      const { data: invData } = await supabase
        .from('Investigation')
        .select(`*, target:targetId (username, country, publicRole, avatarUrl)`)
        .eq('reporterId', currentUserId)
        .order('startedAt', { ascending: false });
      setInvestigations(invData || []);
    }
    setStarting(false);
  };

  const openTransferModal = async (inv: any) => {
    if (!currentUserId || !currentUserCountry) return;

    const { data: militaries } = await supabase
      .from('User')
      .select('id, username, country, publicRole, avatarUrl')
      .eq('publicRole', 'MILITARY')
      .eq('country', currentUserCountry)
      .neq('id', currentUserId)
      .eq('isBanned', false)
      .is('deletedAt', null);

    setMilitaryList(militaries || []);
    setEvidenceToTransfer(inv);
  };

  const openCancelModal = (inv: any) => {
    setCancelTarget(inv);
  };

  const confirmCancelInvestigation = async () => {
    if (!currentUserId || !cancelTarget) return;

    const inv = cancelTarget;
    setCancelTarget(null);

    const { error } = await supabase
      .from('Investigation')
      .delete()
      .eq('id', inv.id);

    if (error) {
      alert('Ошибка отмены: ' + error.message);
      return;
    }

    const { data: currentProfile } = await supabase
      .from('User')
      .select('investigationsCount')
      .eq('id', currentUserId)
      .single();

    if (currentProfile && (currentProfile.investigationsCount || 0) > 0) {
      await supabase
        .from('User')
        .update({ investigationsCount: currentProfile.investigationsCount - 1 })
        .eq('id', currentUserId);
    }

    setInvestigations((prev) => prev.filter((i) => i.id !== inv.id));
  };

  const transferEvidence = async (recipientId: string) => {
    if (!currentUserId || !evidenceToTransfer) return;
    setTransferring(evidenceToTransfer.id);

    const inv = evidenceToTransfer;

    let strength = 50;
    const match = inv.result?.match(/Вероятность шпионажа: (\d+)%/);
    if (match) strength = parseInt(match[1]);

    const { error } = await supabase
      .from('Evidence')
      .insert({
        reporterId: currentUserId,
        targetId: inv.targetId,
        recipientId,
        type: 'SYSTEM_REPORT',
        content: inv.result,
        strength,
        isVerified: false,
      });

    if (error) {
      alert('Ошибка: ' + error.message);
      setTransferring(null);
      setEvidenceToTransfer(null);
      return;
    }

    await supabase
      .from('Investigation')
      .delete()
      .eq('id', inv.id);

    const { data: currentProfile } = await supabase
      .from('User')
      .select('evidencesTransferred')
      .eq('id', currentUserId)
      .single();

    if (currentProfile) {
      await supabase
        .from('User')
        .update({ evidencesTransferred: (currentProfile.evidencesTransferred || 0) + 1 })
        .eq('id', currentUserId);
    }

    setInvestigations((prev) => prev.filter((i) => i.id !== inv.id));

    setSuccessMessage('Улика передана Военному вашей страны');
    setTimeout(() => setSuccessMessage(null), 4000);

    setTransferring(null);
    setEvidenceToTransfer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ДОСТУП_К_БАЗЕ_ДАННЫХ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
            ←
          </Link>
          <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ РАССЛЕДОВАНИЯ ]</h1>
        </div>
        <button
          onClick={openNewInvestigationModal}
          className="px-3 py-1.5 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 rounded-none text-xs shrink-0 transition-colors uppercase tracking-wider"
        >
          + НОВОЕ_ДЕЛО
        </button>
      </header>

      <div className="pt-20 px-4 pb-4">
        {successMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-none">
            <div className="border border-[#39ff14] p-6 max-w-sm w-full text-center bg-[#050807] shadow-[0_0_20px_rgba(57,255,20,0.3)]">
              <div className="text-3xl mb-3 text-[#39ff14]">[ OK ]</div>
              <p className="text-[#39ff14] font-semibold text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {investigations.length === 0 ? (
          <p className="text-gray-600 text-sm italic mt-8">[ ДАННЫЕ НЕ НАЙДЕНЫ. ДЕЛА ОТСУТСТВУЮТ. ]</p>
        ) : (
          <div className="space-y-4 mt-4">
            {investigations.map((inv) => (
              <div key={inv.id} className="border border-gray-800 bg-[#0a0f0d] p-4 relative">
                <div className="flex items-center gap-3 mb-3 border-b border-gray-800 pb-3">
                  <div className="w-10 h-10 rounded-full border border-[#39ff14]/30 overflow-hidden flex items-center justify-center shrink-0">
                    {inv.target?.avatarUrl ? (
                      <img src={inv.target.avatarUrl} alt={inv.target?.username || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">USR</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#39ff14] text-sm font-semibold truncate">
                      ЦЕЛЬ: @{inv.target?.username || 'Неизвестный'}
                    </p>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider truncate mt-1">
                      СТРАНА: {inv.target?.country} // РОЛЬ: {inv.target?.publicRole}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 mb-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                    НАЧАТО: <span className="text-gray-400">{new Date(inv.startedAt + 'Z').toLocaleString()}</span>
                  </p>
                  <p className={`text-xs font-semibold tracking-wider ${inv.status === 'COMPLETED' ? 'text-[#39ff14]' : 'text-yellow-500'}`}>
                    СТАТУС: {inv.status === 'COMPLETED' ? '[ ЗАВЕРШЕНО ]' : (
                      (() => {
                        const started = new Date(inv.startedAt + 'Z').getTime();
                        const endsAt = started + 24 * 60 * 60 * 1000;
                        const remainingMs = endsAt - Date.now();
                        if (remainingMs <= 0) return '[ ЗАВЕРШАЕТСЯ... ]';
                        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
                        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
                        if (hours > 0) return `[ ОСТАЛОСЬ: ${hours} Ч ${minutes} МИН ]`;
                        return `[ ОСТАЛОСЬ: ${minutes} МИН ]`;
                      })()
                    )}
                  </p>
                </div>

                {inv.status !== 'COMPLETED' && (
                  <button
                    onClick={() => openCancelModal(inv)}
                    className="mt-2 px-3 py-1.5 border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 text-xs rounded-none transition-colors"
                  >
                    [x] ОТМЕНИТЬ_ДЕЛО
                  </button>
                )}

                {inv.result && (
                  <div className="text-gray-300 text-sm mt-3 p-3 bg-black border border-gray-800">
                    &gt; {inv.result}
                  </div>
                )}

                {inv.status === 'COMPLETED' && (
                  <button
                    onClick={() => openTransferModal(inv)}
                    disabled={transferring === inv.id}
                    className="mt-3 px-4 py-2 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
                  >
                    {transferring === inv.id ? 'ПЕРЕДАЧА...' : '> ПЕРЕДАТЬ_УЛИКУ_ВОЕННОМУ'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* МОДАЛКА НОВОГО РАССЛЕДОВАНИЯ */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="border border-yellow-500 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <div className="flex items-center justify-between p-4 border-b border-yellow-500/30 shrink-0">
                <h3 className="text-sm text-yellow-500 tracking-widest">&gt; ВЫБОР_ЦЕЛИ</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="p-4 overflow-y-auto">
                <PlayerSelector
                  players={allUsers}
                  onSelect={(p) => startInvestigation(p.id)}
                  emptyText="Нет игроков по заданным фильтрам"
                />
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛКА ПЕРЕДАЧИ УЛИК */}
        {evidenceToTransfer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="border border-[#39ff14] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
              <div className="flex items-center justify-between p-4 border-b border-[#39ff14]/30 shrink-0">
                <h3 className="text-sm text-[#39ff14] tracking-widest">&gt; ПЕРЕДАЧА_УЛИКИ</h3>
                <button onClick={() => setEvidenceToTransfer(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="p-4 overflow-y-auto">
                <PlayerSelector
                  players={militaryList}
                  onSelect={(p) => transferEvidence(p.id)}
                  emptyText="Нет Военных в вашей стране"
                />
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛКА ОТМЕНЫ */}
        {cancelTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="border border-red-500 p-6 w-full max-w-md bg-[#050807] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <h3 className="text-sm text-red-500 tracking-widest mb-3">&gt; ОТМЕНИТЬ_РАССЛЕДОВАНИЕ?</h3>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Расследование цели <span className="text-white font-semibold">@{cancelTarget.target?.username || 'Неизвестный'}</span> будет удалено. Прогресс не сохранится.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCancelTarget(null)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white text-xs rounded-none transition-colors">
                  ОТМЕНА
                </button>
                <button onClick={confirmCancelInvestigation} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs rounded-none transition-colors">
                  УДАЛИТЬ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}