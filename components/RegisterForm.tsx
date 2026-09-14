"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Проверка: имя не должно быть пустым
    if (!username.trim()) {
      setError("Введите ваше имя");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    // 1. Регистрация в Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Ошибка регистрации");
      setIsLoading(false);
      return;
    }

    if (data?.user) {
      // 2. Создаём запись в таблице User
      const { error: insertError } = await supabase
        .from("User")
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            username: username.trim(), // ← имя, которое ввёл пользователь
            passwordHash: " ", // временное значение
            isSpy: false,
            spyActivated: false,
            spyMissionProgress: 0,
            spyMissionCompleted: false,
            // Поля, которые заполнятся позже
            country: null,
            publicRole: null,
            balance: 500,
            reputation: 0,
            energy: 100,
            power: 100,
            trustRating: 50,
            businessReputation: 50,
            diplomaticShield: 0,
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            gameCycleId: null,
            isBanned: false,
            onboardingEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);

      if (insertError) {
        console.error("Ошибка создания пользователя:", insertError);
        setError("Не удалось создать профиль");
        setIsLoading(false);
        return;
      }

      router.push("/choose-country");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* НОВОЕ ПОЛЕ: Имя пользователя */}
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="••••••••"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">Подтверждение пароля</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-400"
          placeholder="••••••••"
          required
        />
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
        {isLoading ? "Регистрация..." : "Зарегистрироваться"}
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