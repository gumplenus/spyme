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
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (verifyError) {
          setError('Ссылка недействительна или истекла. Запросите новую.');
          return;
        }
      }

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
      <div className="min-h-screen bg-[#050807] flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] font-mono">
        <div className="border border-red-500/50 p-8 w-full max-w-md text-center bg-[#0a0f0d] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="text-4xl mb-4 text-red-500">[ X ]</div>
          <h1 className="text-sm font-bold text-red-500 mb-4 tracking-widest uppercase">ОШИБКА</h1>
          <p className="text-gray-400 text-xs mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-3 border border-gray-600 text-gray-300 hover:text-[#39ff14] hover:border-[#39ff14] rounded-none text-xs font-semibold tracking-wider transition-colors"
          >
            &lt; ЗАПРОСИТЬ_ССЫЛКУ
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ПРОВЕРКА_ССЫЛКИ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] font-mono">
      <div className="border border-[#39ff14]/50 p-8 w-full max-w-md bg-[#0a0f0d] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
        <h1 className="text-sm font-bold text-[#39ff14] mb-2 text-center tracking-widest uppercase">НОВЫЙ_ПАРОЛЬ</h1>
        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-6 text-center">Придумайте новый пароль для входа</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">ПОДТВЕРЖДЕНИЕ_ПАРОЛЯ</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-700"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] font-semibold py-3 rounded-none text-xs tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ_ПАРОЛЬ'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ЗАГРУЗКА...</div>
      </div>
    }>
      <ResetPasswordHandler />
    </Suspense>
  );
}