'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

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
        router.push('/choose-country');
        return;
      }

      router.push('/game');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 font-mono">
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-700"
          placeholder="agent@spyme.ru"
          required
        />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">ПАРОЛЬ</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-11 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-700"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#39ff14] flex items-center justify-center transition-colors"
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

      {error && <div className="text-red-500 text-xs border border-red-500/50 p-3 bg-red-900/10 rounded-none">[ ОШИБКА ] {error}</div>}

      <button
        type="submit"
        disabled={loading || !captchaToken}
        className="w-full bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] font-semibold py-3 rounded-none text-xs tracking-wider transition-colors disabled:opacity-50"
      >
        {loading ? 'ВХОД...' : 'ВОЙТИ'}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="px-2 bg-[#0a0f0d] text-gray-500">или</span>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          const clientId = '2ba54608b95e4966a1e9ac1eb7524058';
          const isNative = Capacitor.isNativePlatform();
          const redirectUri = isNative ? 'spyme://auth/callback' : 'https://spyme.com.ru/auth/callback';
          const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=yandex`;
          
          if (isNative) {
            window.open(authUrl, '_system');
          } else {
            window.location.href = authUrl;
          }
        }}
        className="w-full bg-[#FC3F1D]/10 hover:bg-[#FC3F1D]/20 border border-[#FC3F1D] text-[#FC3F1D] transition-colors font-semibold py-3 rounded-none text-xs tracking-wider flex items-center justify-center gap-2 mb-2"
      >
        ВОЙТИ_ЧЕРЕЗ_ЯНДЕКС
      </button>

      <button
        type="button"
        onClick={async () => {
          const array = new Uint32Array(56 / 2);
          window.crypto.getRandomValues(array);
          const codeVerifier = Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
          
          const encoder = new TextEncoder();
          const data = encoder.encode(codeVerifier);
          const digest = await window.crypto.subtle.digest('SHA-256', data);
          
          const bytes = new Uint8Array(digest);
          let binary = '';
          for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
          
          const base64 = btoa(binary);
          const codeChallenge = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          
          localStorage.setItem('vk_code_verifier', codeVerifier);

          const isNative = Capacitor.isNativePlatform();
          const clientId = isNative ? '54869710' : '54837536';
          const redirectUri = isNative ? 'vk54869710://vk.ru/blank.html' : 'https://spyme.com.ru/auth/callback';
          
          // СОХРАНЯЕМ ПАРАМЕТРЫ ДЛЯ EDGE-ФУНКЦИИ
          localStorage.setItem('vk_client_id', clientId);
          localStorage.setItem('vk_redirect_uri', redirectUri);
          
          const authUrl = `https://id.vk.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email&state=vk&code_challenge=${codeChallenge}&code_challenge_method=S256`;
          
          if (isNative) {
            try {
              await Browser.open({ url: authUrl });
            } catch (err: any) {
              alert('Ошибка открытия браузера: ' + err.message);
            }
          } else {
            window.location.href = authUrl;
          }
        }}
        className="w-full bg-[#0077FF]/10 hover:bg-[#0077FF]/20 border border-[#0077FF] text-[#0077FF] transition-colors font-semibold py-3 rounded-none text-xs tracking-wider flex items-center justify-center gap-2"
      >
        ВОЙТИ_ЧЕРЕЗ_VK
      </button>

      <p className="text-gray-500 text-xs mt-4 text-center uppercase tracking-wider">
        <Link href="/forgot-password" className="hover:text-[#39ff14] transition-colors underline underline-offset-4 decoration-gray-600">
          Забыли пароль?
        </Link>
      </p>

      <p className="text-gray-500 text-xs text-center uppercase tracking-wider">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-[#39ff14] hover:text-white transition-colors underline underline-offset-4 decoration-[#39ff14]/30">
          Зарегистрируйтесь
        </Link>
      </p>
    </form>
  );
}