import { ImageResponse } from 'next/og'

/**
 * Genera la imagen de Open Graph dinámica para compartir en redes sociales
 * Tamaño recomendado: 1200x630px
 */
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
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
        }}
      >
        {/* Logo o icono */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 20,
            opacity: 0.9,
          }}
        >
          🌾
        </div>

        {/* Título principal */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            letterSpacing: '-0.05em',
            textAlign: 'center',
          }}
        >
          Red Agro
        </div>

        {/* Subtítulo */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 500,
            opacity: 0.9,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Empleo Agrícola
        </div>

        {/* Badge */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '12px 32px',
            borderRadius: 9999,
            marginTop: 40,
            backdropFilter: 'blur(10px)',
          }}
        >
          Trabajadores · Manijeros · Empresas
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
