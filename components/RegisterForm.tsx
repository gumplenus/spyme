"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkUnique = async (field: "email" | "username", value: string) => {
    const res = await fetch("/api/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !data.exists;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Введите ваше имя");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      // Проверка email
      const emailFree = await checkUnique("email", email.trim());
      if (!emailFree) {
        setError("Этот email уже зарегистрирован. Войдите или используйте другой.");
        setIsLoading(false);
        return;
      }

      // Проверка имени
      const usernameFree = await checkUnique("username", username.trim());
      if (!usernameFree) {
        setError("Это имя уже занято. Придумайте другое.");
        setIsLoading(false);
        return;
      }

      // Всё свободно — сохраняем в localStorage
      localStorage.setItem("pendingUsername", username.trim());
      localStorage.setItem("pendingEmail", email.trim());
      localStorage.setItem("pendingPassword", password);

      router.push("/choose-country");
    } catch (err) {
      setError("Ошибка проверки данных. Попробуйте ещё раз.");
      setIsLoading(false);
    }
  };

  const EyeIcon = ({ crossed }: { crossed: boolean }) =>
    crossed ? (
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
    );

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Ваше имя</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="Агент Смит"
          required
        />
      </div>

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
            type={showPassword ? "text" : "password"}
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
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            <EyeIcon crossed={showPassword} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">Подтверждение пароля</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 pr-11 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-400 flex items-center justify-center"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            <EyeIcon crossed={showConfirmPassword} />
          </button>
        </div>
      </div>

      {error && typeof error === "string" && (
        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        {isLoading ? "Проверка..." : "Зарегистрироваться"}
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
        onClick={() => {
          const clientId = '2ba54608b95e4966a1e9ac1eb7524058';
          const redirectUri = 'https://spyme.com.ru/auth/callback';
          const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
          window.location.href = authUrl;
        }}
        className="w-full bg-[#FC3F1D] hover:bg-[#E53818] transition-colors text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8 1.6H8.6C5.2 1.6 3 3.8 3 7.5C3 10.6 4.8 12.6 7.8 13.4L2.6 22.4H6.6L12.4 11.9H13.6V22.4H17V1.6H12.8ZM13.6 8.9H12.2C10 8.9 8.8 8 8.8 6C8.8 4.1 9.9 3.2 12 3.2H13.6V8.9Z" />
        </svg>
        Войти через Яндекс
      </button>

      <p className="text-gray-400 text-sm mt-4 text-center">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-green-400 hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}