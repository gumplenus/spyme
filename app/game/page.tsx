'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isInOnboarding, hoursUntilOnboardingEnds } from '@/lib/gameCycle';

const COUNTRIES = [
  { code: 'US', name: 'США' },
  { code: 'RU', name: 'Россия' },
  { code: 'DE', name: 'Германия' },
  { code: 'IL', name: 'Израиль' },
  { code: 'GB', name: 'Великобритания' },
];

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [spyTarget, setSpyTarget] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferComment, setTransferComment] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countryError, setCountryError] = useState<string>('');
  const [countrySuccess, setCountrySuccess] = useState<string>('');
  const [changingCountry, setChangingCountry] = useState(false);

  const [passiveIncomeMessage, setPassiveIncomeMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return null;
    }
    setUser(user);

    const { data: profileData } = await supabase
      .from('User')
      .select('id, username, country, publicRole, onboardingEndsAt, isSpy, spyActivated, spyMissionTargetId, spyMissionProgress, spyMissionCompleted, spyCodeWord, balance, lastCountryChange, isBanned, militaryBlockedUntil')
      .eq('id', user.id)
      .single();

    if (profileData?.isBanned === true) {
      router.push('/banned');
      return null;
    }

    setProfile(profileData);
    return profileData;
  };

  useEffect(() => {
    const fetchData = async () => {
      const profileData = await fetchProfile();
      if (!profileData) return;

      // ПАССИВНЫЙ ДОХОД
      if (profileData.publicRole === 'BUSINESSMAN') {
        const { data: incomeData, error: incomeError } = await supabase.rpc('apply_passive_income', {
          businessman_id: profileData.id,
        });

        if (!incomeError && incomeData && incomeData.success && incomeData.income > 0) {
          setPassiveIncomeMessage(`💰 Пассивный доход: +${incomeData.income} ВЛИ (за ${incomeData.days} дн.)`);
          setTimeout(() => setPassiveIncomeMessage(null), 8000);

          profileData.balance = profileData.balance + incomeData.income;
          setProfile({ ...profileData });
        }
      }

      // УВЕДОМЛЕНИЯ
      const { data: notifData } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', profileData.id)
        .eq('isRead', false)
        .order('createdAt', { ascending: false });

      if (notifData && notifData.length > 0) {
        setNotifications(notifData);
        setIsNotificationsOpen(true);
      }

      if (profileData.isSpy && profileData.spyMissionTargetId) {
        const { data: targetData } = await supabase
          .from('User')
          .select('username, country, publicRole')
          .eq('id', profileData.spyMissionTargetId)
          .single();
        setSpyTarget(targetData);
      }

      if (profileData.country) {
        const { data: postsData } = await supabase
          .from('Post')
          .select(`*, author:authorId (username)`)
          .eq('country', profileData.country)
          .order('createdAt', { ascending: false });
        setPosts(postsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const markNotificationsAsRead = async () => {
    if (!user || notifications.length === 0) return;

    const ids = notifications.map((n) => n.id);

    await supabase
      .from('Notification')
      .update({ isRead: true })
      .in('id', ids);

    setIsNotificationsOpen(false);
    setNotifications([]);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    setPosting(true);

    try {
      const { data, error } = await supabase
        .from('Post')
        .insert([
          {
            authorId: user.id,
            content: newPostContent,
            country: profile?.country || 'US',
          },
        ])
        .select();

      if (error) {
        console.error('Ошибка Supabase при создании поста:', error);
        alert('Ошибка: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        setPosts([data[0], ...posts]);
        setNewPostContent('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Неизвестная ошибка:', err);
    } finally {
      setPosting(false);
    }
  };

  const openTransferModal = async () => {
    if (!user) return;

    const { data: users } = await supabase
      .from('User')
      .select('id, username, country, publicRole, balance')
      .neq('id', user.id)
      .order('username');

    setAllUsers(users || []);
    setTransferRecipient('');
    setTransferAmount('');
    setTransferComment('');
    setTransferError('');
    setTransferSuccess('');
    setIsTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!user || !transferRecipient || !transferAmount) {
      setTransferError('Выберите получателя и укажите сумму');
      return;
    }

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Сумма должна быть больше 0');
      return;
    }

    if (amount > (profile?.balance || 0)) {
      setTransferError(`Недостаточно ВЛИ. У вас ${profile?.balance || 0}`);
      return;
    }

    setTransferring(true);
    setTransferError('');
    setTransferSuccess('');

    const { data, error } = await supabase.rpc('transfer_balance', {
      sender: user.id,
      recipient: transferRecipient,
      amount: amount,
    });

    if (error) {
      setTransferError('Ошибка: ' + error.message);
      setTransferring(false);
      return;
    }

    if (data && data.success === false) {
      setTransferError(data.error || 'Ошибка перевода');
      setTransferring(false);
      return;
    }

    setTransferSuccess(`✅ Переведено ${amount} ВЛИ игроку ${getRecipientName()}`);
    setProfile({ ...profile, balance: profile.balance - amount });

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === transferRecipient ? { ...u, balance: u.balance + amount } : u
      )
    );

    setTimeout(() => {
      setIsTransferOpen(false);
      setTransferSuccess('');
    }, 3000);

    setTransferring(false);
  };

  const getRecipientName = () => {
    const recipient = allUsers.find((u) => u.id === transferRecipient);
    return recipient?.username || 'Неизвестный';
  };

  const openCountryModal = () => {
    setSelectedCountry('');
    setCountryError('');
    setCountrySuccess('');
    setIsCountryOpen(true);
  };

  const handleChangeCountry = async () => {
    if (!user || !selectedCountry) {
      setCountryError('Выберите страну');
      return;
    }

    if (selectedCountry === profile?.country) {
      setCountryError('Вы уже в этой стране');
      return;
    }

    setChangingCountry(true);
    setCountryError('');
    setCountrySuccess('');

    const { data, error } = await supabase.rpc('change_country', {
      politician_id: user.id,
      new_country: selectedCountry,
    });

    if (error) {
      setCountryError('Ошибка: ' + error.message);
      setChangingCountry(false);
      return;
    }

    if (data && data.success === false) {
      setCountryError(data.error || 'Ошибка смены страны');
      setChangingCountry(false);
      return;
    }

    const countryName = COUNTRIES.find((c) => c.code === selectedCountry)?.name || selectedCountry;
    setCountrySuccess(`✅ Вы переехали в ${countryName}! Иммунитет на 48 часов.`);

    await fetchProfile();

    setTimeout(() => {
      setIsCountryOpen(false);
      setCountrySuccess('');
    }, 3000);

    setChangingCountry(false);
  };

  const getImmunityHours = () => {
    if (!profile?.lastCountryChange) return 0;
    const lastChange = new Date(profile.lastCountryChange);
    const now = new Date();
    const diffHours = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);
    const remaining = 48 - diffHours;
    return remaining > 0 ? Math.ceil(remaining) : 0;
  };

  const getMilitaryBlockHours = () => {
    if (!profile?.militaryBlockedUntil) return 0;
    const blocked = new Date(profile.militaryBlockedUntil);
    const now = new Date();
    const diffHours = (blocked.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 ? Math.ceil(diffHours) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  const isSpy = profile?.isSpy === true;
  const isBusinessman = profile?.publicRole === 'BUSINESSMAN';
  const isPolitician = profile?.publicRole === 'POLITICIAN';
  const isMilitary = profile?.publicRole === 'MILITARY';
  const immunityHours = isPolitician ? getImmunityHours() : 0;
  const militaryBlockHours = isMilitary ? getMilitaryBlockHours() : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Добро пожаловать в игру SpyMe!
      </h1>

      {passiveIncomeMessage && (
        <div className="mb-6 p-4 bg-green-900/40 border border-green-500 rounded-lg text-green-300 text-center font-semibold">
          {passiveIncomeMessage}
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
        <div>
          <p className="text-gray-400">Пользователь: {profile?.username || user?.email}</p>
          <p className="text-gray-400">Страна: {profile?.country}</p>
          <p className="text-gray-400">Роль: {profile?.publicRole}</p>
          <p className="text-yellow-400 font-semibold">💰 Баланс: {profile?.balance} ВЛИ</p>
          {isPolitician && immunityHours > 0 && (
            <p className="text-blue-400 font-semibold">🛡️ Иммунитет: {immunityHours} ч.</p>
          )}
          {isInOnboarding(profile?.onboardingEndsAt) && (
            <p className="text-yellow-400 font-semibold">
              🎓 Обучение: осталось {hoursUntilOnboardingEnds(profile.onboardingEndsAt)} ч.
            </p>
          )}
        </div>

        {militaryBlockHours > 0 && (
          <div className="mt-4 p-3 bg-red-900/40 border border-red-500 rounded-lg">
            <p className="text-red-300 font-semibold">🚫 Вы заблокированы</p>
            <p className="text-red-200 text-sm mt-1">
              Вы ошиблись при ликвидации. Блокировка снимется через {militaryBlockHours} ч.
            </p>
          </div>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm"
        >
          Выйти
        </button>

        <div className="flex flex-wrap gap-2 mt-3">
          <Link
            href="/chat"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm"
          >
            💬 Чаты
          </Link>

          {isSpy && spyTarget && (
            <div className="mt-3 p-4 bg-purple-900/30 border border-purple-500 rounded-lg w-full">
              <p className="text-purple-300 font-semibold">🕵️ Ваша миссия</p>
              <p className="text-white mt-1">
                Завербовать: <span className="font-semibold">{spyTarget.username}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Страна: {spyTarget.country} · Роль: {spyTarget.publicRole}
              </p>
              {profile.spyMissionCompleted ? (
                <p className="text-green-400 font-semibold text-sm mt-2">
                  🎉 Миссия выполнена! Информация собрана.
                </p>
              ) : (
                <p className="text-yellow-400 text-sm mt-2">
                  Прогресс: {profile.spyMissionProgress}%
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Кодовое слово: <span className="text-purple-300">{profile.spyCodeWord}</span>
              </p>
            </div>
          )}

          {profile?.publicRole === 'REPORTER' && (
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm"
              >
                ➕ Создать пост
              </button>
              <Link
                href="/investigate"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black text-sm"
              >
                🔍 Расследования
              </Link>
            </>
          )}

          {isMilitary && militaryBlockHours === 0 && (
            <Link
              href="/evidence"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm"
            >
              📂 Улики
            </Link>
          )}

          {isMilitary && militaryBlockHours > 0 && (
            <span
              className="px-4 py-2 bg-gray-700 text-gray-500 rounded-lg text-sm cursor-not-allowed"
              title="Вы заблокированы"
            >
              📂 Улики (заблокировано)
            </span>
          )}

          {isBusinessman && (
            <button
              onClick={openTransferModal}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black text-sm font-semibold"
            >
              💰 Перевести ВЛИ
            </button>
          )}

          {isPolitician && (
            <button
              onClick={openCountryModal}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-black text-sm font-semibold"
            >
              🌍 Сменить страну
            </button>
          )}

          <Link
            href="/stats"
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm"
          >
            📊 Статистика
          </Link>

          <Link
            href="/rules"
            className="px-4 py-2 bg-teal-500 hover:bg-indigo-600 rounded-lg text-white text-sm"
          >
            📖 Правила
          </Link>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold text-green-400">📰 Лента новостей</h2>
        {posts.length === 0 ? (
          <p className="text-gray-400 mt-2">Нет новостей в вашей стране</p>
        ) : (
          <div className="mt-3 space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">
                  {post.author?.username || 'Неизвестный'} · {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <p className="text-white mt-1">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно уведомлений */}
      {isNotificationsOpen && notifications.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-green-500 max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-green-400 mb-4 text-center">
              🔔 Уведомления
            </h3>
            <div className="space-y-3 mb-6">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <p className="text-white font-semibold">{n.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{n.message}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={markNotificationsAsRead}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Создать пост</h3>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400 h-32"
              placeholder="О чём хотите сообщить?"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50"
              >
                {posting ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTransferOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-2">💰 Перевести ВЛИ</h3>
            <p className="text-gray-400 text-sm mb-4">
              Ваш баланс: <span className="text-yellow-400 font-semibold">{profile?.balance} ВЛИ</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Кому</label>
                <select
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
                >
                  <option value="">— Выберите игрока —</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.country}, {u.publicRole})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Сумма (ВЛИ)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  min="1"
                  placeholder="100"
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Комментарий (опционально)</label>
                <input
                  type="text"
                  value={transferComment}
                  onChange={(e) => setTransferComment(e.target.value)}
                  placeholder="За расследование"
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
                />
              </div>

              {transferError && (
                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
                  {transferError}
                </div>
              )}

              {transferSuccess && (
                <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded">
                  {transferSuccess}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsTransferOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring || !transferRecipient || !transferAmount}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-semibold disabled:opacity-50"
              >
                {transferring ? 'Перевод...' : 'Перевести'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCountryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">🌍 Сменить страну</h3>
            <p className="text-gray-400 text-sm mb-4">
              Текущая страна: <span className="text-white font-semibold">{profile?.country}</span>
            </p>
            {immunityHours > 0 && (
              <p className="text-blue-400 text-sm mb-4">
                🛡️ Иммунитет: {immunityHours} ч.
              </p>
            )}
            <p className="text-yellow-400 text-xs mb-4">
              ⚠️ Смена страны доступна раз в 48 часов. После смены вы получаете иммунитет на 48 часов.
            </p>

            <div className="space-y-3 mb-4">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  disabled={c.code === profile?.country}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedCountry === c.code
                      ? 'bg-cyan-500 text-black border-cyan-400 font-semibold'
                      : c.code === profile?.country
                      ? 'bg-gray-700/50 text-gray-500 border-gray-700 cursor-not-allowed'
                      : 'bg-gray-700 text-white border-gray-600 hover:border-cyan-400'
                  }`}
                >
                  {c.name} {c.code === profile?.country && '(текущая)'}
                </button>
              ))}
            </div>

            {countryError && (
              <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">
                {countryError}
              </div>
            )}

            {countrySuccess && (
              <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded mb-4">
                {countrySuccess}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCountryOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleChangeCountry}
                disabled={changingCountry || !selectedCountry || selectedCountry === profile?.country}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-black font-semibold disabled:opacity-50"
              >
                {changingCountry ? 'Переезд...' : 'Переехать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}