'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    );

    if (resetError) {
      // Не раскрываем, существует ли email — показываем нейтральное сообщение
      console.error('Ошибка сброса:', resetError);
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl border border-green-500 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-green-400 mb-4">Проверьте почту</h1>
          <p className="text-gray-300 mb-3">
            Если адрес <span className="text-white font-semibold">{email}</span> зарегистрирован,
            мы отправили письмо со ссылкой для сброса пароля.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Проверьте папку «Спам», если письмо не пришло.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold"
          >
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-400 mb-2 text-center">Сброс пароля</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Введите email, на который зарегистрирован аккаунт
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6 text-center">
          <Link href="/login" className="text-green-400 hover:underline">
            ← Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
}