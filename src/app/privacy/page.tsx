import { Metadata } from "next";
import Link from "next/link";
import { PageBackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de Agro Red. Tratamiento de datos personales according RGPD.",
};

export default function PrivacyPolicy() {
  const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Botón volver */}
        <PageBackButton />

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Política de Privacidad</h1>
          <p className="text-slate-500">Última actualización: {fechaActual}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 text-slate-700 leading-relaxed">

          {/* 1. Responsable */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">1. Responsable del Tratamiento</h2>
            <p className="mb-4">
              El responsable del tratamiento de los datos personales es <strong>Víctor José Tornet García</strong>,
              NIF 77534989B, que actúa bajo la marca <strong>Appstracta</strong> (en adelante, "el Responsable").
            </p>
            <p>Puedes contactar con el Responsable en:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Email: <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline">contact@appstracta.app</a></li>
              <li>Lepe, Huelva, España</li>
            </ul>
          </section>

          {/* 2. Datos que recopilamos */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">2. Datos que Recopilamos</h2>

            <h3 className="font-semibold text-slate-800 mb-2">2.1. Datos de identificación y contacto</h3>
            <ul className="list-disc ml-6 mb-4 space-y-1">
              <li>Nombre y apellidos</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Foto de perfil (opcional)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">2.2. Datos profesionales y de empleo</h3>
            <ul className="list-disc ml-6 mb-4 space-y-1">
              <li>Rol profesional (trabajador, manijero, ingeniero, empresa, encargado, tractorista)</li>
              <li>Experiencia laboral y años de campaña</li>
              <li>Carnets profesionales (fitosanitario, manipulador de alimentos, tractor, etc.)</li>
              <li>Disponibilidad y preferencias laborales</li>
              <li>Habilidades y especialidades</li>
              <li>Para empresas: datos fiscales y de contacto (CIF, dirección, nombre comercial)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">2.3. Datos de ubicación</h3>
            <ul className="list-disc ml-6 mb-4 space-y-1">
              <li>Provincia y localidad de residencia</li>
              <li>Zona de trabajo preferente</li>
              <li>Disponibilidad para reubicarse</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">2.4. Datos de navegación</h3>
            <ul className="list-disc ml-6 mb-4 space-y-1">
              <li>Dirección IP</li>
              <li>Tipo de dispositivo y navegador</li>
              <li>Páginas visitadas y tiempo de uso</li>
              <li>Cookies y datos similares</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">2.5. Datos de comunicaciones</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Mensajes enviados a través de la plataforma</li>
              <li>Comentarios en publicaciones del tablón</li>
              <li>Denuncias y reportes realizados</li>
            </ul>
          </section>

          {/* 3. Finalidad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">3. Finalidad del Tratamiento</h2>
            <p>Tus datos serán tratados para las siguientes finalidades:</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-slate-200 text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-4 py-2 text-left">Finalidad</th>
                    <th className="border border-slate-200 px-4 py-2 text-left">Base Legal</th>
                    <th className="border border-slate-200 px-4 py-2 text-left">Conservación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">Gestión de cuentas de usuario</td>
                    <td className="border border-slate-200 px-4 py-2">Ejecución del contrato</td>
                    <td className="border border-slate-200 px-4 py-2">Mientras active la cuenta</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 px-4 py-2">Gestión de publicaciones (ofertas, demandas, tablón)</td>
                    <td className="border border-slate-200 px-4 py-2">Ejecución del contrato</td>
                    <td className="border border-slate-200 px-4 py-2">Mientras active la cuenta</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">Gestión de inscripciones y candidaturas</td>
                    <td className="border border-slate-200 px-4 py-2">Consentimiento</td>
                    <td className="border border-slate-200 px-4 py-2">1 año tras cierre</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 px-4 py-2">Mensajería interna entre usuarios</td>
                    <td className="border border-slate-200 px-4 py-2">Consentimiento</td>
                    <td className="border border-slate-200 px-4 py-2">1 año tras cierre</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">Verificación de empresas</td>
                    <td className="border border-slate-200 px-4 py-2">Consentimiento</td>
                    <td className="border border-slate-200 px-4 py-2">Mientras active la cuenta</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 px-4 py-2">Mejora de servicios y recomendaciones con IA</td>
                    <td className="border border-slate-200 px-4 py-2">Interés legítimo</td>
                    <td className="border border-slate-200 px-4 py-2">Mientras active la cuenta</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">Analítica y estadísticas de uso</td>
                    <td className="border border-slate-200 px-4 py-2">Interés legítimo</td>
                    <td className="border border-slate-200 px-4 py-2">24 meses</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 px-4 py-2">Cumplimiento de obligaciones legales</td>
                    <td className="border border-slate-200 px-4 py-2">Obligación legal</td>
                    <td className="border border-slate-200 px-4 py-2">Según legislación vigente</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">4. Base Legal del Tratamiento</h2>
            <p>El tratamiento de tus datos se fundamenta en las bases legales previstas en el RGPD:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><strong>Ejecución de un contrato:</strong> La prestación de los servicios de la plataforma requiere el tratamiento de tus datos.</li>
              <li><strong>Consentimiento:</strong> Cuando marcamos casillas específicas para tratamientos adicionales (inscripciones, mensajería, etc.).</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios, mantener la seguridad de la plataforma y generar recomendaciones personalizadas.</li>
              <li><strong>Obligación legal:</strong> Para cumplir con las obligaciones fiscales y de seguridad que nos impone la legislación vigente.</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Puedes retirar tu consentimiento en cualquier momento contactando con <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline">contact@appstracta.app</a>.
            </p>
          </section>

          {/* 5. Destinatarios */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">5. Destinatarios de los Datos</h2>
            <p>Tus datos podrán ser comunicados a:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><strong>Otros usuarios de la plataforma:</strong> Cuando te inscribas en una oferta o publiques una demanda, la empresa u otros usuarios verán los datos necesarios para la contratación.</li>
              <li><strong>Prestadores de servicios:</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Firebase (Google LLC):</strong> Servicios de autenticación y base de datos. Datos alojados en servidores de la UE/EEE.</li>
                  <li><strong>Railway:</strong> Infraestructura de hosting y base de datos PostgreSQL.</li>
                  <li><strong>OpenAI:</strong> Servicios de inteligencia artificial para generación de recomendaciones y mejoras de contenido. No se utiliza tu información personal para entrenar sus modelos.</li>
                </ul>
              </li>
              <li><strong>Administraciones públicas:</strong> Cuando exista una obligación legal o requisito judicial.</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              No vendemos ni cedemos tus datos a terceros con fines comerciales.
            </p>
          </section>

          {/* 6. Transferencias internacionales */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">6. Transferencias Internacionales</h2>
            <p>
              Algunos de nuestros prestadores de servicios (Firebase, OpenAI) pueden almacenar datos en servidores
              ubicados fuera de la Unión Europea. Estos proveedores cumplen con el RGPD y disponen de las
              garantías adecuadas (cláusulas contractuales tipo, escudo privacy o certificaciones) aprobadas
              por la Comisión Europea.
            </p>
          </section>

          {/* 7. Derechos ARCO */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">7. Tus Derechos</h2>
            <p>Como interesado, tienes derecho a:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><strong>Acceder:</strong> Conocer qué datos tenemos y cómo los tratamos.</li>
              <li><strong>Rectificar:</strong> Modificar datos inexactos o incompletos.</li>
              <li><strong>Suprimir:</strong> Solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitar:</strong> Solicitar que limitemos el tratamiento de tus datos.</li>
              <li><strong>Oponerte:</strong> Oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y de uso común.</li>
              <li><strong>Retirar el consentimiento:</strong> Revocar autorizaciones que hayas concedido.</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Para ejercer estos derechos, envía un email a <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline">contact@appstracta.app</a>
              indicando tu derecho y el DNI/NIF. Responderemos en un plazo máximo de 30 días.
            </p>
            <p className="mt-3">
              También tienes derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>
              (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.aepd.es</a>).
            </p>
          </section>

          {/* 8. Seguridad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">8. Medidas de Seguridad</h2>
            <p>
              Hemos adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de tus datos
              y protegerlos contra tratamientos no autorizados, pérdida, destrucción o daño. Entre otras:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-1">
              <li>Autenticación segura mediante Firebase Auth</li>
              <li>Conexiones HTTPS cifradas</li>
              <li>Control de accesos y permisos</li>
              <li>Rate limiting para prevenir abusos</li>
              <li>Copias de seguridad periódicas</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              No obstante, ningún sistema es 100% seguro. Te recomendamos utilizar contraseñas fuertes y no compartirlas.
            </p>
          </section>

          {/* 9. Menores de edad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">9. Menores de Edad</h2>
            <p>
              Los servicios de Agro Red están dirigidos únicamente a personas mayores de 16 años. No recopilamos
              deliberadamente datos de menores de 16 años. Si detectamos que se ha registrado un menor,
              procederemos a eliminar su cuenta inmediatamente.
            </p>
          </section>

          {/* 10. Modificaciones */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">10. Modificaciones de la Política</h2>
            <p>
              El Responsable se reserva el derecho de modificar esta Política de Privacidad para adaptarla a
              cambios legislativos o en nuestros servicios. Te informaremos de cambios significativos a través
              de la plataforma o por email.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
            <Link href="/terms" className="text-blue-600 hover:underline">Términos y Condiciones</Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</Link>
            <Link href="/legal" className="text-blue-600 hover:underline">Aviso Legal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
