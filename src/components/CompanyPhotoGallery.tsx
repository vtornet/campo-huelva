"use client";

import { useState } from "react";
import { useNotifications } from "@/components/Notifications";

interface Photo {
  url: string;
  id: string;
}

interface CompanyPhotoGalleryProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  editable?: boolean;
}

export default function CompanyPhotoGallery({
  photos,
  onPhotosChange,
  maxPhotos = 6,
  editable = true
}: CompanyPhotoGalleryProps) {
  const { showNotification } = useNotifications();
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Verificar límite de fotos
    if (photos.length + files.length > maxPhotos) {
      showNotification({
        type: "error",
        title: "Límite alcanzado",
        message: `Solo puedes tener máximo ${maxPhotos} fotos.`,
      });
      return;
    }

    setUploading(true);

    try {
      const newPhotos: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar tipo
        if (!file.type.startsWith("image/")) {
          showNotification({
            type: "error",
            title: "Archivo no válido",
            message: `"${file.name}" no es una imagen.`,
          });
          continue;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showNotification({
            type: "error",
            title: "Archivo demasiado grande",
            message: `"${file.name}" excede los 5MB.`,
          });
          continue;
        }

        // Subir imagen
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "company-photos");

        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Error al subir ${file.name}`);
        }

        const data = await res.json();
        newPhotos.push(data.url);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        showNotification({
          type: "success",
          title: "Fotos añadidas",
          message: `${newPhotos.length} foto(s) subida(s) correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      showNotification({
        type: "error",
        title: "Error al subir",
        message: "No se pudieron subir las fotos. Inténtalo de nuevo.",
      });
    } finally {
      setUploading(false);
      // Limpiar input
      e.target.value = "";
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Galería de fotos ({photos.length}/{maxPhotos})
        </label>
        {editable && photos.length < maxPhotos && (
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir foto
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg p-3">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Subiendo fotos...
        </div>
      )}

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500 text-sm">
            {editable
              ? "Añade fotos de tus instalaciones, cultivos o equipos"
              : "Esta empresa no ha añadido fotos todavía"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100"
            >
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar foto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Espacio vacío para añadir más fotos */}
          {editable && photos.length < maxPhotos &&
            Array.from({ length: maxPhotos - photos.length }).slice(0, 3).map((_, i) => (
              <label
                key={`placeholder-${i}`}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                  disabled={uploading}
                />
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-slate-400 mt-1">Añadir</span>
              </label>
            ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        💡 Muestra tus instalaciones, cultivos o equipos. Máximo {maxPhotos} fotos de 5MB cada una.
      </p>
    </div>
  );
}
