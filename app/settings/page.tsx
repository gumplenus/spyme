'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('User')
        .select('id, username, email, notificationsEnabled, isBanned, avatarUrl')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setAvatarUrl(profileData?.avatarUrl || null);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const toggleNotifications = async () => {
    if (!userId || !profile) return;
    setSavingNotif(true);

    const newValue = !profile.notificationsEnabled;

    const { error } = await supabase
      .from('User')
      .update({ notificationsEnabled: newValue })
      .eq('id', userId);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setProfile({ ...profile, notificationsEnabled: newValue });
      setMessage(newValue ? 'Уведомления включены' : 'Уведомления выключены');
      setTimeout(() => setMessage(null), 3000);
    }

    setSavingNotif(false);
  };

  const handleDeleteAccount = async () => {
    if (!userId || deleteConfirm !== 'УДАЛИТЬ') return;
    setDeleting(true);

    const anonymizedEmail = `deleted-${userId}@spyme.deleted`;
    const anonymizedUsername = `Аккаунт удалён #${userId.slice(0, 6)}`;

    const { error } = await supabase
      .from('User')
      .update({
        username: anonymizedUsername,
        email: anonymizedEmail,
        avatarUrl: null,
        deletedAt: new Date().toISOString(),
        isBanned: true,
        banReason: 'Игрок удалил аккаунт по собственному желанию',
      })
      .eq('id', userId);

    if (error) {
      alert('Ошибка удаления: ' + error.message);
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch('/api/release-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'deleted' }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Не удалось освободить email:', data.error);
      }
    } catch (err) {
      console.error('Ошибка вызова release-email:', err);
    }

    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 2 МБ');
      return;
    }

    setUploadingAvatar(true);

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert('Ошибка загрузки: ' + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('User')
      .update({ avatarUrl: publicUrl })
      .eq('id', userId);

    if (updateError) {
      alert('Ошибка сохранения: ' + updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      setMessage('Аватар обновлён');
      setTimeout(() => setMessage(null), 3000);
    }

    setUploadingAvatar(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА_ПРОФИЛЯ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 p-4 font-mono">
      <div className="max-w-2xl mx-auto">
        <Link href="/game" className="text-[#39ff14] hover:text-white mb-6 inline-block transition-colors text-sm">
          ← НАЗАД_В_ИГРУ
        </Link>

        <h1 className="text-sm tracking-widest text-[#39ff14] mb-6 border-b border-[#39ff14]/30 pb-2">
          [ НАСТРОЙКИ_АККАУНТА ]
        </h1>

        {message && (
          <div className="mb-4 p-3 border border-[#39ff14] text-[#39ff14] text-xs shadow-[0_0_10px_rgba(57,255,20,0.2)] bg-[#39ff14]/5">
            [ OK ] {message}
          </div>
        )}

        {/* Профиль */}
        <div className="border border-gray-800 bg-[#0a0f0d] p-5 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full border border-[#39ff14]/50 overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">NO_IMG</span>
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-block px-4 py-2 border border-[#39ff14]/50 text-[#39ff14] hover:bg-[#39ff14]/10 hover:border-[#39ff14] text-xs font-semibold tracking-wider transition-colors">
                {uploadingAvatar ? 'ЗАГРУЗКА...' : '> ЗАГРУЗИТЬ_АВАТАР'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              <p className="text-gray-600 text-[10px] uppercase mt-2 tracking-wider">JPG, PNG, WebP. Максимум 2 МБ.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">ИМЯ_ОПЕРАТИВНИКА</p>
              <p className="text-white text-sm font-semibold mt-1">{profile?.username}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">EMAIL_АДРЕС</p>
              <p className="text-gray-300 text-sm mt-1">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Уведомления */}
        <div className="border border-gray-800 bg-[#0a0f0d] p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">[ СИСТЕМА_УВЕДОМЛЕНИЙ ]</p>
              <p className="text-gray-500 text-xs mt-1">
                Получать сигналы о переводах, сообщениях и событиях
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={savingNotif}
              className={`relative w-14 h-7 border transition-colors shrink-0 ml-4 rounded-none ${
                profile?.notificationsEnabled 
                  ? 'bg-[#39ff14]/20 border-[#39ff14]' 
                  : 'bg-transparent border-gray-600'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 flex items-center justify-center text-[9px] font-bold transition-transform rounded-none ${
                  profile?.notificationsEnabled 
                    ? 'translate-x-7 bg-[#39ff14] text-black' 
                    : 'translate-x-0 bg-gray-600 text-gray-300'
                }`}
              >
                {profile?.notificationsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Удаление аккаунта */}
        <div className="border border-red-500/50 bg-red-900/5 p-5">
          <p className="text-red-500 text-sm font-semibold">[ ОПАСНАЯ_ЗОНА ]</p>
          <p className="text-gray-500 text-xs mt-1 mb-4">
            Данные профиля будут полностью удалены. Вы больше не сможете войти под этим аккаунтом.
          </p>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 text-xs font-semibold tracking-wider transition-colors rounded-none"
          >
            УДАЛИТЬ_АККАУНТ
          </button>
        </div>
      </div>

      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border border-red-500 p-6 w-full max-w-md bg-[#050807] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <h3 className="text-sm text-red-500 tracking-widest mb-3">
              &gt; ПОДТВЕРДИТЬ_УДАЛЕНИЕ?
            </h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
              Это действие <span className="text-white font-semibold">необратимо</span>. Ваш профиль станет анонимным, вы выйдете из игры.
            </p>
            <p className="text-gray-500 text-xs mb-2">
              Введите <span className="text-red-500 font-bold">УДАЛИТЬ</span> для подтверждения:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full p-3 bg-transparent text-white border border-gray-700 focus:outline-none focus:border-red-500 mb-6 text-sm rounded-none placeholder-gray-700"
              placeholder="УДАЛИТЬ"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirm('');
                }}
                className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white text-xs rounded-none transition-colors"
              >
                ОТМЕНА
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'УДАЛИТЬ' || deleting}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs font-semibold rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'УДАЛЕНИЕ...' : 'УДАЛИТЬ_НАВСЕГДА'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}