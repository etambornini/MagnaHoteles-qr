import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateProduct,
  adminListCategories,
  adminListProducts,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
} from "@/features/admin/api";
import { useAdminHotelContext } from "@/features/admin/hooks";
import { resolveAssetUrl } from "@/lib/assets";

const productSchema = z.object({
  name: z.string().min(2, { message: "Nombre requerido" }),
  slug: z
    .string()
    .min(2, { message: "Slug requerido" })
    .regex(/^[a-z0-9-]+$/, { message: "Usa letras minúsculas, números o guiones" }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative({ message: "Precio no válido" }),
  stock: z.coerce.number().int().nonnegative({ message: "Stock no válido" }),
  isActive: z.boolean(),
  categoryIds: z.array(z.string()).optional(),
  images: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const toNumber = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const AdminProductsPage = () => {
  const { token, isAdmin, hotelIdentifier } = useAdminHotelContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      isActive: true,
      categoryIds: [],
      images: "",
    },
  });

  const imagesValue = form.watch("images");
  const imageUrls = useMemo(() => {
    if (!imagesValue) {
      return [] as string[];
    }
    return imagesValue
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }, [imagesValue]);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", hotelIdentifier],
    queryFn: () => adminListCategories(token!, hotelIdentifier, {}),
    enabled: Boolean(token && (hotelIdentifier || !isAdmin)),
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products", hotelIdentifier],
    queryFn: () => adminListProducts(token!, hotelIdentifier, {}),
    enabled: Boolean(token && (hotelIdentifier || !isAdmin)),
  });

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      adminCreateProduct(token!, hotelIdentifier, {
        name: values.name,
        slug: values.slug,
        description: values.description ?? undefined,
        price: values.price,
        stock: values.stock,
        isActive: values.isActive,
        categoryIds: values.categoryIds?.length ? values.categoryIds : undefined,
        images: values.images
          ? values.images
              .split(/\n|,/)
              .map((url) => url.trim())
              .filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", hotelIdentifier] });
      form.reset({ name: "", slug: "", description: "", price: 0, stock: 0, isActive: true, categoryIds: [], images: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues & { id: string }) =>
      adminUpdateProduct(token!, hotelIdentifier, values.id, {
        name: values.name,
        slug: values.slug,
        description: values.description ?? undefined,
        price: values.price,
        stock: values.stock,
        isActive: values.isActive,
        categoryIds: values.categoryIds?.length ? values.categoryIds : undefined,
        images: values.images
          ? values.images
              .split(/\n|,/)
              .map((url) => url.trim())
              .filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", hotelIdentifier] });
      setEditingId(null);
      form.reset({ name: "", slug: "", description: "", price: 0, stock: 0, isActive: true, categoryIds: [], images: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(token!, hotelIdentifier, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", hotelIdentifier] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; productSlug: string }) =>
      adminUploadImage(token!, hotelIdentifier, {
        type: "product",
        productSlug: params.productSlug,
        file: params.file,
      }),
    onSuccess: (data) => {
      const current = form.getValues("images")?.trim();
      const next = current && current.length > 0 ? `${current}\n${data.url}` : data.url;
      form.setValue("images", next, { shouldDirty: true });
    },
  });

  const categories = categoriesQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? [];

  const handleEdit = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setEditingId(product.id);
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: toNumber(product.price),
      stock: product.stock ?? 0,
      isActive: product.isActive,
      categoryIds: (product.categories ?? []).map((category) => category.categoryId),
      images: product.images?.join("\n") ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({ name: "", slug: "", description: "", price: 0, stock: 0, isActive: true, categoryIds: [], images: "" });
  };

  const handleProductImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const productSlug = (form.getValues("slug") ?? "").trim();
    if (!productSlug) {
      form.setError("slug", {
        type: "manual",
        message: "Completa el slug antes de subir una imagen.",
      });
      event.target.value = "";
      return;
    }

    form.clearErrors("slug");
    uploadMutation.mutate({ file, productSlug });
    event.target.value = "";
  };

  const onSubmit = (values: ProductFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...values, id: editingId });
    } else {
      createMutation.mutate(values);
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-800/60 bg-red-950/20 p-8 text-sm text-red-200">
        Para administrar productos inicia sesión nuevamente.
      </div>
    );
  }

  if (isAdmin && !hotelIdentifier) {
    return (
      <div className="rounded-3xl border border-yellow-800/60 bg-yellow-900/20 p-8 text-sm text-yellow-200">
        Selecciona un hotel para gestionar sus productos.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-400">Inventario</p>
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editar producto" : "Registrar nuevo producto"}
            </h2>
            <p className="text-xs text-gray-400">
              Gestiona los productos disponibles en los menús digitales del hotel.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-600 hover:text-white"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Nombre</label>
            <input
              {...form.register("name")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Café americano"
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Slug</label>
            <input
              {...form.register("slug")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="cafe-americano"
              disabled={Boolean(editingId)}
            />
            {form.formState.errors.slug ? (
              <p className="text-xs text-red-400">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Descripción</label>
            <textarea
              {...form.register("description")}
              className="h-24 w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Descripción breve del producto"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Precio (ARS)</label>
            <input
              type="number"
              step="0.01"
              {...form.register("price", { valueAsNumber: true })}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            />
            {form.formState.errors.price ? (
              <p className="text-xs text-red-400">{form.formState.errors.price.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Stock</label>
            <input
              type="number"
              {...form.register("stock", { valueAsNumber: true })}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            />
            {form.formState.errors.stock ? (
              <p className="text-xs text-red-400">{form.formState.errors.stock.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Estado</label>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <label className="inline-flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="h-4 w-4 rounded border border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                  />
                  Producto activo
                </label>
              )}
            />
          </div>
          <div className="sm:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Categorías</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const selected = form.watch("categoryIds") ?? [];
                const isChecked = selected.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-black/40 px-3 py-2 text-xs text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        const current = form.getValues("categoryIds") ?? [];
                        if (event.target.checked) {
                          form.setValue("categoryIds", [...current, category.id]);
                        } else {
                          form.setValue(
                            "categoryIds",
                            current.filter((id) => id !== category.id),
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                    />
                    <span className="font-semibold text-white">{category.name}</span>
                  </label>
                );
              })}
              {!categories.length ? <p className="text-xs text-gray-400">No hay categorías disponibles.</p> : null}
            </div>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              URLs de imágenes (separadas por coma o saltos de línea)
            </label>
            <textarea
              {...form.register("images")}
              className="h-24 w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="https://cdn.magna-hoteles.com/producto.jpg"
            />
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 transition hover:border-red-600 hover:text-white disabled:opacity-60"
              >
                {uploadMutation.isPending ? "Subiendo..." : "Subir imagen"}
              </button>
              {uploadMutation.isError ? (
                <p className="text-xs text-red-300">No se pudo subir la imagen. Intenta nuevamente.</p>
              ) : null}
              {uploadMutation.isSuccess ? (
                <p className="text-xs text-green-300">Imagen agregada correctamente.</p>
              ) : null}
            </div>
            {imageUrls.length ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {imageUrls.map((url, index) => {
                  const resolved = resolveAssetUrl(url);
                  if (!resolved) {
                    return (
                      <code
                        key={`${url}-${index}`}
                        className="rounded bg-zinc-950/50 px-3 py-1 text-[11px] text-red-200"
                      >
                        {url}
                      </code>
                    );
                  }
                  return (
                    <figure
                      key={`${url}-${index}`}
                      className="flex w-32 flex-col items-center gap-2 rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-2"
                    >
                      <img src={resolved} alt="Imagen del producto" className="h-24 w-full rounded-xl object-cover" />
                      <code className="break-all text-[10px] text-red-200">{url}</code>
                    </figure>
                  );
                })}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProductImageSelected}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {editingId ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Listado de productos</h3>
          <span className="text-xs text-gray-400">Total: {products.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/60 text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.3em] text-gray-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Categorías</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm text-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-black/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-gray-400">Slug: {product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-300">
                    {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
                      toNumber(product.price),
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest",
                        product.isActive ? "bg-green-500/20 text-green-300" : "bg-zinc-800/70 text-gray-300",
                      ].join(" ")}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {(product.categories ?? []).map((link) => link.category?.name ?? "").join(", ") || "Sin categoría"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product.id)}
                        className="rounded-xl border border-zinc-700 px-3 py-1 text-xs font-semibold text-gray-200 transition hover:border-red-600 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(product.id)}
                        className="rounded-xl border border-red-600/70 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-600/20"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
