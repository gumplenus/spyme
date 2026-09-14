'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InvestigatePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Автоматически завершаем расследования, у которых прошло 24 часа
      await supabase.rpc('complete_investigations');

      const { data: invData } = await supabase
        .from('Investigation')
        .select(`
          *,
          target:targetId (username, country, publicRole)
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
      .select('id, username, country, publicRole')
      .neq('id', currentUserId);

    setAllUsers(users || []);
    setIsModalOpen(true);
  };

  const startInvestigation = async (targetId: string) => {
    if (!currentUserId) return;
    setStarting(true);

    const { data: existing } = await supabase
      .from('Investigation')
      .select('id')
      .eq('reporterId', currentUserId)
      .eq('targetId', targetId)
      .eq('status', 'IN_PROGRESS')
      .single();

    if (existing) {
      alert('У вас уже есть активное расследование этого игрока');
      setStarting(false);
      return;
    }

    const { error } = await supabase
      .from('Investigation')
      .insert({
        reporterId: currentUserId,
        targetId,
        status: 'IN_PROGRESS',
      });

    if (error) {
      console.error('Ошибка запуска расследования:', error);
      alert('Ошибка: ' + error.message);
    } else {
      setIsModalOpen(false);
      const { data: invData } = await supabase
        .from('Investigation')
        .select(`*, target:targetId (username, country, publicRole)`)
        .eq('reporterId', currentUserId)
        .order('startedAt', { ascending: false });
      setInvestigations(invData || []);
    }
    setStarting(false);
  };

  const transferEvidence = async (inv: any) => {
    if (!currentUserId) return;
    setTransferring(inv.id);

    // Проверяем, нет ли уже улики по этому расследованию
    const { data: existing } = await supabase
      .from('Evidence')
      .select('id')
      .eq('reporterId', currentUserId)
      .eq('targetId', inv.targetId)
      .single();

    if (existing) {
      alert('Улика на этого игрока уже передана');
      setTransferring(null);
      return;
    }

    // Вычисляем силу улики из текста отчёта
    let strength = 50;
    const match = inv.result?.match(/Вероятность шпионажа: (\d+)%/);
    if (match) strength = parseInt(match[1]);

    const { error } = await supabase
      .from('Evidence')
      .insert({
        reporterId: currentUserId,
        targetId: inv.targetId,
        type: 'SYSTEM_REPORT',
        content: inv.result,
        strength,
        isVerified: false,
      });

    if (error) {
      console.error('Ошибка передачи улики:', error);
      alert('Ошибка: ' + error.message);
    } else {
      setSuccessMessage('Улика передана Военному вашей страны');
      setTimeout(() => setSuccessMessage(null), 4000); // исчезнет через 4 сек
    }
    setTransferring(null);
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
      <div className="flex justify-between items-center mb-6">

      {successMessage && (
  <div className="mb-4 p-3 bg-green-900/40 border border-green-500 rounded-lg text-green-300 text-sm">
    ✅ {successMessage}
  </div>
)}

        <h1 className="text-3xl font-bold text-green-400">🔍 Расследования</h1>
        <button
          onClick={openNewInvestigationModal}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black text-sm font-semibold"
        >
          ➕ Новое расследование
        </button>
      </div>

      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      {investigations.length === 0 ? (
        <p className="text-gray-400 mt-8">У вас ещё нет расследований.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {investigations.map((inv) => (
            <div
              key={inv.id}
              className="bg-gray-800 p-4 rounded-xl border border-gray-700"
            >
              <p className="text-white font-semibold">
                🎯 {inv.target?.username || 'Неизвестный'}
              </p>
              <p className="text-gray-400 text-sm">
                Страна: {inv.target?.country} · Роль: {inv.target?.publicRole}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Начато: {new Date(inv.startedAt).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${inv.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>
                Статус: {inv.status === 'COMPLETED' ? 'Завершено' : 'В процессе (24 ч)'}
              </p>
              {inv.result && (
                <p className="text-gray-300 text-sm mt-2 bg-gray-900 p-2 rounded">
                  {inv.result}
                </p>
              )}
              {inv.status === 'COMPLETED' && (
                <button
                  onClick={() => transferEvidence(inv)}
                  disabled={transferring === inv.id}
                  className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm disabled:opacity-50"
                >
                  {transferring === inv.id ? 'Передача...' : '📤 Передать улику Военному'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Кого расследовать?</h3>
            {allUsers.length === 0 ? (
              <p className="text-gray-400">Нет других игроков</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startInvestigation(u.id)}
                    disabled={starting}
                    className="w-full text-left bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <p className="text-white font-semibold">{u.username || 'Неизвестный'}</p>
                    <p className="text-gray-400 text-xs">
                      {u.country} · {u.publicRole}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}