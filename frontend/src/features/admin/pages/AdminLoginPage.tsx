import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

const loginSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const AdminLoginPage = () => {
  const { isAuthenticated, login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated) {
    const redirectPath = typeof location.state === "object" && location.state?.from ? location.state.from : "/admin/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setErrorMessage(null);
      const response = await login(values);
      const redirectPath =
        typeof location.state === "object" && location.state?.from ? location.state.from : "/admin/dashboard";
      navigate(redirectPath, { replace: true });
      return response;
    } catch (error) {
      setErrorMessage("Credenciales inválidas o usuario no autorizado.");
      console.error(error);
    }
    return undefined;
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-8 rounded-3xl border border-zinc-800/60 bg-zinc-900/40 px-8 py-10 shadow-2xl shadow-red-900/30">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-red-400">acceso restringido</p>
        <h1 className="text-3xl font-semibold text-white">Iniciar sesión</h1>
        <p className="text-sm text-gray-300">
          Ingresa tus credenciales para administrar catálogos, productos y categorías.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Correo electrónico</label>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            placeholder="admin@hotel.com"
          />
          {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Contraseña</label>
          <input
            type="password"
            {...register("password")}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            placeholder="********"
          />
          {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-800/70 bg-red-950/20 px-4 py-3 text-xs text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isAuthenticating}
          className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {isAuthenticating ? "Accediendo..." : "Ingresar"}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500">
        <p>
          ¿Necesitas una cuenta? Contacta al administrador del sistema para crear usuarios con rol administrador o
          manager.
        </p>
      </div>
    </div>
  );
};
