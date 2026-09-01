"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, ROLES, type CountryCode, type RoleId } from "@/lib/game/options";
import { Field, buttonClassName, inputClassName } from "@/components/formStyles";

type OnboardingValues = {
  country: CountryCode;
  role: RoleId;
};

export function OnboardingForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    defaultValues: {
      country: "RU",
      role: "spy",
    },
  });

  const onSubmit = async ({ country, role }: OnboardingValues) => {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { country, role },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push("/game");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Страна прикрытия" error={errors.country?.message}>
        <select
          className={inputClassName}
          {...register("country", { required: "Выберите страну" })}
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Роль" error={errors.role?.message}>
        <div className="grid gap-2">
          {ROLES.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-start gap-3 border border-neon/20 bg-ink/60 px-3 py-2 hover:border-neon/60"
            >
              <input
                type="radio"
                value={role.id}
                className="mt-1 accent-[#39ff14]"
                {...register("role", { required: "Выберите роль" })}
              />
              <span>
                <span className="block font-mono text-sm text-neon">{role.label}</span>
                <span className="block font-mono text-[11px] text-neon/55">{role.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>
      {formError ? (
        <p className="mb-3 font-mono text-xs text-danger">{formError}</p>
      ) : null}
      <button type="submit" className={buttonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Сохранение легенды…" : "Выйти на задание"}
      </button>
    </form>
  );
}
