// src/components/RecommendedWorkers.tsx
// Sección de trabajadores recomendados por IA para empresas en una oferta

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Worker {
  id: string;
  role: string;
  workerProfile?: {
    id: string;
    fullName: string;
    city?: string;
    province?: string;
    phone?: string;
    experience?: string[];
    yearsExperience?: number;
    hasVehicle?: boolean;
    canRelocate?: boolean;
    bio?: string;
    profileImage?: string;
  };
  foremanProfile?: {
    id: string;
    fullName: string;
    city?: string;
    province?: string;
    phone?: string;
    crewSize?: number;
    specialties?: string[];
    yearsExperience?: number;
    hasVan?: boolean;
    ownTools?: boolean;
    bio?: string;
    profileImage?: string;
  };
}

interface RecommendedWorkersProps {
  postId: string;
  companyId?: string;
}

export default function RecommendedWorkers({ postId, companyId }: RecommendedWorkersProps) {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/ai/recommend-workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, companyId }),
        });

        if (!res.ok) {
          throw new Error('Error al obtener recomendaciones');
        }

        const data = await res.json();
        setWorkers(data.workers || []);
      } catch (err) {
        console.error('Error cargando recomendaciones:', err);
        setError('No se pudieron cargar las recomendaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [postId, companyId]);

  const handleContact = (worker: Worker) => {
    // Redirigir al chat con el trabajador
    router.push(`/messages/new?userId=${worker.id}&postId=${postId}`);
  };

  const handleViewProfile = (worker: Worker) => {
    // Redirigir al perfil del trabajador
    if (worker.role === 'FOREMAN') {
      router.push(`/profile/foreman?id=${worker.id}`);
    } else {
      router.push(`/profile/worker?id=${worker.id}`);
    }
  };

  if (!loading && workers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-800">Candidatos recomendados</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          IA
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workers.map((worker) => {
            const profile = worker.workerProfile || worker.foremanProfile;
            const isForeman = worker.role === 'FOREMAN';

            return (
              <div
                key={worker.id}
                className="bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {profile?.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${
                      isForeman
                        ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                        : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
                    }`}>
                      {profile?.fullName?.[0] || '?'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">
                        {profile?.fullName || 'Usuario'}
                      </h4>
                      {isForeman && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                          Cuadrilla
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {profile?.city && profile?.province
                        ? `${profile.city}, ${profile.province}`
                        : profile?.province || 'Ubicación no especificada'}
                    </p>

                    {/* Detalles específicos según rol */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {profile?.yearsExperience && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {profile.yearsExperience} años experiencia
                        </span>
                      )}
                      {worker.workerProfile?.hasVehicle && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Vehículo
                        </span>
                      )}
                      {worker.workerProfile?.canRelocate && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          Viaja
                        </span>
                      )}
                      {isForeman && worker.foremanProfile?.crewSize && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          {worker.foremanProfile.crewSize} personas
                        </span>
                      )}
                    </div>

                    {/* Experiencia o especialidades */}
                    {(worker.workerProfile?.experience || worker.foremanProfile?.specialties) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(worker.workerProfile?.experience || worker.foremanProfile?.specialties || []).slice(0, 3).map((exp, idx) => (
                          <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            {exp}
                          </span>
                        ))}
                        {(worker.workerProfile?.experience?.length || worker.foremanProfile?.specialties?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{(worker.workerProfile?.experience?.length || worker.foremanProfile?.specialties?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(worker)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-800 px-2 py-1 rounded border border-slate-200 hover:border-slate-300"
                      >
                        Ver perfil
                      </button>
                      <button
                        onClick={() => handleContact(worker)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                      >
                        Contactar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bio si existe */}
                {profile?.bio && (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
