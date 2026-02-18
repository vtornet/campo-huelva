"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    email: string;
    role: string;
    workerProfile?: { fullName?: string | null; city?: string | null; province?: string | null };
    foremanProfile?: { fullName?: string; city?: string | null; province?: string | null; crewSize?: number };
    companyProfile?: { companyName?: string; city?: string | null; province?: string | null };
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
  relatedPost?: {
    id: string;
    title: string;
    type: string;
  } | null;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadConversations();
      // Recargar cada 10 segundos para nuevos mensajes
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (conv: Conversation) => {
    if (!conv.otherUser) return "Usuario desconocido";
    const { otherUser } = conv;
    if (otherUser.workerProfile?.fullName) return otherUser.workerProfile.fullName;
    if (otherUser.foremanProfile?.fullName) return otherUser.foremanProfile.fullName;
    if (otherUser.companyProfile?.companyName) return otherUser.companyProfile.companyName;
    return otherUser.email.split("@")[0];
  };

  const getUserLocation = (conv: Conversation) => {
    if (!conv.otherUser) return "";
    const { otherUser } = conv;
    const profile = otherUser.workerProfile || otherUser.foremanProfile || otherUser.companyProfile;
    if (profile?.city && profile?.province) return `${profile.city}, ${profile.province}`;
    if (profile?.province) return profile.province;
    return "";
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      USER: { text: "Trabajador", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      FOREMAN: { text: "Manijero", color: "bg-orange-100 text-orange-800 border-orange-200" },
      COMPANY: { text: "Empresa", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      ADMIN: { text: "Admin", color: "bg-red-100 text-red-800 border-red-200" }
    };
    const badge = badges[role] || { text: role, color: "bg-slate-100 text-slate-800 border-slate-200" };
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${badge.color}`}>{badge.text}</span>;
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getUserName(conv).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Mensajes</h1>
              <p className="text-xs text-slate-500">{conversations.length} conversación{conversations.length !== 1 ? "es" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-slate-600 hover:text-slate-800 font-medium transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        {/* Buscador */}
        <div className="mb-5">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200 shadow-sm shadow-black/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {searchTerm ? "No se encontraron conversaciones" : "No tienes mensajes aún"}
            </h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchTerm
                ? "Prueba con otro término de búsqueda"
                : "Las conversaciones con otras personas aparecerán aquí"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className={`w-full bg-white rounded-2xl p-4 border transition-all duration-200 text-left hover:scale-[1.01] hover:shadow-md shadow-black/5 ${
                  conv.unreadCount > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm ${
                    conv.otherUser?.role === "COMPANY" ? "bg-gradient-to-br from-indigo-400 to-indigo-600" :
                    conv.otherUser?.role === "FOREMAN" ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                    "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  }`}>
                    {getUserName(conv).charAt(0).toUpperCase()}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold tracking-tight truncate ${conv.unreadCount > 0 ? "text-slate-800" : "text-slate-700"}`}>
                          {getUserName(conv)}
                        </h3>
                        {conv.otherUser && getRoleBadge(conv.otherUser.role)}
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-2 font-medium">
                        {conv.lastMessage
                          ? new Date(conv.lastMessage.createdAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short"
                            })
                          : new Date(conv.updatedAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short"
                            })
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {getUserLocation(conv)}
                      </span>
                      {conv.relatedPost && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                          {conv.relatedPost.title}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                      {conv.lastMessage
                        ? conv.lastMessage.senderId === user.uid
                          ? `Tú: ${conv.lastMessage.content}`
                          : conv.lastMessage.content
                        : "Inicia la conversación..."}
                    </p>
                  </div>

                  {/* Badge de no leídos */}
                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center shadow-sm shadow-emerald-500/30">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
