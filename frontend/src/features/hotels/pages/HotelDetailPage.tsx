import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useHotelBySlug } from "../hooks";
import { useHotelCategories, useHotelProducts } from "@/features/catalog/hooks";
import type { Product } from "@/features/catalog/types";
import type { HotelMetadata } from "@/features/hotels/types";
import { resolveAssetUrl } from "@/lib/assets";

const formatCurrency = (value?: string | null) => {
  if (!value) {
    return "Precio a consultar";
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return "Precio a consultar";
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(parsed);
};

const getProductImage = (product: Product) => {
  if (!product.images) {
    return null;
  }
  if (Array.isArray(product.images)) {
    return resolveAssetUrl(product.images[0] ?? null);
  }
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images) as string[];
      return resolveAssetUrl(parsed[0] ?? null);
    } catch {
      return null;
    }
  }
  return null;
};

const getStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const getNumberValue = (value: unknown): number | null => {
  if (typeof value !== "number") {
    return null;
  }
  return Number.isFinite(value) ? value : null;
};

const ProductCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40">
    <div className="h-40 w-full animate-pulse bg-zinc-800/60" />
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="h-5 w-1/2 animate-pulse rounded bg-zinc-800/60" />
      <div className="h-4 w-full animate-pulse rounded bg-zinc-800/60" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/60" />
      <div className="mt-auto h-10 w-full animate-pulse rounded bg-zinc-800/60" />
    </div>
  </div>
);

const CategoryPill = ({
  label,
  categoryId,
  active,
  onSelect,
}: {
  label: string;
  categoryId: string | null;
  active: boolean;
  onSelect: (categoryId: string | null) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(categoryId)}
      className={[
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-red-500 bg-red-600 text-white shadow shadow-red-900/40"
          : "border-zinc-700 bg-zinc-900/50 text-gray-300 hover:border-red-600 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
};

export const HotelDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const {
    data: hotel,
    isLoading: isLoadingHotel,
    isError: isHotelError,
  } = useHotelBySlug(slug);

  const {
    data: categoriesResponse,
    isError: isCategoriesError,
  } = useHotelCategories(slug);

  const categories = useMemo(() => categoriesResponse?.items ?? [], [categoriesResponse?.items]);

  const categoryFilters = useMemo(() => {
    if (!categories.length) {
      return [];
    }
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
  }, [categories]);

  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    isError: isProductsError,
  } = useHotelProducts(slug, {
    search: search ? search : undefined,
    categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
  });

  const products = useMemo(() => productsResponse?.items ?? [], [productsResponse?.items]);

  const categoriesWithProducts = useMemo(() => {
    const productByCategory = new Map<string, Product[]>();

    products.forEach((product) => {
      const linkedCategories = product.categories ?? [];
      if (!linkedCategories.length && !productByCategory.has("uncategorized")) {
        productByCategory.set("uncategorized", []);
      }
      linkedCategories.forEach((link) => {
        if (!productByCategory.has(link.categoryId)) {
          productByCategory.set(link.categoryId, []);
        }
        productByCategory.get(link.categoryId)!.push(product);
      });
      if (!linkedCategories.length) {
        productByCategory.get("uncategorized")!.push(product);
      }
    });

    const result = categories
      .map((category) => ({
        category,
        products: productByCategory.get(category.id) ?? [],
      }))
      .filter((entry) => entry.products.length > 0);

    const uncategorizedProducts = productByCategory.get("uncategorized");
    if (uncategorizedProducts && uncategorizedProducts.length > 0) {
      result.push({
        category: {
          id: "uncategorized",
          hotelId: hotel?.id ?? "",
          name: "Productos sin categoría",
          key: "uncategorized",
          description: "Productos que aún no tienen una categoría asignada.",
        },
        products: uncategorizedProducts,
      });
    }

    return result;
  }, [categories, products, hotel?.id]);

  const showUncategorizedFilter = useMemo(
    () => categoriesWithProducts.some((entry) => entry.category.id === "uncategorized"),
    [categoriesWithProducts],
  );

  if (isLoadingHotel) {
    return (
      <div className="space-y-10">
        <div className="h-48 w-full animate-pulse rounded-3xl bg-zinc-900/40" />
        <div className="grid gap-5 lg:grid-cols-[280px,1fr]">
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-900/40" />
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-900/40" />
        </div>
      </div>
    );
  }

  if (isHotelError || !hotel) {
    return (
      <div className="rounded-3xl border border-red-800/70 bg-red-950/20 p-10 text-center text-red-200">
        <h1 className="mb-2 text-2xl font-semibold text-white">Hotel no disponible</h1>
        <p className="text-sm text-red-200">
          No encontramos información para el hotel solicitado. Verifica el enlace e inténtalo nuevamente.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Regresar al inicio
        </Link>
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/hotel/${hotel.slug}` : `/hotel/${hotel.slug}`;

  const metadata = (hotel.metadata ?? null) as HotelMetadata | null;
  const contactPhone = getStringValue(metadata?.contact?.phone);
  const contactEmail = getStringValue(metadata?.contact?.email);
  const contactWhatsapp = getStringValue(metadata?.contact?.whatsapp);
  const rawQrImage = getStringValue(hotel.imgQr);
  const qrImageUrl = resolveAssetUrl(rawQrImage);

  const locationAddress = getStringValue(metadata?.location?.address);
  const locationMapsUrl = getStringValue(metadata?.location?.mapsUrl);
  const locationLatitude = getNumberValue(metadata?.location?.latitude);
  const locationLongitude = getNumberValue(metadata?.location?.longitude);

  const whatsappNumber = contactWhatsapp ? contactWhatsapp.replace(/[^\d]/g, "") : "";
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  const mapsUrl =
    locationMapsUrl ??
    (locationLatitude !== null && locationLongitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${locationLatitude},${locationLongitude}`
      : locationAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}`
        : `https://maps.google.com/?q=${encodeURIComponent(hotel.name)}`);

  const contactActions: Array<{ label: string; href: string; external?: boolean }> = [];
  if (mapsUrl) {
    contactActions.push({
      label: locationAddress ? "Ver ubicación" : "Ubicación aproximada",
      href: mapsUrl,
      external: true,
    });
  }
  if (contactPhone) {
    contactActions.push({ label: "Llamar", href: `tel:${contactPhone}` });
  }
  if (contactEmail) {
    contactActions.push({ label: "Enviar email", href: `mailto:${contactEmail}` });
  }
  if (whatsappHref) {
    contactActions.push({ label: "WhatsApp", href: whatsappHref, external: true });
  }

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-black/60 via-zinc-900/80 to-black/60 shadow-xl shadow-red-950/40">
        <div className="relative isolate">
          <div className="absolute right-10 top-10 h-48 w-48 rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-red-600/10 blur-[120px]" />
          <div className="relative grid gap-10 px-8 py-12 lg:grid-cols-[1.2fr,1fr] lg:px-12 lg:py-16">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-red-200">
                hotel
                <span className="text-red-100/70">{hotel.slug}</span>
              </span>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">{hotel.name}</h1>
              <p className="text-base text-gray-300">
                {hotel.description ??
                  "Disfruta de nuestro catálogo digital con productos seleccionados para ofrecer experiencias memorables a tus huéspedes."}
              </p>
              {locationAddress || contactPhone || contactEmail || contactWhatsapp ? (
                <div className="space-y-2 pt-4 text-sm text-gray-400">
                  {locationAddress ? (
                    <p>
                      <span className="font-semibold uppercase tracking-[0.2em] text-gray-300">Dirección:</span>{" "}
                      {locationAddress}
                    </p>
                  ) : null}
                  {contactPhone ? (
                    <p>
                      <span className="font-semibold uppercase tracking-[0.2em] text-gray-300">Teléfono:</span>{" "}
                      <a href={`tel:${contactPhone}`} className="text-red-300 transition hover:text-red-200">
                        {contactPhone}
                      </a>
                    </p>
                  ) : null}
                  {contactEmail ? (
                    <p>
                      <span className="font-semibold uppercase tracking-[0.2em] text-gray-300">Email:</span>{" "}
                      <a href={`mailto:${contactEmail}`} className="text-red-300 transition hover:text-red-200">
                        {contactEmail}
                      </a>
                    </p>
                  ) : null}
                  {contactWhatsapp ? (
                    <p>
                      <span className="font-semibold uppercase tracking-[0.2em] text-gray-300">WhatsApp:</span>{" "}
                      {contactWhatsapp}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {contactActions.length ? (
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {contactActions.map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-200 transition hover:border-red-600 hover:text-white"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-red-600/30 bg-gradient-to-br from-red-600/20 via-transparent to-black/60 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-red-300">Acceso rápido</p>
                    <p className="text-sm text-gray-300">
                      QR
                    </p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-red-500/50 bg-black/60 p-6 text-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-red-400">QR</p>
                    {qrImageUrl ? (
                      <div className="mt-4 space-y-4">
                        <img
                          src={qrImageUrl}
                          alt={`Código QR del hotel ${hotel.name}`}
                          className="mx-auto h-40 w-40 rounded-lg border border-red-500/30 bg-white object-contain p-2"
                          loading="lazy"
                        />
                        <p className="text-xs text-gray-400">
                          Escanea el código o comparte el enlace:
                          <span className="mt-1 block font-mono text-[11px] text-red-200">{shareUrl}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-300">
                        Genera un código QR desde el panel administrativo y colócalo aquí para compartirlo rápidamente.
                        <br />
                        <span className="mt-2 block font-mono text-xs text-red-200">{shareUrl}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Busca productos</h2>
            <p className="text-sm text-gray-400">
              Filtra por categoría o busca directamente un producto del catálogo digital.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-wrap gap-2">
              <CategoryPill label="Todos" categoryId={null} active={!selectedCategoryId} onSelect={setSelectedCategoryId} />
              {categoryFilters.map((category) => (
                <CategoryPill
                  key={category.id}
                  label={category.name}
                  categoryId={category.id}
                  active={selectedCategoryId === category.id}
                  onSelect={setSelectedCategoryId}
                />
              ))}
              {showUncategorizedFilter ? (
                <CategoryPill
                  label="Sin categoría"
                  categoryId="uncategorized"
                  active={selectedCategoryId === "uncategorized"}
                  onSelect={setSelectedCategoryId}
                />
              ) : null}
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-gray-200 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30 sm:max-w-xs"
            />
          </div>
        </div>

        {isCategoriesError || isProductsError ? (
          <div className="rounded-3xl border border-red-800/70 bg-red-950/20 p-8 text-sm text-red-200">
            <p className="font-semibold">No fue posible cargar el catálogo.</p>
            <p className="mt-2 text-xs text-red-100/70">
              Revisa que el hotel cuente con categorías y productos disponibles.
            </p>
          </div>
        ) : null}

        <div className="space-y-10">
          {isLoadingProducts || isFetchingProducts ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-10 text-center text-sm text-gray-300">
              No hay productos disponibles con los filtros aplicados.
            </div>
          ) : selectedCategoryId ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40 transition hover:-translate-y-1 hover:border-red-600/60 hover:shadow-2xl hover:shadow-red-900/40"
                >
                  <div className="relative h-44 w-full bg-zinc-950/60">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product) ?? ""}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.4em] text-gray-500">
                        Sin imagen
                      </div>
                    )}
                    <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-red-300">
                      {product.slug}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                    <p className="flex-1 text-sm text-gray-300">
                      {product.description ?? "Descripción no disponible."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-red-300">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-gray-400">Stock: {product.stock ?? 0}</span>
                    </div>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center justify-center rounded-full border border-red-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-200 transition hover:bg-red-600/30"
                    >
                      Solicitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            categoriesWithProducts.map(({ category, products: categoryProducts }) => (
              <div key={category.id} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                  {category.description ? (
                    <p className="text-sm text-gray-400">{category.description}</p>
                  ) : null}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryProducts.map((product) => (
                    <article
                      key={product.id}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40 transition hover:-translate-y-1 hover:border-red-600/60 hover:shadow-2xl hover:shadow-red-900/40"
                    >
                      <div className="relative h-44 w-full bg-zinc-950/60">
                        {getProductImage(product) ? (
                          <img
                            src={getProductImage(product) ?? ""}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.4em] text-gray-500">
                            Sin imagen
                          </div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-red-300">
                          {product.slug}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h4 className="text-lg font-semibold text-white">{product.name}</h4>
                        <p className="flex-1 text-sm text-gray-300">
                          {product.description ?? "Descripción no disponible."}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-red-300">{formatCurrency(product.price)}</span>
                          <span className="text-xs text-gray-400">Stock: {product.stock ?? 0}</span>
                        </div>
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center justify-center rounded-full border border-red-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-200 transition hover:bg-red-600/30"
                        >
                          Solicitar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
