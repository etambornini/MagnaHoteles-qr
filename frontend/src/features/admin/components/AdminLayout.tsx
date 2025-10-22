import { NavLink, Outlet } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useHotels } from "@/features/hotels/hooks";

const adminNav = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Hoteles", to: "/admin/hotels", requiresAdmin: true },
  { label: "Productos", to: "/admin/products" },
  { label: "Categorías", to: "/admin/categories" },
];

export const AdminLayout = () => {
  const { user, logout, isAdmin, activeHotel, setActiveHotel } = useAuth();
  const { data: hotelsResponse } = useHotels({ pageSize: 100 });

  const hotels = useMemo(() => hotelsResponse?.items ?? [], [hotelsResponse?.items]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-xl px-4 py-2 text-sm font-semibold transition",
      isActive ? "bg-red-600 text-white" : "text-gray-300 hover:bg-zinc-800 hover:text-white",
    ].join(" ");

  const hotelOptions = useMemo(() => {
    if (!isAdmin) {
      return activeHotel ? [activeHotel] : [];
    }
    return hotels;
  }, [isAdmin, hotels, activeHotel]);

  return (
    <div className="min-h-screen bg-brand-background text-gray-100">
      <header className="border-b border-zinc-800/60 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-red-400">Panel administrativo</p>
            <h1 className="text-2xl font-semibold text-white">Magna Hoteles</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isAdmin ? (
              <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Hotel activo
                <select
                  value={activeHotel?.slug ?? ""}
                  onChange={(event) => {
                    const selected = hotels.find((hotel) => hotel.slug === event.target.value);
                    setActiveHotel(selected ? { id: selected.id, name: selected.name, slug: selected.slug } : null);
                  }}
                  className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-red-500"
                >
                  <option value="">Selecciona un hotel</option>
                  {hotelOptions.map((hotel) => (
                    <option key={hotel.slug} value={hotel.slug}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : activeHotel ? (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Hotel asignado</p>
                <p className="text-sm font-semibold text-white">{activeHotel.name}</p>
              </div>
            ) : null}
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Usuario</p>
              <p className="text-sm font-semibold text-white">{user?.email}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-2 inline-flex items-center rounded-xl border border-red-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-200 transition hover:bg-red-600/30"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-16 pt-10 lg:flex-row">
        <aside className="w-full lg:w-64">
          <nav className="flex flex-row gap-2 overflow-x-auto rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-3 lg:flex-col">
            {adminNav
              .filter((item) => !item.requiresAdmin || isAdmin)
              .map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass} end={item.to === "/admin/dashboard"}>
                {item.label}
              </NavLink>
              ))}
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
