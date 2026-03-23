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
  // Cargar el logo desde el filesystem
  const logoResponse = await fetch(
    new URL('../../public/logo.png', import.meta.url)
  )
  const logo = await logoResponse.arrayBuffer()

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          gap: 40,
        }}
      >
        {/* Logo de Agro Red */}
        <img
          src={logo as any}
          alt="Agro Red Logo"
          width={200}
          height={56}
          style={{
            objectFit: 'contain',
          }}
        />

        {/* Texto descriptivo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          {/* Título principal */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              letterSpacing: '-0.03em',
              color: '#1e293b',
            }}
          >
            Agro Red
          </div>

          {/* Subtítulo */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: '#059669',
            }}
          >
            Empleo Agrícola
          </div>

          {/* Badge */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '8px 20px',
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            Conectando trabajadores y empresas
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
