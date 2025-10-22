import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCreateCategory, adminDeleteCategory, adminListCategories, adminUpdateCategory } from "@/features/admin/api";
import { useAdminHotelContext } from "@/features/admin/hooks";

const categorySchema = z.object({
  name: z.string().min(2, { message: "Ingresa un nombre válido" }),
  key: z
    .string()
    .min(2, { message: "Ingresa un identificador" })
    .regex(/^[a-z0-9-]+$/i, { message: "Solo letras, números y guiones" }),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export const AdminCategoriesPage = () => {
  const { token, isAdmin, hotelIdentifier } = useAdminHotelContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", key: "", description: "" },
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", hotelIdentifier],
    queryFn: () => adminListCategories(token!, hotelIdentifier, {}),
    enabled: Boolean(token && (hotelIdentifier || !isAdmin)),
  });

  const createMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => adminCreateCategory(token!, hotelIdentifier, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", hotelIdentifier] });
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CategoryFormValues & { id: string }) =>
      adminUpdateCategory(token!, hotelIdentifier, values.id, {
        name: values.name,
        key: values.key,
        description: values.description ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", hotelIdentifier] });
      setEditingId(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(token!, hotelIdentifier, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", hotelIdentifier] });
    },
  });

  const categories = categoriesQuery.data?.items ?? [];

  const handleEdit = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    setEditingId(category.id);
    form.reset({
      name: category.name,
      key: category.key,
      description: category.description ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({ name: "", key: "", description: "" });
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingId) {
      updateMutation.mutate({ ...values, id: editingId });
    } else {
      createMutation.mutate(values);
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-800/60 bg-red-950/20 p-8 text-sm text-red-200">
        Para administrar categorías es necesario iniciar sesión.
      </div>
    );
  }

  if (isAdmin && !hotelIdentifier) {
    return (
      <div className="rounded-3xl border border-yellow-800/60 bg-yellow-900/20 p-8 text-sm text-yellow-200">
        Selecciona un hotel para gestionar sus categorías.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-400">Gestión</p>
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editar categoría" : "Crear nueva categoría"}
            </h2>
            <p className="text-xs text-gray-400">
              Define categorías para agrupar los productos del catálogo digital.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-600 hover:text-white"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Nombre</label>
            <input
              {...form.register("name")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Bebidas"
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Identificador</label>
            <input
              {...form.register("key")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="bebidas"
              disabled={Boolean(editingId)}
            />
            {form.formState.errors.key ? (
              <p className="text-xs text-red-400">{form.formState.errors.key.message}</p>
            ) : null}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Descripción</label>
            <textarea
              {...form.register("description")}
              className="h-24 w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Detalle opcional de la categoría"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {editingId ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Listado de categorías</h3>
          <span className="text-xs text-gray-400">Total: {categories.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/60 text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.3em] text-gray-400">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Clave</th>
                <th className="px-4 py-3">Creada</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm text-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-black/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{category.name}</p>
                    {category.description ? <p className="text-xs text-gray-400">{category.description}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-800/70 px-3 py-1 text-xs uppercase tracking-widest text-gray-300">
                      {category.key}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(category.createdAt ?? Date.now()).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(category.id)}
                        className="rounded-xl border border-zinc-700 px-3 py-1 text-xs font-semibold text-gray-200 transition hover:border-red-600 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(category.id)}
                        className="rounded-xl border border-red-600/70 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-600/20"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                    No hay categorías registradas.
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
