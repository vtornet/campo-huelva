import { ImageResponse } from 'next/og'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const postId = params.id

  // Buscar la publicación
  const post = await prisma.boardPost.findUnique({
    where: { id: postId },
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
  })

  // Obtener nombre del autor
  const getAuthorName = () => {
    if (!post?.author) return 'Usuario'
    return post.author.workerProfile?.fullName
      || post.author.foremanProfile?.fullName
      || post.author.engineerProfile?.fullName
      || post.author.encargadoProfile?.fullName
      || post.author.tractoristProfile?.fullName
      || 'Usuario'
  }

  const authorName = getAuthorName()

  // Truncar contenido si es muy largo
  const content = post?.content || 'Publicación de Agro Red'
  const maxContentLength = 120
  const truncatedContent = content.length > maxContentLength
    ? content.substring(0, maxContentLength) + '...'
    : content

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
          padding: '60px',
        }}
      >
        {/* Icono del tablón */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 20,
            opacity: 0.9,
          }}
        >
          📋
        </div>

        {/* Título */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            letterSpacing: '-0.05em',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Tablón Social
        </div>

        {/* Autor */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.9,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Por {authorName}
        </div>

        {/* Contenido truncado */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            opacity: 0.95,
            textAlign: 'center',
            maxWidth: '1000px',
            lineHeight: 1.4,
          }}
        >
          "{truncatedContent}"
        </div>

        {/* Badge */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '10px 24px',
            borderRadius: 9999,
            marginTop: 40,
            backdropFilter: 'blur(10px)',
          }}
        >
          Agro Red - Empleo Agrícola
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
