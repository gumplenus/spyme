'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerSelector, { Player } from '@/components/PlayerSelector';
import { COUNTRIES } from '@/lib/countries';

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<Player[]>([]);
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
  const [postSearch, setPostSearch] = useState('');
  const [postCountryFilter, setPostCountryFilter] = useState('');

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return null;
    }
    setUser(user);

    const { data: profileData } = await supabase
      .from('User')
      .select('id, username, country, publicRole, isSpy, spyActivated, balance, lastCountryChange, isBanned, militaryBlockedUntil')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      await supabase.auth.signOut();
      router.push('/register');
      return null;
    }

    if (profileData.isBanned === true) {
      router.push('/banned');
      return null;
    }

    setProfile(profileData);
    return profileData;
  };

  useEffect(() => {
    if (!profile?.id) return;

    const timer = setTimeout(async () => {
      let query = supabase
        .from('Post')
        .select(`*, author:authorId (username, country, avatarUrl)`)
        .order('createdAt', { ascending: false });

      if (postCountryFilter) {
        query = query.eq('country', postCountryFilter);
      }

      if (postSearch.trim()) {
        const { data: matchingUsers } = await supabase
          .from('User')
          .select('id')
          .ilike('username', `%${postSearch.trim()}%`);

        if (matchingUsers && matchingUsers.length > 0) {
          query = query.in('authorId', matchingUsers.map((u: any) => u.id));
        } else {
          setPosts([]);
          return;
        }
      }

      const { data } = await query;
      setPosts(data || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [profile?.id, postSearch, postCountryFilter]);

  useEffect(() => {
    const fetchData = async () => {
      const profileData = await fetchProfile();
      if (!profileData) {
        setLoading(false);
        return;
      }

      try {
        await supabase.rpc('balance_spies');
      } catch (err) {
        console.error('Ошибка балансировки шпионов:', err);
      }

      if (profileData.publicRole === 'BUSINESSMAN') {
        const { data: incomeData, error: incomeError } = await supabase.rpc('apply_passive_income', {
          businessman_id: profileData.id,
        });

        if (!incomeError && incomeData && incomeData.success && incomeData.income > 0) {
          setPassiveIncomeMessage(`[SYS] Пассивный доход: +${incomeData.income} ВЛИ (за ${incomeData.days} дн.)`);
          setTimeout(() => setPassiveIncomeMessage(null), 8000);

          profileData.balance = profileData.balance + incomeData.income;
          setProfile({ ...profileData });
        }
      }

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

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const markNotificationsAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const ids = notifications.map((n) => n.id);
    await supabase.from('Notification').update({ isRead: true }).in('id', ids);
    setIsNotificationsOpen(false);
    setNotifications([]);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    setPosting(true);

    try {
      const { data, error } = await supabase
        .from('Post')
        .insert([{ authorId: user.id, content: newPostContent, country: profile?.country || 'US' }])
        .select();

      if (error) {
        alert('Ошибка: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        const newPost = {
          ...data[0],
          author: {
            username: profile?.username || 'Неизвестный',
            country: profile?.country || null,
          },
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const openTransferModal = async () => {
    if (!user) return;
    const { data: users } = await supabase
      .from('User')
      .select('id, username, country, publicRole, avatarUrl')
      .neq('id', user.id)
      .eq('isBanned', false)
      .is('deletedAt', null)
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

    setTransferSuccess(`[OK] Переведено ${amount} ВЛИ игроку ${getRecipientName()}`);
    setProfile({ ...profile, balance: profile.balance - amount });

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
    setCountrySuccess(`[OK] Вы переехали в ${countryName}! Иммунитет на 48 часов.`);

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
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ СИСТЕМА ЗАГРУЖАЕТСЯ...</div>
      </div>
    );
  }

  const isSpy = profile?.isSpy === true;
  const isBusinessman = profile?.publicRole === 'BUSINESSMAN';
  const isPolitician = profile?.publicRole === 'POLITICIAN';
  const isMilitary = profile?.publicRole === 'MILITARY';
  const immunityHours = isPolitician ? getImmunityHours() : 0;
  const militaryBlockHours = isMilitary ? getMilitaryBlockHours() : 0;

  // Общие стили для кнопок терминала
  const btnBase = "flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3 border text-sm font-mono transition-all duration-200 rounded-none uppercase tracking-wider";
  const btnGreen = "border-[#39ff14]/50 text-[#39ff14] hover:bg-[#39ff14]/10 hover:border-[#39ff14] hover:shadow-[0_0_10px_rgba(57,255,20,0.2)]";
  const btnDisabled = "border-gray-700 text-gray-600 cursor-not-allowed";
  const btnDanger = "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500";

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 pb-10 font-mono">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center justify-between">
        <Link href="/game" className="text-lg font-bold text-[#39ff14] tracking-widest">
          [ SPY_ME ]
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="px-3 py-1.5 border border-gray-600 text-gray-300 hover:text-[#39ff14] hover:border-[#39ff14] rounded-none text-xs transition-colors">
            НАСТРОЙКИ
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="px-3 py-1.5 border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 rounded-none text-xs transition-colors"
          >
            ВЫЙТИ
          </button>
        </div>
      </header>

      <div className="pt-20 px-4 pb-4 max-w-5xl mx-auto">
        {passiveIncomeMessage && (
          <div className="mb-6 p-4 border border-[#39ff14] text-[#39ff14] text-center font-semibold shadow-[0_0_15px_rgba(57,255,20,0.3)] bg-[#39ff14]/5">
            {passiveIncomeMessage}
          </div>
        )}

        <div className="border border-[#39ff14]/30 p-4 mb-6 relative">
          {/* Декоративные уголки карточки */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#39ff14]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#39ff14]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#39ff14]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#39ff14]"></div>

          <div className="space-y-1 mb-4">
            <p className="text-gray-500 text-xs">ПОЛЬЗОВАТЕЛЬ: <span className="text-white">{profile?.username || user?.email}</span></p>
            <p className="text-gray-500 text-xs">ЛОКАЦИЯ: <span className="text-white">{profile?.country}</span></p>
            <p className="text-gray-500 text-xs">ДОПУСК: <span className="text-white">{profile?.publicRole}</span></p>
            <p className="text-yellow-400 font-semibold text-sm mt-2">БАЛАНС: {profile?.balance} ВЛИ</p>
            {isPolitician && immunityHours > 0 && (
              <p className="text-blue-400 font-semibold text-xs">ИММУНИТЕТ: {immunityHours} ч.</p>
            )}
          </div>

          {militaryBlockHours > 0 && (
            <div className="mt-4 p-3 border border-red-500/50 bg-red-500/5">
              <p className="text-red-400 font-semibold text-sm">[ ОШИБКА: ДОСТУП ЗАБЛОКИРОВАН ]</p>
              <p className="text-red-300/70 text-xs mt-1">
                Вы ошиблись при ликвидации. Блокировка снимется через {militaryBlockHours} ч.
              </p>
            </div>
          )}

          {isSpy && (
            <div className="mt-4 p-4 border border-purple-500/50 bg-purple-900/10">
              <p className="text-purple-400 font-bold text-sm tracking-widest mb-2">[ ВНИМАНИЕ: ВЫ ШПИОН ]</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Вас выбрала система. Ваша задача — не попадаться и играть свою роль.
                Другие игроки не знают, что вы шпион. Действуйте осторожно.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-6 w-full">
            {/* Строка 1: Чат, Пост */}
            <div className="flex gap-2 w-full">
              {militaryBlockHours === 0 ? (
                <Link href="/chat" className={`${btnBase} ${btnGreen}`}>
                  <span>ЧАТ</span>
                </Link>
              ) : (
                <span className={`${btnBase} ${btnDisabled}`}>
                  <span>ЧАТ (БЛОК)</span>
                </span>
              )}

              {profile?.publicRole === 'REPORTER' && (
                <button onClick={() => setIsModalOpen(true)} className={`${btnBase} ${btnGreen}`}>
                  <span>ПОСТ</span>
                </button>
              )}
            </div>

            {/* Строка 2: Расследования / Улики и Перевод ВЛИ / Смена страны */}
            <div className="flex gap-2 w-full">
              {profile?.publicRole === 'REPORTER' && (
                <Link href="/investigate" className={`${btnBase} ${btnGreen}`}>
                  <span>РАССЛЕДОВАНИЯ</span>
                </Link>
              )}

              {isMilitary && militaryBlockHours === 0 && (
                <Link href="/evidence" className={`${btnBase} ${btnGreen}`}>
                  <span>УЛИКИ</span>
                </Link>
              )}

              {isMilitary && militaryBlockHours > 0 && (
                <span className={`${btnBase} ${btnDisabled}`}>
                  <span>УЛИКИ (БЛОК)</span>
                </span>
              )}

              {militaryBlockHours === 0 ? (
                <button onClick={openTransferModal} className={`${btnBase} border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)]`}>
                  <span>ПЕРЕВОД ВЛИ</span>
                </button>
              ) : (
                <span className={`${btnBase} ${btnDisabled}`}>
                  <span>ПЕРЕВОД (БЛОК)</span>
                </span>
              )}

              {isPolitician && (
                <button onClick={openCountryModal} className={`${btnBase} border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500`}>
                  <span>СМЕНА СТРАНЫ</span>
                </button>
              )}
            </div>

            {/* Строка 4: Stats, Рейтинг, Правила */}
            <div className="flex gap-2 w-full">
              <Link href="/stats" className={`${btnBase} ${btnGreen}`}>
                <span>STATS</span>
              </Link>
              <Link href="/leaderboard" className={`${btnBase} ${btnGreen}`}>
                <span>РЕЙТИНГ</span>
              </Link>
              <Link href="/rules" className={`${btnBase} ${btnGreen}`}>
                <span>ПРАВИЛА</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="border border-[#39ff14]/30 flex flex-col h-[500px] md:h-[600px] overflow-hidden">
          <h2 className="text-sm tracking-widest text-[#39ff14] px-4 py-3 border-b border-[#39ff14]/30 shrink-0 bg-[#39ff14]/5">
            &gt; ЛЕНТА_НОВОСТЕЙ
          </h2>

          <div className="space-y-2 px-4 py-3 shrink-0">
            <input
              type="text"
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder="> ПОИСК ПО ИМЕНИ..."
              className="w-full px-3 py-2 bg-transparent text-[#39ff14] border border-gray-700 focus:border-[#39ff14] outline-none text-sm placeholder-gray-600 rounded-none"
            />
            <div className="flex gap-2">
              <select
                value={postCountryFilter}
                onChange={(e) => setPostCountryFilter(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#050807] text-[#39ff14] border border-gray-700 focus:border-[#39ff14] outline-none text-sm rounded-none appearance-none"
              >
                <option value="">ВСЕ СТРАНЫ</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {(postSearch || postCountryFilter) && (
                <button
                  onClick={() => { setPostSearch(''); setPostCountryFilter(''); }}
                  className="px-3 py-2 border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-400 text-xs rounded-none"
                >
                  СБРОС
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-4">
            {posts.length === 0 ? (
              <p className="text-gray-600 text-sm italic">[ Данные не найдены ]</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-800 p-3 bg-[#0a0f0d]">
                    <div className="flex items-center gap-3 mb-3 border-b border-gray-800 pb-2">
                      <div className="w-8 h-8 border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                        {post.author?.avatarUrl ? (
                          <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">USR</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">
                        <span className="text-[#39ff14] font-medium">@{post.author?.username || 'unknown'}</span>
                        {post.author?.country ? ` [${post.author.country}]` : ''}
                        {' // '}{new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛКА СОЗДАНИЯ ПОСТА */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border border-[#39ff14] w-full max-w-md flex flex-col max-h-[90dvh] bg-[#050807] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
            <div className="p-4 border-b border-[#39ff14]/30 shrink-0">
              <h3 className="text-sm text-[#39ff14] tracking-widest">&gt; СОЗДАТЬ_ПОСТ</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
               <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-3 bg-transparent text-white border border-gray-700 focus:outline-none focus:border-[#39ff14] h-32 text-sm rounded-none placeholder-gray-600"
                placeholder="Введите текст донесения..."
              />
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-[#39ff14]/30 shrink-0 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-xs rounded-none">
                ОТМЕНА
              </button>
              <button onClick={handleCreatePost} disabled={posting} className="px-4 py-2 border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10 text-xs rounded-none disabled:opacity-50">
                {posting ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПЕРЕВОДА ВЛИ */}
      {isTransferOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border border-yellow-500 w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <div className="flex items-center justify-between p-4 border-b border-yellow-500/30 shrink-0">
              <h3 className="text-sm text-yellow-500 tracking-widest">&gt; ПЕРЕВОД_ВЛИ</h3>
              <button onClick={() => setIsTransferOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-gray-500 text-xs mb-4">
                ВАШ_БАЛАНС: <span className="text-yellow-400 font-semibold">{profile?.balance} ВЛИ</span>
              </p>

              {!transferRecipient ? (
                <PlayerSelector players={allUsers} onSelect={(p) => setTransferRecipient(p.id)} emptyText="Нет игроков по заданным фильтрам" />
              ) : (
                <div className="mb-4 p-3 border border-gray-700 flex items-center justify-between gap-3 bg-[#0a0f0d]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                      {allUsers.find((u) => u.id === transferRecipient)?.avatarUrl ? (
                        <img src={allUsers.find((u) => u.id === transferRecipient)?.avatarUrl || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">USR</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{allUsers.find((u) => u.id === transferRecipient)?.username || 'Неизвестный'}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {allUsers.find((u) => u.id === transferRecipient)?.publicRole || ''}
                        {allUsers.find((u) => u.id === transferRecipient)?.country ? ` [${allUsers.find((u) => u.id === transferRecipient)?.country}]` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setTransferRecipient('')} className="text-gray-500 hover:text-red-400 text-xs underline shrink-0">ИЗМЕНИТЬ</button>
                </div>
              )}

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 tracking-wider">СУММА (ВЛИ)</label>
                  <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} min="1" placeholder="100" className="w-full p-3 bg-transparent text-white border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm rounded-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 tracking-wider">КОММЕНТАРИЙ</label>
                  <input type="text" value={transferComment} onChange={(e) => setTransferComment(e.target.value)} placeholder="Опционально" className="w-full p-3 bg-transparent text-white border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm rounded-none placeholder-gray-700" />
                </div>
                {transferError && <div className="text-red-400 text-xs border border-red-500/50 p-2 bg-red-900/10">{transferError}</div>}
                {transferSuccess && <div className="text-[#39ff14] text-xs border border-[#39ff14]/50 p-2 bg-[#39ff14]/10">{transferSuccess}</div>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-yellow-500/30 shrink-0 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button onClick={() => setIsTransferOpen(false)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white text-xs rounded-none">ОТМЕНА</button>
              <button onClick={handleTransfer} disabled={transferring || !transferRecipient || !transferAmount} className="px-4 py-2 border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 text-xs rounded-none disabled:opacity-50">
                {transferring ? 'ОТПРАВКА...' : 'ПЕРЕВЕСТИ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА СМЕНЫ СТРАНЫ */}
      {isCountryOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border border-cyan-500 w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="p-4 border-b border-cyan-500/30 shrink-0">
              <h3 className="text-sm text-cyan-400 tracking-widest mb-2">&gt; СМЕНА_ЛОКАЦИИ</h3>
              <p className="text-gray-500 text-xs mb-1">ТЕКУЩАЯ_ЛОКАЦИЯ: <span className="text-white">{profile?.country}</span></p>
              {immunityHours > 0 && <p className="text-blue-400 text-xs mb-1">ИММУНИТЕТ: {immunityHours} ч.</p>}
              <p className="text-yellow-500/70 text-[10px]">⚠️ Смена страны доступна раз в 48 часов. После смены вы получаете иммунитет на 48 часов.</p>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  disabled={c.code === profile?.country}
                  className={`w-full p-2 border text-left text-sm transition-colors rounded-none ${
                    selectedCountry === c.code ? 'bg-cyan-900/30 text-cyan-400 border-cyan-400 font-semibold' :
                    c.code === profile?.country ? 'bg-[#050807] text-gray-600 border-gray-800 cursor-not-allowed' :
                    'bg-transparent text-gray-300 border-gray-700 hover:border-cyan-500 hover:text-cyan-400'
                  }`}
                >
                  {c.name} {c.code === profile?.country && '(ТЕКУЩАЯ)'}
                </button>
              ))}
              {countryError && <div className="text-red-400 text-xs border border-red-500/50 p-2 bg-red-900/10">{countryError}</div>}
              {countrySuccess && <div className="text-[#39ff14] text-xs border border-[#39ff14]/50 p-2 bg-[#39ff14]/10">{countrySuccess}</div>}
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-cyan-500/30 shrink-0 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button onClick={() => setIsCountryOpen(false)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white text-xs rounded-none">ОТМЕНА</button>
              <button onClick={handleChangeCountry} disabled={changingCountry || !selectedCountry || selectedCountry === profile?.country} className="px-4 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-xs rounded-none disabled:opacity-50">
                {changingCountry ? 'ПЕРЕЕЗД...' : 'ПЕРЕЕХАТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* УВЕДОМЛЕНИЯ */}
      {isNotificationsOpen && notifications.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="border border-[#39ff14] p-4 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden bg-[#050807] shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <h3 className="text-sm text-[#39ff14] tracking-widest mb-4 text-center shrink-0">[ ВХОДЯЩИЕ_СИГНАЛЫ ]</h3>
            <div className="space-y-3 mb-4 overflow-y-auto flex-1">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 border border-gray-700 bg-[#0a0f0d]">
                  <p className="text-[#39ff14] text-xs font-semibold">&gt; {n.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{n.message}</p>
                  <p className="text-gray-600 text-[10px] mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <button onClick={markNotificationsAsRead} className="w-full px-4 py-3 border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10 text-xs font-semibold shrink-0 rounded-none">
              ПОДТВЕРДИТЬ_ПОЛУЧЕНИЕ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}