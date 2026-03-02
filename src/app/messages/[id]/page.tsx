"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { auth } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MessageStatusTick } from "@/components/chat/MessageStatusTick";
import { CompactTypingIndicator } from "@/components/chat/TypingIndicator";
import { ImagePreview } from "@/components/chat/ImagePreview";

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  readAt: string | null;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  deliveredAt: string | null;
  messageType: "TEXT" | "IMAGE" | "DOCUMENT" | "LOCATION";
  attachmentUrl: string | null;
  attachmentMetadata: any;
  createdAt: string;
  updatedAt: string;
};

type OtherUser = {
  id: string;
  email: string;
  role: string;
  workerProfile?: { fullName?: string | null; city?: string | null; province?: string | null };
  foremanProfile?: { fullName?: string; city?: string | null; province?: string | null; crewSize?: number };
  companyProfile?: { companyName?: string; city?: string | null; province?: string | null };
};

// Intervalo de polling: 3 segundos
const POLLING_INTERVAL = 3000;
// Tiempo después del cual se considera que el usuario dejó de escribir
const TYPING_TIMEOUT = 3000;

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [relatedPost, setRelatedPost] = useState<{ id: string; title: string; type: string } | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Funciones definidas con useCallback para evitar problemas de closure
  const loadMessages = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      const res = await fetch(`/api/messages/${conversationId}?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();

        setMessages(prev => {
          const newMessages = data.messages || [];
          if (newMessages.length !== prev.length ||
              newMessages.some((m: Message, i: number) => m.id !== prev[i]?.id || m.status !== prev[i]?.status)) {
            return newMessages;
          }
          return prev;
        });

        setRelatedPost(data.relatedPost || null);

        if (data.otherParticipants && data.otherParticipants.length > 0 && !otherUser) {
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
  }, [user, conversationId, otherUser]);

  const checkTypingStatus = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      const res = await fetch(`/api/messages/${conversationId}/typing?currentUserId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setTypingUsers(data.typing || []);
      }
    } catch (error) {
      console.error("Error checking typing status:", error);
    }
  }, [user, conversationId]);

  const registerTyping = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      await fetch(`/api/messages/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid })
      });
    } catch (error) {
      console.error("Error registering typing:", error);
    }
  }, [user, conversationId]);

  const clearTypingIndicator = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      await fetch(`/api/messages/${conversationId}/typing?userId=${user.uid}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.error("Error clearing typing indicator:", error);
    }
  }, [user, conversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Redirección si no autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Detectar visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Polling de mensajes y estado de escritura
  useEffect(() => {
    if (user && conversationId) {
      loadMessages();
      const interval = setInterval(() => {
        if (isPageVisible) {
          loadMessages();
          checkTypingStatus();
        }
      }, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user, conversationId, isPageVisible, loadMessages, checkTypingStatus]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Limpiar indicador de escritura al desmontar
  useEffect(() => {
    return () => {
      clearTypingIndicator();
    };
  }, [clearTypingIndicator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!isTypingRef.current && value.trim()) {
      isTypingRef.current = true;
      registerTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      clearTypingIndicator();
    }, TYPING_TIMEOUT);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      showNotification({
        type: "error",
        title: "Archivo no válido",
        message: "Solo se permiten imágenes.",
      });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification({
        type: "error",
        title: "Archivo demasiado grande",
        message: "La imagen no puede exceder 5MB.",
      });
      return;
    }

    setSelectedImage(file);

    // Crear preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo - solo PDF
    if (file.type !== "application/pdf") {
      showNotification({
        type: "error",
        title: "Archivo no válido",
        message: "Solo se permiten archivos PDF.",
      });
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification({
        type: "error",
        title: "Archivo demasiado grande",
        message: "El PDF no puede exceder 2MB.",
      });
      return;
    }

    setSelectedDocument(file);
    showNotification({
      type: "info",
      title: "Documento seleccionado",
      message: file.name,
    });
  };

  const removeSelectedDocument = () => {
    setSelectedDocument(null);
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const uploadDocument = async (): Promise<{ url: string; fileName: string } | null> => {
    if (!selectedDocument || !user) return null;

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedDocument);
      formData.append("userId", user.uid);

      const res = await fetch(`/api/messages/${conversationId}/upload-document`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al subir documento");
      }

      const data = await res.json();
      return {
        url: data.url,
        fileName: selectedDocument.name
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      showNotification({
        type: "error",
        title: "Error al subir documento",
        message: error instanceof Error ? error.message : "Inténtalo de nuevo más tarde.",
      });
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setUploadingImage(true);

    try {
      // Subir usando Base64 para evitar problemas CORS
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // El dataURL incluye la imagen completa, no necesitamos subirla a Storage
      // En su lugar, la subimos a través de nuestro servidor
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("userId", user.uid);
      formData.append("dataUrl", dataUrl);

      const res = await fetch(`/api/messages/${conversationId}/upload-image`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al subir imagen");
      }

      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification({
        type: "error",
        title: "Error al subir imagen",
        message: error instanceof Error ? error.message : "Inténtalo de nuevo más tarde.",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar: debe haber texto, imagen o documento
    if (!newMessage.trim() && !selectedImage && !selectedDocument) return;
    if (!user || !otherUser || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Limpiar estado de escritura
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    clearTypingIndicator();

    try {
      let attachmentUrl = null;
      let attachmentMetadata = null;
      let messageType = "TEXT";

      // Subir imagen si hay una seleccionada
      if (selectedImage) {
        attachmentUrl = await uploadImage();
        if (!attachmentUrl) {
          setNewMessage(content);
          setSending(false);
          return;
        }
        messageType = "IMAGE";
      }

      // Subir documento si hay uno seleccionado
      if (selectedDocument) {
        const docResult = await uploadDocument();
        if (!docResult) {
          setNewMessage(content);
          setSending(false);
          return;
        }
        attachmentUrl = docResult.url;
        attachmentMetadata = { fileName: docResult.fileName };
        messageType = "DOCUMENT";
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: otherUser.id,
          content: content || (selectedImage ? "📷 Foto" : selectedDocument ? "📄 Documento" : ""),
          postId: relatedPost?.id,
          messageType,
          attachmentUrl,
          attachmentMetadata
        })
      });

      if (res.ok) {
        removeSelectedImage();
        removeSelectedDocument();
        await loadMessages();
      } else {
        showNotification({
          type: "error",
          title: "Error al enviar",
          message: "Inténtalo de nuevo más tarde.",
        });
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
                <h1 className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  {getUserName()}
                  {typingUsers.length > 0 && (
                    <span className="text-xs font-normal text-emerald-600 flex items-center gap-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      escribiendo...
                    </span>
                  )}
                </h1>
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
              const isImage = msg.messageType === "IMAGE";
              const isDocument = msg.messageType === "DOCUMENT";
              const fileName = msg.attachmentMetadata?.fileName || "documento.pdf";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl shadow-sm overflow-hidden ${
                    isMine
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                  }`}>
                    {isImage && msg.attachmentUrl ? (
                      <img
                        src={msg.attachmentUrl}
                        alt="Imagen enviada"
                        className="w-full max-w-sm rounded-t-2xl"
                        loading="lazy"
                      />
                    ) : null}
                    {isDocument && msg.attachmentUrl ? (
                      <a
                        href={msg.attachmentUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block px-4 py-3 ${isMine ? "text-white" : "text-slate-800"} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isMine ? "bg-white/20" : "bg-red-100"}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileName}</p>
                            <p className={`text-xs ${isMine ? "text-emerald-100" : "text-slate-500"}`}>Documento PDF</p>
                          </div>
                          <svg className={`w-5 h-5 ${isMine ? "text-white" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                      </a>
                    ) : null}
                    <div className={`px-4 py-3 ${(isImage || isDocument) ? "pt-2" : ""}`}>
                      {msg.content && msg.content !== "📷 Foto" && msg.content !== "📄 Documento" && (
                        <p className="break-words text-sm leading-relaxed">{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${isMine ? "text-emerald-100" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        <MessageStatusTick
                          status={msg.status}
                          isMine={isMine}
                          className="ml-1"
                        />
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicador de escritura */}

            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <CompactTypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200/60 p-4 shadow-lg">
        {/* Previsualización de imagen */}
        {imagePreviewUrl && (
          <div className="max-w-4xl mx-auto mb-3">
            <ImagePreview url={imagePreviewUrl} onRemove={removeSelectedImage} />
          </div>
        )}

        {/* Previsualización de documento */}
        {selectedDocument && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-2xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{selectedDocument.name}</p>
                <p className="text-xs text-slate-500">PDF - {(selectedDocument.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={removeSelectedDocument}
                className="p-1.5 bg-white rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          {/* Botón de imagen */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingImage || uploadingDocument}
            className="p-3.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar imagen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Botón de documento */}
          <input
            ref={documentInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleDocumentSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => documentInputRef.current?.click()}
            disabled={sending || uploadingImage || uploadingDocument}
            className="p-3.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar documento PDF"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe un mensaje..."
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 transition-all duration-200 pr-12"
              value={newMessage}
              onChange={handleInputChange}
              disabled={sending}
            />
            {newMessage && (
              <button
                type="button"
                onClick={() => {
                  setNewMessage("");
                  isTypingRef.current = false;
                  clearTypingIndicator();
                }}
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
            disabled={(!newMessage.trim() && !selectedImage && !selectedDocument) || sending || uploadingImage || uploadingDocument}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3.5 rounded-2xl font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            {sending || uploadingImage || uploadingDocument ? (
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
