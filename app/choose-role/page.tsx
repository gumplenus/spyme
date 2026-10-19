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

  useEffect(() => {
    const pendingUsername = localStorage.getItem('pendingUsername');
    const pendingEmail = localStorage.getItem('pendingEmail');
    const pendingPassword = localStorage.getItem('pendingPassword');
    const pendingCountry = localStorage.getItem('pendingCountry');

    if (!pendingUsername || !pendingEmail || !pendingPassword || !pendingCountry) {
      router.push('/register');
      return;
    }

    setUsername(pendingUsername);
    setEmail(pendingEmail);
    setPassword(pendingPassword);
    setCountry(pendingCountry);
    setLoading(false);
  }, [router]);

  const selectRole = async (roleId: string) => {
    if (saving) return;

    if (!captchaToken) {
      alert('Пожалуйста, дождитесь проверки капчи');
      return;
    }

    setSaving(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
      },
    });

    if (signUpError) {
      alert('Ошибка регистрации: ' + signUpError.message);
      setSaving(false);
      return;
    }

    if (!signUpData.user) {
      alert('Не удалось создать аккаунт');
      setSaving(false);
      return;
    }

    // Сохраняем роль в localStorage — пригодится в /auth/callback
    localStorage.setItem('pendingRole', roleId);

    // Если email нужно подтвердить — показываем экран ожидания
    if (!signUpData.session) {
      setShowConfirmScreen(true);
      setSaving(false);
      return;
    }

    // Если сессия есть сразу (email уже подтверждён) — создаём профиль здесь
    const balance = roleId === 'BUSINESSMAN' ? 1000 : 500;

    const { error: insertError } = await supabase
      .from('User')
      .insert([
        {
          id: signUpData.user.id,
          email: signUpData.user.email,
          username: username,
          country: country,
          publicRole: roleId,
          balance: balance,
          createdAt: new Date().toISOString(),
          isBanned: false,
        },
      ]);

    if (insertError) {
      console.error('Ошибка создания профиля:', insertError);
      alert('Не удалось создать профиль: ' + insertError.message);
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

  if (loading) return <div className="text-white p-4">Загрузка...</div>;

  if (showConfirmScreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl border border-green-500 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-green-400 mb-4">
            Подтвердите email
          </h1>
          <p className="text-gray-300 mb-3">
            Мы отправили письмо на <span className="text-white font-semibold">{email}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Перейдите по ссылке в письме, чтобы активировать аккаунт.
            Если письмо не пришло, проверьте папку «Спам».
          </p>
          <p className="text-gray-500 text-xs">
            Письмо приходит в течение 1–2 минут.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Link
        href="/choose-country"
        className="absolute top-4 left-4 text-green-400 hover:underline text-sm"
      >
        ← Назад к выбору страны
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-2">SpyMe</h1>
      <p className="text-gray-400 mb-8">Выберите свою роль в игре</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role.id)}
            disabled={saving || !captchaToken}
            className="w-full bg-gray-800 hover:bg-gray-700 transition-colors p-6 rounded-xl border border-gray-700 hover:border-green-400 text-left flex flex-col items-center disabled:opacity-50"
          >
            <span className="text-4xl mb-2">{role.icon}</span>
            <span className="text-lg font-semibold text-white">{role.name}</span>
            <span className="text-sm text-gray-400">{role.desc}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <Turnstile
          siteKey="0x4AAAAAAFXnlmg0qcI0xiLb"
          onSuccess={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken(null)}
          onExpire={() => setCaptchaToken(null)}
        />
      </div>

      {saving && (
        <p className="text-green-400 mt-6">Создаём аккаунт...</p>
      )}
    </div>
  );
}