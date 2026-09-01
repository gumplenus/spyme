"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, buttonClassName, inputClassName } from "@/components/formStyles";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/game";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>();

  const onSubmit = async ({ email, password }: LoginValues) => {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setFormError(error.message === "Invalid login credentials"
        ? "Неверный email или пароль."
        : error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Email" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          className={inputClassName}
          placeholder="agent@field.ops"
          {...register("email", {
            required: "Укажите email",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Некорректный email",
            },
          })}
        />
      </Field>
      <Field label="Пароль" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          className={inputClassName}
          {...register("password", {
            required: "Введите пароль",
            minLength: { value: 6, message: "Минимум 6 символов" },
          })}
        />
      </Field>
      {formError ? (
        <p className="mb-3 font-mono text-xs text-danger">{formError}</p>
      ) : null}
      <button type="submit" className={buttonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Проверка допуска…" : "Войти"}
      </button>
      <p className="mt-5 text-center font-mono text-xs text-neon/70">
        Нет доступа?{" "}
        <Link href="/register" className="text-neon underline decoration-neon/40 underline-offset-4">
          Регистрация
        </Link>
      </p>
    </form>
  );
}
