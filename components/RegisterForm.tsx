"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, buttonClassName, inputClassName } from "@/components/formStyles";

type RegisterValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>();

  const password = watch("password");

  const onSubmit = async ({ email, password }: RegisterValues) => {
    setFormError(null);
    const supabase = createClient();
    const origin = window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    router.push("/register/confirm");
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
          autoComplete="new-password"
          className={inputClassName}
          {...register("password", {
            required: "Придумайте пароль",
            minLength: { value: 6, message: "Минимум 6 символов" },
          })}
        />
      </Field>
      <Field label="Подтверждение пароля" error={errors.confirmPassword?.message}>
        <input
          type="password"
          autoComplete="new-password"
          className={inputClassName}
          {...register("confirmPassword", {
            required: "Повторите пароль",
            validate: (value) =>
              value === password || "Пароли не совпадают",
          })}
        />
      </Field>
      {formError ? (
        <p className="mb-3 font-mono text-xs text-danger">{formError}</p>
      ) : null}
      <button type="submit" className={buttonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Создание досье…" : "Зарегистрироваться"}
      </button>
      <p className="mt-5 text-center font-mono text-xs text-neon/70">
        Уже в сети?{" "}
        <Link href="/login" className="text-neon underline decoration-neon/40 underline-offset-4">
          Войти
        </Link>
      </p>
    </form>
  );
}
