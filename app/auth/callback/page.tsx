'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Проверяем авторизацию...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const state = searchParams.get('state');

        let user = null;

        // 1. OAuth (Яндекс или VK) — отправляем код в соответствующую Edge-функцию
        if (code) {
          const functionName = state === 'vk' ? 'vk-callback' : 'yandex-callback';
          
          const response = await fetch(`https://tdxaglatoopqqxkblano.supabase.co/functions/v1/${functionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok || data.error) {
            setError(`Ошибка входа через ${state === 'vk' ? 'VK' : 'Яндекс'}: ` + (data.error || 'неизвестная ошибка'));
            setStatus('');
            return;
          }

          if (data.action_link) {
            // Перенаправляем по магической ссылке для создания сессии
            window.location.replace(data.action_link);
            return;
          } else {
            setError('Не получена ссылка для входа');
            setStatus('');
            return;
          }
        }
        // 2. Email (подтверждение почты) — обмениваем token_hash
        else if (token_hash && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (verifyError || !data.user) {
            setError('Не удалось подтвердить email: ' + (verifyError?.message || 'неизвестная ошибка'));
            setStatus('');
            return;
          }
          user = data.user;
        } else {
          setError('Неверная ссылка. Попробуйте войти заново.');
          setStatus('');
          return;
        }

        if (!user) {
          setError('Не удалось получить данные пользователя.');
          setStatus('');
          return;
        }

        // Проверяем, есть ли уже профиль в базе
        const { data: existingProfile } = await supabase
          .from('User')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          router.push('/game');
          return;
        }

        // Если профиля нет — проверяем, откуда пришел игрок
        const pendingUsername = localStorage.getItem('pendingUsername');
        const pendingCountry = localStorage.getItem('pendingCountry');
        const pendingRole = localStorage.getItem('pendingRole') || 'REPORTER';

        // Если есть данные в localStorage — это регистрация через email
        if (pendingUsername && pendingCountry) {
          setStatus('Создаём профиль...');
          const balance = pendingRole === 'BUSINESSMAN' ? 1000 : 500;

          const { error: insertError } = await supabase
            .from('User')
            .insert([{
              id: user.id,
              email: user.email,
              username: pendingUsername,
              country: pendingCountry,
              publicRole: pendingRole,
              balance: balance,
              createdAt: new Date().toISOString(),
              isBanned: false,
            }]);

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
        } 
        // Если данных нет — это первый вход через OAuth (Яндекс)
        else {
          // Генерируем временное имя из email (например, vova из vova@yandex.ru)
          const defaultUsername = user.email?.split('@')[0] || `agent_${user.id.slice(0, 6)}`;
          
          localStorage.setItem('pendingUsername', defaultUsername);
          localStorage.setItem('pendingEmail', user.email || '');
          localStorage.setItem('pendingUserId', user.id);

          // Отправляем на выбор страны
          router.push('/choose-country');
        }
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
              href="/login"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold"
            >
              Вернуться к входу
            </a>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Авторизация</h1>
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