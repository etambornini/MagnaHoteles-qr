import { useEffect, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminHotelContext } from "@/features/admin/hooks";
import { adminListHotels, adminUpdateHotel, adminUploadImage } from "@/features/admin/api";
import { hotelsQueryKeys } from "@/features/hotels/hooks";
import type { Hotel } from "@/features/hotels/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolveAssetUrl } from "@/lib/assets";

type HotelFormValues = {
  name: string;
  slug: string;
  description: string;
  timeZone: string;
  imgQr: string;
  metadata: string;
};

const formatMetadata = (metadata: Hotel["metadata"]) => {
  if (!metadata) return "";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "";
  }
};

export const AdminHotelsPage = () => {
  const { token, isAdmin, activeHotel } = useAdminHotelContext();
  const { setActiveHotel } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hotelsQuery = useQuery({
    queryKey: ["admin", "hotels"],
    queryFn: () => adminListHotels(token!),
    enabled: Boolean(token && isAdmin),
  });

  const hotels = hotelsQuery.data?.items ?? [];

  const selectedHotel = useMemo(() => {
    if (!isAdmin) {
      return null;
    }
    if (!activeHotel) {
      return null;
    }
    return hotels.find((hotel) => hotel.id === activeHotel.id || hotel.slug === activeHotel.slug) ?? null;
  }, [isAdmin, activeHotel, hotels]);

  const form = useForm<HotelFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      timeZone: "",
      imgQr: "",
      metadata: "",
    },
  });

  const imgQrValue = form.watch("imgQr");
  const imgQrPreview = resolveAssetUrl(imgQrValue);

  useEffect(() => {
    if (selectedHotel) {
      form.reset({
        name: selectedHotel.name,
        slug: selectedHotel.slug,
        description: selectedHotel.description ?? "",
        timeZone: selectedHotel.timeZone ?? "",
        imgQr: selectedHotel.imgQr ?? "",
        metadata: formatMetadata(selectedHotel.metadata),
      });
    }
  }, [selectedHotel, form]);

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; hotelSlugOrId: string | null }) =>
      adminUploadImage(token!, params.hotelSlugOrId, {
        type: "qr",
        file: params.file,
      }),
    onSuccess: (data) => {
      form.setValue("imgQr", data.url, { shouldDirty: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { hotelId: string; data: Parameters<typeof adminUpdateHotel>[2] }) =>
      adminUpdateHotel(token!, params.hotelId, params.data),
    onSuccess: (updatedHotel) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hotels"] });
      queryClient.invalidateQueries({ queryKey: hotelsQueryKeys.all });
      form.reset({
        name: updatedHotel.name,
        slug: updatedHotel.slug,
        description: updatedHotel.description ?? "",
        timeZone: updatedHotel.timeZone ?? "",
        imgQr: updatedHotel.imgQr ?? "",
        metadata: formatMetadata(updatedHotel.metadata),
      });
      if (activeHotel && activeHotel.id === updatedHotel.id) {
        setActiveHotel({ id: updatedHotel.id, name: updatedHotel.name, slug: updatedHotel.slug });
      }
    },
  });

  const handleSubmit = (values: HotelFormValues) => {
    if (!selectedHotel) return;

    form.clearErrors("metadata");

    let parsedMetadata: Hotel["metadata"] = null;
    const trimmedMetadata = values.metadata.trim();
    const trimmedImgQr = values.imgQr.trim();

    if (trimmedMetadata) {
      try {
        const parsed = JSON.parse(trimmedMetadata) as Hotel["metadata"];
        parsedMetadata = parsed;
      } catch (error) {
        form.setError("metadata", {
          type: "manual",
          message: "El contenido debe ser un JSON válido.",
        });
        return;
      }
    }

    updateMutation.mutate({
      hotelId: selectedHotel.id,
      data: {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        timeZone: values.timeZone || null,
        imgQr: trimmedImgQr ? trimmedImgQr : null,
        metadata: trimmedMetadata ? parsedMetadata : null,
      },
    });
  };

  const handleQrFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!selectedHotel) {
      form.setError("imgQr", {
        type: "manual",
        message: "Selecciona un hotel antes de subir una imagen de QR.",
      });
      event.target.value = "";
      return;
    }

    uploadMutation.mutate({
      file,
      hotelSlugOrId: selectedHotel.slug,
    });

    event.target.value = "";
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-800/60 bg-red-950/20 p-8 text-sm text-red-200">
        Para administrar hoteles inicia sesión nuevamente.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-yellow-800/60 bg-yellow-900/20 p-8 text-sm text-yellow-200">
        Solo los administradores pueden modificar la información general de los hoteles.
      </div>
    );
  }

  if (!activeHotel) {
    return (
      <div className="rounded-3xl border border-yellow-800/60 bg-yellow-900/20 p-8 text-sm text-yellow-200">
        Selecciona un hotel para editar su información.
      </div>
    );
  }

  if (hotelsQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-8 text-sm text-gray-300">
        Cargando información del hotel seleccionado...
      </div>
    );
  }

  if (!selectedHotel) {
    return (
      <div className="rounded-3xl border border-red-800/60 bg-red-950/20 p-8 text-sm text-red-200">
        No se encontró el hotel seleccionado. Refresca la página o vuelve a elegirlo.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">Información general</p>
          <h2 className="text-xl font-semibold text-white">Editar hotel</h2>
          <p className="text-xs text-gray-400">
            Actualiza los datos visibles en la carta digital: nombre, descripción, zona horaria y metadatos adicionales.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Nombre</label>
            <input
              {...form.register("name")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Hotel Magna"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Slug</label>
            <input
              {...form.register("slug")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="hotel-magna"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Descripción</label>
            <textarea
              {...form.register("description")}
              className="h-24 w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="Breve resumen del hotel y su propuesta."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Zona horaria</label>
            <input
              {...form.register("timeZone")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="America/Argentina/Buenos_Aires"
            />
            <p className="text-xs text-gray-500">
              Utiliza el formato estándar de IANA (ej.: America/Argentina/Buenos_Aires).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              URL de imagen QR
            </label>
            <input
              {...form.register("imgQr")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder="https://cdn.magna-hoteles.com/qr/hotel.png"
            />
            <p className="text-xs text-gray-500">
              Proporciona un enlace público a la imagen del código QR que se mostrará en la carta digital.
            </p>
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
                <p className="text-xs text-green-300">Imagen actualizada correctamente.</p>
              ) : null}
            </div>
            {imgQrPreview ? (
              <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
                <img
                  src={imgQrPreview}
                  alt="QR del hotel"
                  className="h-28 w-28 rounded-xl border border-red-500/30 bg-white object-contain p-2"
                />
                <code className="flex-1 break-all text-xs text-red-200">{imgQrValue}</code>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrFileSelected}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Metadata (JSON)
            </label>
            <textarea
              {...form.register("metadata")}
              className="h-48 w-full rounded-2xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 font-mono text-xs text-gray-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              placeholder={`{\n  "contact": {\n    "email": "contacto@hotel.com",\n    "phone": "+54 11 1234-5678"\n  }\n}`}
            />
            {form.formState.errors.metadata ? (
              <p className="text-xs text-red-300">{form.formState.errors.metadata.message}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Agrega información libre (contacto, ubicación, redes sociales) en formato JSON. Deja vacío para limpiar.
              </p>
            )}
          </div>

          {updateMutation.isError ? (
            <div className="sm:col-span-2 rounded-2xl border border-red-800/60 bg-red-950/20 px-4 py-3 text-xs text-red-200">
              No se pudo guardar los cambios. Intenta nuevamente.
            </div>
          ) : null}

          {updateMutation.isSuccess ? (
            <div className="sm:col-span-2 rounded-2xl border border-green-800/50 bg-green-900/20 px-4 py-3 text-xs text-green-200">
              Datos actualizados correctamente.
            </div>
          ) : null}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
