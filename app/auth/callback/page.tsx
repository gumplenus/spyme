'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Проверяем подтверждение...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase автоматически обрабатывает токен из URL
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('Не удалось подтвердить email. Попробуйте войти заново.');
          setStatus('');
          return;
        }

        // Проверяем, есть ли уже профиль в User
        const { data: existingProfile } = await supabase
          .from('User')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          // Профиль уже есть — просто в игру
          router.push('/game');
          return;
        }

        // Берём данные из localStorage
        const pendingUsername = localStorage.getItem('pendingUsername');
        const pendingCountry = localStorage.getItem('pendingCountry');

        if (!pendingUsername || !pendingCountry) {
          setError('Данные регистрации потеряны. Зарегистрируйтесь заново.');
          setStatus('');
          return;
        }

        setStatus('Создаём профиль...');

        // Создаём профиль. Роль пока пустая — её выберем отдельно
        // Или передадим из localStorage (роль игрок выбирал до signUp)
        const pendingRole = localStorage.getItem('pendingRole') || 'REPORTER';
        const balance = pendingRole === 'BUSINESSMAN' ? 1000 : 500;

        const { error: insertError } = await supabase
          .from('User')
          .insert([
            {
              id: user.id,
              email: user.email,
              username: pendingUsername,
              country: pendingCountry,
              publicRole: pendingRole,
              balance: balance,
              createdAt: new Date().toISOString(),
              isBanned: false,
            },
          ]);

        if (insertError) {
          console.error('Ошибка создания профиля:', insertError);
          setError('Не удалось создать профиль: ' + insertError.message);
          setStatus('');
          return;
        }

        // Чистим localStorage
        localStorage.removeItem('pendingUsername');
        localStorage.removeItem('pendingEmail');
        localStorage.removeItem('pendingPassword');
        localStorage.removeItem('pendingCountry');
        localStorage.removeItem('pendingRole');

        router.push('/game');
        router.refresh();
      } catch (err: any) {
        setError('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
        setStatus('');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-green-500 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">Ошибка</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <a
              href="/register"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold"
            >
              Зарегистрироваться заново
            </a>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Подтверждение email</h1>
            <p className="text-gray-300">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}