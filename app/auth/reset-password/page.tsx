'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type) {
        // Обмениваем токен на сессию
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (verifyError) {
          setError('Ссылка недействительна или истекла. Запросите новую.');
          return;
        }
      }

      // Проверяем, есть ли сессия (может быть, уже авторизован)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Ссылка недействительна. Запросите новую.');
        return;
      }

      setReady(true);
    };

    init();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError('Не удалось обновить пароль: ' + updateError.message);
      setLoading(false);
      return;
    }

    router.push('/game');
    router.refresh();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl border border-red-700 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Ошибка</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold"
          >
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Проверка ссылки...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-green-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-400 mb-2 text-center">Новый пароль</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">Придумайте новый пароль для входа</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Новый пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-11 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-400"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Подтверждение пароля</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    }>
      <ResetPasswordHandler />
    </Suspense>
  );
}