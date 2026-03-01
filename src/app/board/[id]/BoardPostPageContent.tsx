'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import BoardPostCard from "@/components/BoardPostCard";

interface BoardPostPageContentProps {
  postId: string;
}

export default function BoardPostPageContent({ postId }: BoardPostPageContentProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/board-posts/${postId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Publicación no encontrada");
          } else {
            setError("Error al cargar la publicación");
          }
          return;
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0A3.742 3.742 0 003 0a1 1 0 011-1h.003M7 8a1 1 0 011-1h.003m7.004 0a1 1 0 011.004-1m0 0h-.004" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Publicación no encontrada</h3>
        <p className="text-slate-500 text-sm mb-6">
          La publicación que buscas no existe o ha sido eliminada.
        </p>
        <Link
          href="/board"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          Volver al Tablón
        </Link>
      </div>
    );
  }

  return (
    <BoardPostCard
      post={post}
      onUpdate={(postId, updates) => {
        if (updates.likesCount !== undefined) {
          setPost((prev: any) => ({ ...prev, ...updates }));
        }
      }}
      onDelete={(postId) => {
        // Redirigir al tablón después de eliminar
        window.location.href = "/board";
      }}
    />
  );
}
