import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="mx-auto max-w-lg rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-10 text-center">
    <h1 className="text-3xl font-semibold text-white">Página no encontrada</h1>
    <p className="mt-4 text-sm text-gray-300">
      La página que buscas no existe o ha sido movida. Verifica la dirección e inténtalo nuevamente.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
    >
      Volver al inicio
    </Link>
  </div>
);
