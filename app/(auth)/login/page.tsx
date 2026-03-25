"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setAuthError(null);
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setAuthError("Credenciales inválidas");
        return;
      }

      router.push("/planilla");
    } catch {
      setAuthError("Credenciales inválidas");
    }
  }

  return (
    <div className="w-full max-w-sm px-4">
      {/* Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">GestionTurnos v2.0</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Sistema de gestión de turnos
        </p>
      </div>

      {/* Glass card */}
      <div
        className="glass rounded-xl p-8 shadow-2xl"
        style={{ border: "1px solid var(--glass-border)" }}
      >
        <h2 className="text-lg font-semibold text-white mb-6">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--border)",
              }}
              placeholder="correo@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "var(--destructive)" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--border)",
              }}
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs mt-1" style={{ color: "var(--destructive)" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Auth error */}
          {authError && (
            <div
              className="mb-4 rounded-lg px-3 py-2 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--destructive)",
              }}
            >
              {authError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg py-2 px-4 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
