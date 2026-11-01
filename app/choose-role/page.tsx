'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

const ROLES = [
  { id: 'REPORTER', name: 'Репортер', icon: '📰', desc: 'Пишу новости и расследую' },
  { id: 'BUSINESSMAN', name: 'Бизнесмен', icon: '💼', desc: 'Торгую и инвестирую' },
  { id: 'POLITICIAN', name: 'Политик', icon: '🏛️', desc: 'Веду дипломатию' },
  { id: 'MILITARY', name: 'Военный', icon: '⚔️', desc: 'Защищаю страну' },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [isOAuth, setIsOAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const pendingUsername = localStorage.getItem('pendingUsername') || session?.user?.user_metadata?.pendingUsername;
      const pendingCountry = localStorage.getItem('pendingCountry') || session?.user?.user_metadata?.pendingCountry;

      if (!pendingUsername || !pendingCountry) {
        if (session) {
          router.push('/choose-country');
        } else {
          router.push('/register');
        }
        return;
      }

      setUsername(pendingUsername);
      setCountry(pendingCountry);

      if (session?.user) {
        setIsOAuth(true);
        setEmail(session.user.email || '');
      } else {
        const pendingEmail = localStorage.getItem('pendingEmail');
        const pendingPassword = localStorage.getItem('pendingPassword');
        if (!pendingEmail || !pendingPassword) {
          router.push('/register');
          return;
        }
        setEmail(pendingEmail);
        setPassword(pendingPassword);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  const selectRole = async (roleId: string) => {
    if (saving) return;
    if (!username.trim()) {
      setErrorMessage('Введите ваш позывной');
      return;
    }
    setSaving(true);

    // ВЕТКА 1: OAuth (Яндекс или VK)
    if (isOAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setErrorMessage('Сессия истекла. Войдите заново.');
        setSaving(false);
        router.push('/login');
        return;
      }

      const user = session.user;
      const balance = roleId === 'BUSINESSMAN' ? 1000 : 500;

      const { error: insertError } = await supabase
        .from('User')
        .upsert([{
          id: user.id,
          email: user.email,
          username: username.trim(),
          country: country,
          publicRole: roleId,
          balance: balance,
          createdAt: new Date().toISOString(),
          isBanned: false,
        }], { onConflict: 'id' });

      if (insertError) {
        if (insertError.message.includes('User_username_key')) {
          setErrorMessage('Этот позывной уже занят. Придумайте другой и нажмите на роль еще раз.');
        } else {
          setErrorMessage('Не удалось создать профиль: ' + insertError.message);
        }
        setSaving(false);
        return;
      }

      localStorage.removeItem('pendingUsername');
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingPassword');
      localStorage.removeItem('pendingCountry');
      localStorage.removeItem('pendingRole');
      
      router.push('/game');
      router.refresh();
      return;
    }

    // ВЕТКА 2: Email
    if (!captchaToken) {
      setErrorMessage('Пожалуйста, дождитесь проверки капчи');
      setSaving(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        captchaToken,
        emailRedirectTo: 'https://spyme.com.ru/auth/callback',
        data: { 
          pendingUsername: username.trim(), 
          pendingCountry: country, 
          pendingRole: roleId 
        }
      },
    });

    if (signUpError) {
      setErrorMessage('Ошибка регистрации: ' + signUpError.message);
      setSaving(false);
      return;
    }

    if (!signUpData.user) {
      setErrorMessage('Не удалось создать аккаунт');
      setSaving(false);
      return;
    }

    localStorage.setItem('pendingRole', roleId);

    if (!signUpData.session) {
      setShowConfirmScreen(true);
      setSaving(false);
      return;
    }

    const balance = roleId === 'BUSINESSMAN' ? 1000 : 500;

    const { error: insertError } = await supabase
      .from('User')
      .upsert([{
        id: signUpData.user.id,
        email: signUpData.user.email,
        username: username.trim(),
        country: country,
        publicRole: roleId,
        balance: balance,
        createdAt: new Date().toISOString(),
        isBanned: false,
      }], { onConflict: 'id' });

    if (insertError) {
      if (insertError.message.includes('User_username_key')) {
        setErrorMessage('Этот позывной уже занят. Придумайте другой и нажмите на роль еще раз.');
      } else {
        setErrorMessage('Не удалось создать профиль: ' + insertError.message);
      }
      setSaving(false);
      return;
    }

    localStorage.removeItem('pendingUsername');
    localStorage.removeItem('pendingEmail');
    localStorage.removeItem('pendingPassword');
    localStorage.removeItem('pendingCountry');
    localStorage.removeItem('pendingRole');

    router.push('/game');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center font-mono">
        <div className="text-[#39ff14] text-xl animate-pulse">_ ВЫБОР_ДОПУСКА...</div>
      </div>
    );
  }

  if (showConfirmScreen) {
    return (
      <div className="min-h-screen bg-[#050807] flex flex-col items-center justify-center p-4 font-mono pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="border border-[#39ff14]/50 p-8 w-full max-w-md text-center bg-[#0a0f0d] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
          <div className="text-4xl mb-4 text-[#39ff14]">[ MAIL ]</div>
          <h1 className="text-sm font-bold text-[#39ff14] mb-4 tracking-widest uppercase">ПОДТВЕРДИТЕ_EMAIL</h1>
          <p className="text-gray-400 text-xs mb-3">
            Мы отправили письмо на <span className="text-white font-semibold">{email}</span>
          </p>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider">
            Перейдите по ссылке в письме, чтобы активировать аккаунт.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] flex items-center gap-3">
        <Link href="/choose-country" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ ВЫБОР_РОЛИ ]</h1>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+80px)] px-4 pb-4 flex flex-col items-center min-h-screen">
        <h1 className="text-2xl font-bold text-[#39ff14] mb-2 mt-4 text-center tracking-widest">[ SPY_ME ]</h1>
        <p className="text-gray-500 mb-6 text-center text-xs uppercase tracking-wider">Выберите вашу роль</p>
        
        <div className="w-full max-w-2xl mb-8">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Ваш_позывной</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-transparent text-[#39ff14] border border-gray-700 focus:outline-none focus:border-[#39ff14] text-sm rounded-none placeholder-gray-700"
            placeholder="Агент Смит"
            required
          />
          <p className="text-gray-600 text-[10px] mt-1 uppercase tracking-wider">Если имя занято, придумайте другое.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => selectRole(role.id)}
              disabled={saving || (!isOAuth && !captchaToken)}
              className="w-full bg-[#0a0f0d] hover:bg-[#39ff14]/10 transition-colors p-4 border border-gray-800 hover:border-[#39ff14] text-left flex flex-col items-center disabled:opacity-50 group rounded-none"
            >
              <span className="text-3xl mb-2">{role.icon}</span>
              <span className="text-sm font-semibold text-white group-hover:text-[#39ff14] transition-colors">{role.name}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{role.desc}</span>
            </button>
          ))}
        </div>

        {!isOAuth && (
          <div className="mt-8">
            <Turnstile
              siteKey="0x4AAAAAAFXnlmg0qcI0xiLb"
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ refreshExpired: 'auto' }}
            />
          </div>
        )}

        {saving && <p className="text-[#39ff14] mt-6 text-xs uppercase tracking-wider animate-pulse">Создаём_аккаунт...</p>}
      </div>

      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="border border-red-500 p-6 w-full max-w-md bg-[#050807] text-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <div className="text-4xl mb-3 text-red-500">[ X ]</div>
            <p className="text-gray-300 text-sm mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full px-4 py-3 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs font-semibold rounded-none transition-colors"
            >
              ПОНЯТНО
            </button>
          </div>
        </div>
      )}
    </div>
  );
}