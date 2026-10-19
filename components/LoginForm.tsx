'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Пожалуйста, дождитесь проверки капчи');
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { data: profile } = await supabase
        .from('User')
        .select('country, publicRole')
        .eq('id', data.user.id)
        .single();

      if (!profile?.country || !profile?.publicRole) {
        await supabase.auth.signOut();
        alert('Профиль не завершён. Пожалуйста, зарегистрируйтесь заново.');
        router.push('/register');
        return;
      }

      router.push('/game');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="agent@spyme.ru"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Пароль</label>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-400 flex items-center justify-center"
            tabIndex={-1}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <Turnstile
          siteKey="0x4AAAAAAFXnlmg0qcI0xiLb"
          onSuccess={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken(null)}
          onExpire={() => setCaptchaToken(null)}
        />
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !captchaToken}
        className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>

            <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-800 text-gray-400">или</span>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: 'custom:yandex',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });
        }}
        className="w-full bg-[#FC3F1D] hover:bg-[#E53818] transition-colors text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8 1.6H8.6C5.2 1.6 3 3.8 3 7.5C3 10.6 4.8 12.6 7.8 13.4L2.6 22.4H6.6L12.4 11.9H13.6V22.4H17V1.6H12.8ZM13.6 8.9H12.2C10 8.9 8.8 8 8.8 6C8.8 4.1 9.9 3.2 12 3.2H13.6V8.9Z" />
        </svg>
        Войти через Яндекс
      </button>

<p className="text-center">
        <Link href="/forgot-password" className="text-gray-400 hover:text-green-400 text-sm">
          Забыли пароль?
        </Link>
      </p>

      <p className="text-gray-400 text-sm mt-4 text-center">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-green-400 hover:underline">
          Зарегистрируйтесь
        </Link>
      </p>
    </form>
  );
}