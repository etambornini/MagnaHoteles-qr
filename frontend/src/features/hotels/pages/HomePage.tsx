import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useHotels } from "../hooks";

const HotelCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6">
    <div className="mb-4 h-6 w-32 rounded bg-zinc-800/70" />
    <div className="mb-3 h-4 w-full rounded bg-zinc-800/70" />
    <div className="mb-3 h-4 w-10/12 rounded bg-zinc-800/70" />
    <div className="h-10 w-28 rounded bg-zinc-800/70" />
  </div>
);

export const HomePage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<{ search?: string }>({});
  const handleSeeHotelsClick = () => {
    const section = document.getElementById("hotelCardSection");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchValue.trim();
    setFilters(trimmed ? { search: trimmed } : {});
  };

  const { data, isLoading, isError, refetch, isFetching } = useHotels({
    search: filters.search,
    pageSize: 12,
  });

  const hotels = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="space-y-16">
      <section className="rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-red-600/20 via-transparent to-black/40 px-6 py-16 shadow-xl shadow-red-950/60 sm:px-10">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-red-400">Experiencias QR</p>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">
          Más que una carta, una experiencia interactiva
          </h1>
          <p className="text-lg text-gray-300">
           Una experiencia visual que refleja la identidad, el estilo y la esencia de cada establecimiento del grupo Magna Hoteles.
           
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleSeeHotelsClick}
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Ver Hoteles
            </button>
            {/* <Link
              to="/admin/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-red-600 hover:text-white"
            >
              Acceder al panel administrativo
            </Link> */}
          </div>
        </div>
      </section>

      <section className="space-y-8" id="hotelCardSection">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">Hoteles disponibles</h2>
            <p className="text-sm text-gray-400">
              Selecciona un hotel para explorar su carta digital en tiempo real.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar por nombre o slug"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            />
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Buscar
            </button>
          </form>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-red-800/70 bg-red-950/30 p-8 text-sm text-red-200">
            <p className="font-semibold">No fue posible cargar la lista de hoteles.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center rounded-lg border border-red-500 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-600/30"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading || isFetching ? (
            Array.from({ length: 6 }).map((_, index) => <HotelCardSkeleton key={index} />)
          ) : hotels.length ? (
            hotels.map((hotel) => {
              const metadata = hotel.metadata;
              const locationAddress =
                typeof metadata?.location?.address === "string" && metadata.location.address.trim()
                  ? metadata.location.address.trim()
                  : null;
              const contactPhone =
                typeof metadata?.contact?.phone === "string" && metadata.contact.phone.trim()
                  ? metadata.contact.phone.trim()
                  : null;

              return (
                <article
                  key={hotel.id}
                  className="group relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6 transition hover:-translate-y-1 hover:border-red-600/60 hover:shadow-2xl hover:shadow-red-900/40"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-600/30 via-transparent to-black/60" />
                  </div>
                  <div className="relative space-y-4">
                    <div>
                      <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-red-300">
                        {hotel.slug}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-white">{hotel.name}</h3>
                    </div>
                    <p className="line-clamp-3 text-sm text-gray-300">
                      {hotel.description ?? "Sin descripción disponible."}
                    </p>
                    {locationAddress || contactPhone ? (
                      <div className="space-y-1 text-xs text-gray-400">
                        {locationAddress ? <p>Dirección: {locationAddress}</p> : null}
                        {contactPhone ? <p>Teléfono: {contactPhone}</p> : null}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/hotel/${hotel.slug}`}
                        className="inline-flex items-center rounded-full bg-red-600/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-red-500"
                      >
                        Ver catálogo
                      </Link>
                      <span className="text-xs text-gray-400">ID: {hotel.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-8 text-center text-sm text-gray-300">
              No se encontraron hoteles con los filtros actuales.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
