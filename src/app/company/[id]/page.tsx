"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNotifications } from "@/components/Notifications";
import CompanyPhotoGallery from "@/components/CompanyPhotoGallery";
import { BackButton } from "@/components/BackButton";
import { Crown } from "lucide-react";

interface CompanyProfile {
  id: string;
  companyName: string;
  cif: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  contactPerson?: string;
  website?: string;
  description?: string;
  extendedDescription?: string;
  photos?: string[];
  profileImage?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  isPremium?: boolean;
}

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  province?: string;
  type: string;
  contractType?: string;
  salaryAmount?: string;
  salaryPeriod?: string;
  createdAt: string;
  applicationCount: number;
}

export default function CompanyPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`/api/companies/${params.id}`);
        if (!res.ok) {
          throw new Error("Error al cargar el perfil");
        }
        const data = await res.json();
        setCompany(data);
      } catch (error) {
        console.error("Error fetching company:", error);
        showNotification({
          type: "error",
          title: "Error",
          message: "No se pudo cargar el perfil de la empresa.",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/companies/${params.id}/posts`);
        if (!res.ok) return;
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (params.id) {
      fetchCompany();
      fetchPosts();
    }
  }, [params.id, showNotification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Empresa no encontrada</h1>
          <p className="text-slate-500 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <BackButton className="text-white hover:text-indigo-100" />
          <div className="flex items-start gap-4 mt-4">
            {company.profileImage ? (
              <img
                src={company.profileImage}
                alt={company.companyName}
                className="w-20 h-20 rounded-xl object-cover bg-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{company.companyName}</h1>
                {company.isPremium && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
                {company.isVerified && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
                    ✓ Verificada
                  </span>
                )}
              </div>
              {company.description && (
                <p className="text-indigo-100 mt-1 whitespace-pre-wrap">{company.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-indigo-100">
                {company.city && company.province && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {company.city}, {company.province}
                  </span>
                )}
                {posts.length > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {posts.length} oferta{posts.length !== 1 ? "s" : ""} publicada{posts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Galería de fotos */}
        {company.photos && company.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Galería de fotos
            </h2>
            <CompanyPhotoGallery
              photos={company.photos}
              onPhotosChange={() => {}}
              editable={false}
            />
          </div>
        )}

        {/* Descripción extendida */}
        {company.extendedDescription && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sobre nosotros
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{company.extendedDescription}</p>
            </div>
          </div>
        )}

        {/* Historial de ofertas */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ofertas publicadas
            {posts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({posts.length})
              </span>
            )}
          </h2>

          {loadingPosts ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500">Esta empresa no tiene ofertas publicadas actualmente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/offer/${post.id}`)}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          post.type === "OFFICIAL"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {post.type === "OFFICIAL" ? "Oferta oficial" : "Oferta compartida"}
                        </span>
                        {post.contractType && (
                          <span className="text-sm text-slate-500">{post.contractType}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-2">{post.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2 whitespace-pre-wrap">{post.description}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {post.location}
                        </span>
                        {post.salaryAmount && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {post.salaryAmount}
                            {post.salaryPeriod && `/${post.salaryPeriod}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatPostDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    {post.applicationCount > 0 && (
                      <div className="text-center">
                        <span className="text-2xl font-bold text-indigo-600">{post.applicationCount}</span>
                        <p className="text-xs text-slate-500">inscritos</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
