'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Проверяем подтверждение...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || !type) {
          setError('Ссылка недействительна. Запросите новое письмо.');
          setStatus('');
          return;
        }

        // Обмениваем токен на сессию
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (verifyError || !verifyData.user) {
          setError('Не удалось подтвердить email: ' + (verifyError?.message || 'неизвестная ошибка'));
          setStatus('');
          return;
        }

        const user = verifyData.user;

        // Проверяем, есть ли уже профиль
        const { data: existingProfile } = await supabase
          .from('User')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          router.push('/game');
          return;
        }

        // Берём данные из localStorage
        const pendingUsername = localStorage.getItem('pendingUsername');
        const pendingCountry = localStorage.getItem('pendingCountry');
        const pendingRole = localStorage.getItem('pendingRole') || 'REPORTER';

        if (!pendingUsername || !pendingCountry) {
          setError('Данные регистрации потеряны. Зарегистрируйтесь заново.');
          setStatus('');
          return;
        }

        setStatus('Создаём профиль...');

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
          setError('Не удалось создать профиль: ' + insertError.message);
          setStatus('');
          return;
        }

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
  }, [router, searchParams]);

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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}