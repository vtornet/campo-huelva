// src/components/RecommendedOffers.tsx
// Sección de ofertas recomendadas por IA para trabajadores

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Offer {
  id: string;
  title: string;
  description: string;
  location: string;
  province?: string;
  type: string;
  company?: {
    companyName: string;
    profileImage?: string;
    user?: { id: string };
  };
  publisher?: {
    id: string;
    workerProfile?: { fullName: string; profileImage?: string };
    foremanProfile?: { fullName: string; profileImage?: string };
  };
}

interface RecommendedOffersProps {
  userId: string;
  userRole: string;
}

export default function RecommendedOffers({ userId, userRole }: RecommendedOffersProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Solo mostrar recomendaciones para trabajadores y manijeros
  const showRecommendations = userRole === 'USER' || userRole === 'FOREMAN';

  useEffect(() => {
    if (!showRecommendations || !userId) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/ai/recommend-offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          throw new Error('Error al obtener recomendaciones');
        }

        const data = await res.json();
        setOffers(data.offers || []);
      } catch (err) {
        console.error('Error cargando recomendaciones:', err);
        setError('No se pudieron cargar las recomendaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, showRecommendations]);

  // No mostrar nada si no es trabajador/manijero o si no hay recomendaciones
  if (!showRecommendations) return null;
  if (!loading && offers.length === 0) return null;

  const handleContact = async (offer: Offer) => {
    // Obtener ID del otro usuario
    const otherUserId = offer.company?.user?.id || offer.publisher?.id;
    if (!otherUserId) {
      alert("No se puede contactar con este autor");
      return;
    }

    if (otherUserId === userId) {
      alert("No puedes contactarte contigo mismo");
      return;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: otherUserId,
          content: `Hola, me interesa tu publicación: ${offer.title}`,
          postId: offer.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert("Error al iniciar conversación");
      }
    } catch (error) {
      console.error("Error contacting:", error);
      alert("Error al iniciar conversación");
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800">Recomendados para ti</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            IA
          </span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          Ver más
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {offers.slice(0, 4).map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl p-4 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleContact(offer)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {offer.company?.profileImage || offer.publisher?.workerProfile?.profileImage || offer.publisher?.foremanProfile?.profileImage ? (
                  <img
                    src={offer.company?.profileImage || offer.publisher?.workerProfile?.profileImage || offer.publisher?.foremanProfile?.profileImage}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    offer.type === 'OFFICIAL' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {offer.company?.companyName?.[0] || offer.publisher?.workerProfile?.fullName?.[0] || offer.publisher?.foremanProfile?.fullName?.[0] || "?"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">
                    {offer.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {offer.location}{offer.province && `, ${offer.province}`}
                  </p>
                  <button className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    Contactar
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
