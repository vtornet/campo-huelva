"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
};

type OtherUser = {
  id: string;
  email: string;
  role: string;
  workerProfile?: { fullName?: string | null; city?: string | null; province?: string | null };
  foremanProfile?: { fullName?: string; city?: string | null; province?: string | null; crewSize?: number };
  companyProfile?: { companyName?: string; city?: string | null; province?: string | null };
};

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [relatedPost, setRelatedPost] = useState<{ id: string; title: string; type: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && conversationId) {
      loadMessages();
      // Recargar mensajes cada 5 segundos
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!user || !conversationId) return;

    try {
      const res = await fetch(`/api/messages/${conversationId}?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setRelatedPost(data.relatedPost || null);

        // Obtener info del otro usuario
        if (data.otherParticipants && data.otherParticipants.length > 0) {
          const otherUserId = data.otherParticipants[0];
          const userRes = await fetch(`/api/user/by-id?id=${otherUserId}`);
          if (userRes.ok) {
            setOtherUser(await userRes.json());
          }
        }
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherUser || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: otherUser.id,
          content,
          postId: relatedPost?.id
        })
      });

      if (res.ok) {
        await loadMessages();
      } else {
        alert("Error al enviar mensaje");
        setNewMessage(content);
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const getUserName = () => {
    if (!otherUser) return "Usuario";
    if (otherUser.workerProfile?.fullName) return otherUser.workerProfile.fullName;
    if (otherUser.foremanProfile?.fullName) return otherUser.foremanProfile.fullName;
    if (otherUser.companyProfile?.companyName) return otherUser.companyProfile.companyName;
    return otherUser.email.split("@")[0];
  };

  const getUserLocation = () => {
    if (!otherUser) return "";
    const profile = otherUser.workerProfile || otherUser.foremanProfile || otherUser.companyProfile;
    if (profile?.city && profile?.province) return `${profile.city}, ${profile.province}`;
    if (profile?.province) return profile.province;
    return "";
  };

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push("/messages")}
            className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                otherUser?.role === "COMPANY" ? "bg-gradient-to-br from-indigo-400 to-indigo-600" :
                otherUser?.role === "FOREMAN" ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                "bg-gradient-to-br from-emerald-400 to-emerald-600"
              }`}>
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 tracking-tight">{getUserName()}</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {getUserLocation()}
                  {relatedPost && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100">
                      {relatedPost.title}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2 tracking-tight">
              Inicia la conversación
            </h2>
            <p className="text-slate-500">
              Envía un mensaje a {getUserName()}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    isMine
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                  }`}>
                    <p className="break-words text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1.5 ${isMine ? "text-emerald-100" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {isMine && msg.isRead && (
                        <span className="ml-1 flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          Leído
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200/60 p-4 shadow-lg">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe un mensaje..."
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 transition-all duration-200 pr-12"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            {newMessage && (
              <button
                type="button"
                onClick={() => setNewMessage("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3.5 rounded-2xl font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span>Enviar</span>
                <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
