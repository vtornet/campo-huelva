// src/components/CreateBoardPost.tsx
// Componente para crear publicaciones en el Tablón Social

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/Notifications';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface CreateBoardPostProps {
  onPostCreated?: () => void;
}

export default function CreateBoardPost({ onPostCreated }: CreateBoardPostProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Mostrar advertencia al enfocar el input
  const handleFocus = () => {
    if (!showWarning) {
      setShowWarning(true);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      showNotification({
        type: 'warning',
        title: 'Contenido vacío',
        message: 'Escribe algo para publicar.',
      });
      return;
    }

    // Verificar si el contenido parece una oferta o demanda
    const lowerContent = content.toLowerCase();
    const forbiddenWords = ['contrato', 'salario', 'ojerta', 'oferta', 'demanda', 'busco trabajo', 'busco empleo', 'se necesita'];
    const containsForbidden = forbiddenWords.some(word => lowerContent.includes(word));

    if (containsForbidden) {
      const confirmed = await confirm({
        title: '¿Seguro que quieres publicar esto?',
        message: 'Este contenido parece ser una oferta o demanda de empleo. Recuerda que para eso están las secciones de "Ofertas" y "Demandas". ¿Deseas continuar de todas formas?',
        type: 'warning',
        confirmText: 'Sí, publicar',
        cancelText: 'Cancelar'
      });

      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          content: content.trim(),
          userId: user.uid // Enviar userId como fallback para cuando Firebase Admin no esté configurado
        })
      });

      if (res.ok) {
        setContent('');
        setShowWarning(false);
        showNotification({
          type: 'success',
          title: '¡Publicado!',
          message: 'Tu publicación ha sido compartida en el tablón.',
        });
        onPostCreated?.();
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo publicar. Inténtalo de nuevo.',
        });
      }
    } catch (error) {
      console.error('Error publicando:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener nombre del usuario actual
  const getUserName = () => {
    if (!user?.displayName) return 'Usuario';
    return user.displayName;
  };

  return (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Crear publicación en el tablón
        </h3>

        {user ? (
          <>
            {/* Aviso */}
            {showWarning && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">ℹ️ Recuerda:</span> No se permiten publicaciones de oferta o demanda de empleo. Utiliza las secciones de "Ofertas" y "Demandas" para eso.
                </p>
              </div>
            )}

            {/* Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              placeholder="¿Qué quieres compartir con la comunidad? Ej: Necesito a alguien para compartir coche a la finca..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm min-h-[100px]"
              maxLength={2000}
              disabled={submitting}
            />

            {/* Contador de caracteres */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">{content.length} / 2000</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publicando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publicar
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 mb-3">Inicia sesión para participar en el tablón</p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              Iniciar sesión
            </a>
          </div>
        )}
      </div>
      <ConfirmDialogComponent />
    </>
  );
}
