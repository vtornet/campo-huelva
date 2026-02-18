"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
  label?: string;
}

export default function ProfileImageUpload({
  currentImage,
  onImageUploaded,
  label = "Foto de perfil"
}: ProfileImageUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten archivos JPG, PNG y WEBP");
      return;
    }

    // Validar tamaño (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo 2MB");
      return;
    }

    setError(null);

    // Mostrar preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a Firebase
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uid", user?.uid || "");

      const res = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al subir imagen");
      }

      const data = await res.json();
      onImageUploaded(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
      // Revertir preview si falló
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Imagen o avatar por defecto */}
        <div
          className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg ${
            uploading ? "opacity-50" : ""
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <svg
                className="w-14 h-14 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Botón de cambiar/eliminar */}
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md transition-colors disabled:opacity-50"
            title="Cambiar foto"
          >
            {uploading ? (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>

          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors disabled:opacity-50"
              title="Eliminar foto"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Spinner de carga */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG o WEBP. Máx 2MB</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
