import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import logo from "../../img/logo-white.png";
const navigation = [
  { name: "Inicio", to: "/" },
  { name: "Administración", to: "/admin/login" },
];

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "text-white" : "text-gray-300 hover:text-white",
  ].join(" ");

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-background text-gray-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-brand-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-wide text-white md:text-xl">
           <img
              src={logo}
              alt="Magna Hoteles"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClasses} end={item.to === "/"}>
                {item.name}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Abrir menú"
            className="rounded-md border border-zinc-700 p-2 text-gray-300 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
        {mobileOpen ? (
          <div className="border-t border-zinc-800/60 bg-brand-background md:hidden">
            <nav className="flex flex-col px-6 py-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-red-600 text-white" : "text-gray-300 hover:bg-zinc-800 hover:text-white",
                    ].join(" ")
                  }
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800/60 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Magna Hoteles. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:programacion@pedraza.com.ar"
              className="hover:text-white"
            >
              Soporte
            </a>
            <a href="https://magnahoteles.com" target="_blank" rel="noreferrer" className="hover:text-white">
              Sitio corporativo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
