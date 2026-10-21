'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Проверяем авторизацию...');
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для запроса email (если VK его не отдал)
  const [needsEmail, setNeedsEmail] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [vkName, setVkName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const state = searchParams.get('state');
        const device_id = searchParams.get('device_id');

        // 1. Возврат с магической ссылки VK (после ввода email)
        if (state === 'magiclink') {
          setStatus('Проверяем сессию...');
          
          // Даем Supabase JS время обработать токены из URL
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            setError('Не удалось получить сессию. Попробуйте войти заново.');
            setStatus('');
            return;
          }

          // Проверяем, есть ли уже профиль в базе
          const { data: existingProfile } = await supabase
            .from('User').select('id').eq('id', session.user.id).single();

          if (existingProfile) {
            router.push('/game');
          } else {
            // Профиля нет — отправляем на выбор страны (данные в localStorage уже есть)
            router.push('/choose-country');
          }
          return;
        }

        // 2. OAuth (Яндекс) — отправляем код в Edge-функцию
        if (code && state !== 'vk') {
          const response = await fetch(`https://tdxaglatoopqqxkblano.supabase.co/functions/v1/yandex-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok || data.error) {
            setError(`Ошибка входа через Яндекс: ` + (data.error || 'неизвестная ошибка'));
            setStatus('');
            return;
          }

          if (data.action_link) {
            window.location.replace(data.action_link);
            return;
          }
        }
        // 3. OAuth (VK) — первый заход, получаем код от VK
        else if (code && state === 'vk') {
          const response = await fetch(`https://tdxaglatoopqqxkblano.supabase.co/functions/v1/vk-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code, 
              code_verifier: sessionStorage.getItem('vk_code_verifier'),
              device_id: device_id 
            }),
          });

          const data = await response.json();

          if (!response.ok || (data.error && !data.needs_email)) {
            setError(`Ошибка входа через VK: ` + (data.error || 'неизвестная ошибка'));
            setStatus('');
            return;
          }

          if (data.needs_email) {
            setNeedsEmail(true);
            setTempToken(data.temp_token);
            setVkName(data.vk_name || '');
            setStatus('');
            return;
          }

          if (data.action_link) {
            window.location.replace(data.action_link);
            return;
          }
        }
        // 4. Email (подтверждение почты)
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
          
          const { data: existingProfile } = await supabase
            .from('User').select('id').eq('id', data.user.id).single();

          if (existingProfile) {
            router.push('/game');
            return;
          }

          const pendingUsername = localStorage.getItem('pendingUsername');
          const pendingCountry = localStorage.getItem('pendingCountry');
          const pendingRole = localStorage.getItem('pendingRole') || 'REPORTER';

          if (pendingUsername && pendingCountry) {
            setStatus('Создаём профиль...');
            const balance = pendingRole === 'BUSINESSMAN' ? 1000 : 500;

            const { error: insertError } = await supabase
              .from('User')
              .insert([{
                id: data.user.id, email: data.user.email, username: pendingUsername,
                country: pendingCountry, publicRole: pendingRole,
                balance: balance, createdAt: new Date().toISOString(), isBanned: false,
              }]);

            if (insertError) {
              setError('Не удалось создать профиль: ' + insertError.message);
              setStatus('');
              return;
            }

            localStorage.clear();
            router.push('/game');
            router.refresh();
          } else {
            router.push('/choose-country');
          }
          return;
        } else {
          setError('Неверная ссылка. Попробуйте войти заново.');
          setStatus('');
          return;
        }
      } catch (err: any) {
        setError('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
        setStatus('');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  // Обработчик отправки email вручную (для VK)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !tempToken) return;
    
    setIsSubmittingEmail(true);

    localStorage.setItem('pendingEmail', manualEmail.trim());
    localStorage.setItem('pendingUsername', vkName);
    
    try {
      const response = await fetch(`https://tdxaglatoopqqxkblano.supabase.co/functions/v1/vk-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          temp_token: tempToken, 
          email: manualEmail.trim(),
          code_verifier: sessionStorage.getItem('vk_code_verifier')
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Не удалось завершить регистрацию');
        setIsSubmittingEmail(false);
        return;
      }

      if (data.action_link) {
        window.location.replace(data.action_link);
      } else {
        setError('Не получена ссылка для входа');
        setIsSubmittingEmail(false);
      }
    } catch (err: any) {
      setError('Ошибка: ' + err.message);
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-green-500 max-w-md w-full">
        
        {error ? (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">Ошибка</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <a href="/login" className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold">
              Вернуться к входу
            </a>
          </div>
        ) : needsEmail ? (
          <div>
            <div className="text-6xl mb-4 text-center">📧</div>
            <h1 className="text-2xl font-bold text-green-400 mb-2 text-center">Введите ваш email</h1>
            <p className="text-gray-300 mb-6 text-center text-sm">
              Привет, <span className="font-semibold text-white">{vkName}</span>!<br/>
              VK не передал нам вашу почту. Пожалуйста, укажите её для завершения регистрации.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
                  placeholder="agent@spyme.ru"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="w-full bg-[#0077FF] hover:bg-[#0066DD] transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {isSubmittingEmail ? 'Регистрация...' : 'Продолжить'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Авторизация</h1>
            <p className="text-gray-300">{status}</p>
          </div>
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