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

    const { error } = await supabase
      .from('User')
      .update({
        username: 'Аккаунт удалён',
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
          ← Назад в игру
        </Link>

        <h1 className="text-3xl font-bold text-green-400 mb-6">⚙️ Настройки аккаунта</h1>

        {message && (
          <div className="mb-4 p-3 bg-green-900/40 border border-green-500 rounded-lg text-green-300 text-sm">
            ✅ {message}
          </div>
        )}

        {/* Профиль */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-block px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-semibold">
                {uploadingAvatar ? 'Загрузка...' : '📷 Загрузить аватар'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 text-xs mt-2">JPG, PNG, WebP. Максимум 2 МБ.</p>
            </div>
          </div>

          <p className="text-gray-400 text-sm">Имя</p>
          <p className="text-white font-semibold">{profile?.username}</p>
          <p className="text-gray-400 text-sm mt-3">Email</p>
          <p className="text-white text-sm">{profile?.email}</p>
        </div>

        {/* Уведомления */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">🔔 Уведомления</p>
              <p className="text-gray-400 text-sm mt-1">
                Получать уведомления о переводах, сообщениях и событиях
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={savingNotif}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ml-4 ${
                profile?.notificationsEnabled ? 'bg-green-500' : 'bg-gray-600'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  profile?.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Удаление аккаунта */}
        <div className="bg-gray-800 p-5 rounded-xl border border-red-800">
          <p className="text-red-400 font-semibold">⚠️ Удалить аккаунт</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            Ваш профиль станет анонимным. Вы больше не сможете войти под этим аккаунтом.
          </p>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold"
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-red-700">
            <h3 className="text-xl font-semibold text-white mb-3">
              ⚠️ Удалить аккаунт?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Это действие <span className="text-white font-semibold">необратимо</span>. Ваш профиль станет анонимным, вы выйдете из игры.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              Введите <span className="text-red-400 font-mono font-semibold">УДАЛИТЬ</span> для подтверждения:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-red-500 mb-4"
              placeholder="УДАЛИТЬ"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirm('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'УДАЛИТЬ' || deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Удаление...' : 'Удалить навсегда'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}