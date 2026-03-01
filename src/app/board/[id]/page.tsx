import { Metadata } from "next";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import BoardPostPageContent from "./BoardPostPageContent";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generar metadatos OG dinámicos
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Buscar la publicación
  const post = await prisma.boardPost.findUnique({
    where: { id },
    include: {
      author: {
        include: {
          workerProfile: { select: { fullName: true } },
          foremanProfile: { select: { fullName: true } },
          engineerProfile: { select: { fullName: true } },
          encargadoProfile: { select: { fullName: true } },
          tractoristProfile: { select: { fullName: true } },
        }
      }
    }
  });

  if (!post) {
    return {
      title: "Publicación no encontrada - Agro Red",
      description: "La publicación que buscas no existe o ha sido eliminada.",
    };
  }

  // Obtener nombre del autor
  const getAuthorName = () => {
    if (!post.author) return 'Usuario';
    return post.author.workerProfile?.fullName
      || post.author.foremanProfile?.fullName
      || post.author.engineerProfile?.fullName
      || post.author.encargadoProfile?.fullName
      || post.author.tractoristProfile?.fullName
      || 'Usuario';
  };

  const authorName = getAuthorName();
  const content = post.content || 'Publicación de Agro Red';
  const truncatedContent = content.length > 150
    ? content.substring(0, 150) + '...'
    : content;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agroredjob.com';
  const imageUrl = `${appUrl}/board/${id}/opengraph-image`;
  const twitterImageUrl = `${appUrl}/board/${id}/twitter-image`;

  return {
    title: `${authorName} - Tablón Social - Agro Red`,
    description: truncatedContent,
    openGraph: {
      title: `${authorName} - Tablón Social`,
      description: truncatedContent,
      url: `${appUrl}/board/${id}`,
      siteName: "Agro Red",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${authorName} - Tablón Social`,
        }
      ],
      locale: "es_ES",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${authorName} - Tablón Social`,
      description: truncatedContent,
      images: [twitterImageUrl],
    },
  };
}

// Page principal - Server Component
export default async function BoardPostPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Navegación de regreso */}
        <Link
          href="/board"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Tablón
        </Link>

        {/* La publicación se cargará dinámicamente */}
        <BoardPostPageContent postId={id} />
      </div>
    </div>
  );
}
