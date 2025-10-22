import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminListCategories, adminListProducts } from "@/features/admin/api";
import { useAdminHotelContext } from "@/features/admin/hooks";
import { useHotelBySlug } from "@/features/hotels/hooks";
import type { HotelMetadata } from "@/features/hotels/types";
import { resolveAssetUrl } from "@/lib/assets";

const formatCurrency = (value?: string | null) => {
  if (!value) return "-";
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(parsed);
};

const getStringValue = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const AdminDashboardPage = () => {
  const { token, isAdmin, hotelIdentifier, activeHotel } = useAdminHotelContext();
  const tokenAvailable = Boolean(token);
  const hotelReady = !isAdmin || Boolean(hotelIdentifier);
  const slugForDetails = hotelReady ? activeHotel?.slug ?? undefined : undefined;

  const { data: selectedHotel, isLoading: isLoadingHotelDetails } = useHotelBySlug(slugForDetails);

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", hotelIdentifier],
    queryFn: () => adminListCategories(token!, hotelIdentifier, {}),
    enabled: tokenAvailable && hotelReady,
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products", hotelIdentifier],
    queryFn: () => adminListProducts(token!, hotelIdentifier, {}),
    enabled: tokenAvailable && hotelReady,
  });

  const categories = categoriesQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? [];

  if (!tokenAvailable) {
    return (
      <div className="rounded-3xl border border-red-800/60 bg-red-950/20 p-8 text-sm text-red-200">
        No se encontró un token de autenticación. Vuelve a iniciar sesión.
      </div>
    );
  }

  if (!hotelReady) {
    return (
      <div className="rounded-3xl border border-yellow-800/60 bg-yellow-900/20 p-8 text-sm text-yellow-200">
        Selecciona un hotel para visualizar sus indicadores.
      </div>
    );
  }

  const activeProductsCount = products.filter((product) => product.isActive).length;
  const uncategorizedCount = products.filter((product) => !(product.categories?.length ?? 0)).length;

  const metadata = (selectedHotel?.metadata ?? null) as HotelMetadata | null;
  const locationAddress = getStringValue(metadata?.location?.address);
  const contactPhone = getStringValue(metadata?.contact?.phone);
  const contactEmail = getStringValue(metadata?.contact?.email);
  const contactWhatsapp = getStringValue(metadata?.contact?.whatsapp);
  const rawQrImage = getStringValue(selectedHotel?.imgQr);
  const qrImageUrl = resolveAssetUrl(rawQrImage);

  const shareUrl = selectedHotel
    ? typeof window !== "undefined"
      ? `${window.location.origin}/hotel/${selectedHotel.slug}`
      : `/hotel/${selectedHotel.slug}`
    : null;

  const handleCopyShare = async () => {
    if (!shareUrl) return;
    if (!navigator?.clipboard?.writeText) {
      setCopyStatus("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">Resumen</p>
          <h2 className="text-2xl font-semibold text-white">
            {activeHotel ? `Hotel ${activeHotel.name}` : "Operaciones"}
          </h2>
          <p className="text-sm text-gray-400">
            Visualiza el estado general de productos y categorías del catálogo digital.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Categorías</p>
            <p className="mt-3 text-3xl font-semibold text-white">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Productos</p>
            <p className="mt-3 text-3xl font-semibold text-white">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Productos activos</p>
            <p className="mt-3 text-3xl font-semibold text-white">{activeProductsCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Sin categoría</p>
            <p className="mt-3 text-3xl font-semibold text-white">{uncategorizedCount}</p>
          </div>
        </div>
      </section>

      {hotelReady && (isLoadingHotelDetails || selectedHotel) ? (
        <section className="grid gap-6 rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6 lg:grid-cols-[1.3fr,1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-red-400">Información del hotel</p>
              <h3 className="text-lg font-semibold text-white">
                {selectedHotel ? selectedHotel.name : "Cargando..."}
              </h3>
              <p className="text-xs text-gray-400">
                Revisa los datos que se muestran en la carta pública y completa la información desde la sección Hoteles.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-4 text-sm text-gray-300">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Slug</p>
                <p className="mt-1 font-semibold text-white">{selectedHotel?.slug ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-4 text-sm text-gray-300">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Zona horaria</p>
                <p className="mt-1 font-semibold text-white">{selectedHotel?.timeZone ?? "Sin definir"}</p>
              </div>
            </div>

            {shareUrl ? (
              <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Enlace del catálogo</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 truncate rounded-xl bg-zinc-950/70 px-3 py-2 text-xs text-red-200">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500"
                  >
                    Copiar
                  </button>
                </div>
                {copyStatus === "copied" ? (
                  <p className="mt-2 text-xs text-green-300">Enlace copiado al portapapeles.</p>
                ) : copyStatus === "error" ? (
                  <p className="mt-2 text-xs text-red-300">No fue posible copiar el enlace.</p>
                ) : null}
              </div>
            ) : null}

            {(locationAddress || contactPhone || contactEmail || contactWhatsapp) && (
              <div className="rounded-2xl border border-zinc-800/70 bg-black/40 p-4 text-sm text-gray-300">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Contacto</p>
                <ul className="mt-2 space-y-2">
                  {locationAddress ? <li>Dirección: {locationAddress}</li> : null}
                  {contactPhone ? <li>Teléfono: {contactPhone}</li> : null}
                  {contactEmail ? <li>Email: {contactEmail}</li> : null}
                  {contactWhatsapp ? <li>WhatsApp: {contactWhatsapp}</li> : null}
                </ul>
              </div>
            )}

            {isAdmin ? (
              <Link
                to="/admin/hotels"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-300 transition hover:border-red-600 hover:text-white"
              >
                Editar información del hotel
              </Link>
            ) : null}
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-xs rounded-2xl border border-zinc-800/70 bg-black/40 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Código QR</p>
              {isLoadingHotelDetails ? (
                <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-zinc-800/70" />
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={`Código QR del hotel ${selectedHotel?.name ?? ""}`}
                  className="mt-4 inline-block h-48 w-48 rounded-xl border border-red-500/30 bg-white object-contain p-3"
                />
              ) : (
                <div className="mt-4 space-y-3 rounded-xl border border-dashed border-zinc-700 p-4 text-xs text-gray-400">
                  <p>No se configuró una imagen de código QR.</p>
                  {isAdmin ? (
                    <p>Agrega la URL desde la sección Hoteles para compartir el catálogo fácilmente.</p>
                  ) : null}
                </div>
              )}
              {shareUrl ? (
                <p className="mt-4 text-xs text-gray-400">
                  Comparte este código junto con el enlace para facilitar el acceso al menú digital.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Categorías recientes</h3>
            <span className="text-xs text-gray-400">Total: {categories.length}</span>
          </div>
          <div className="mt-4 space-y-3 divide-y divide-zinc-800/70">
            {categories.slice(0, 5).map((category) => (
              <div key={category.id} className="py-3">
                <p className="text-sm font-semibold text-white">{category.name}</p>
                <p className="text-xs text-gray-400">Clave: {category.key}</p>
              </div>
            ))}
            {!categories.length ? <p className="text-sm text-gray-400">Sin categorías registradas.</p> : null}
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Productos destacados</h3>
            <span className="text-xs text-gray-400">Total: {products.length}</span>
          </div>
          <div className="mt-4 space-y-3 divide-y divide-zinc-800/70">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{product.name}</p>
                  <p className="text-xs text-gray-400">Slug: {product.slug}</p>
                </div>
                <p className="text-sm font-semibold text-red-300">{formatCurrency(product.price)}</p>
              </div>
            ))}
            {!products.length ? <p className="text-sm text-gray-400">Sin productos registrados.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
};
