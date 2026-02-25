import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y Condiciones de uso de Red Agro.",
};

export default function TermsAndConditions() {
  const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-slate-500">Última actualización: {fechaActual}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 text-slate-700 leading-relaxed">

          {/* Preámbulo */}
          <section>
            <p className="mb-4">
              Estos Términos y Condiciones regulan el acceso y uso de la plataforma <strong>Red Agro</strong>
              (también conocida como <strong>Campo Huelva</strong>), propiedad de <strong>Víctor José Tornet García</strong>
              (NIF 77534989B), que actúa bajo la marca <strong>Appstracta</strong>.
            </p>
            <p>
              Al acceder y/o utilizar la plataforma, aceptas quedar vinculado por estos Términos. Si no estás
              de acuerdo, por favor, no utilices esta plataforma.
            </p>
          </section>

          {/* 1. Objeto */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">1. Objeto de la Plataforma</h2>
            <p className="mb-3">
              <strong>Red Agro</strong> es una plataforma digital de empleo agrícola que facilita la conexión
              entre:
            </p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li><strong>Trabajadores</strong> y <strong>manijeros</strong> que buscan empleo en el sector</li>
              <li><strong>Empresas</strong> que necesitan contratar personal</li>
              <li><strong>Ingenieros agrónomos</strong> que ofrecen servicios técnicos</li>
              <li><strong>Profesionales del sector</strong> (encargados, tractoristas)</li>
            </ul>
            <p className="text-sm text-slate-600">
              La plataforma actúa como intermediario tecnológico y <strong>no es una empresa de trabajo temporal (ETT)</strong>
              ni una agencia de colocación. Las contrataciones se realizan directamente entre las partes.
            </p>
          </section>

          {/* 2. Requisitos de acceso */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">2. Requisitos de Acceso</h2>
            <p className="mb-3">Para usar Red Agro debes:</p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li>Ser mayor de <strong>16 años</strong></li>
              <li>Facilitar datos verídicos y actualizados durante el registro</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>No compartir tu cuenta con terceros</li>
            </ul>
            <p className="text-sm text-slate-600">
              El registro es gratuito. Nos reservamos el derecho de aceptar o rechazar solicitudes de registro
              sin necesidad de justificación.
            </p>
          </section>

          {/* 3. Registro y perfiles */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">3. Registro y Perfiles de Usuario</h2>

            <h3 className="font-semibold text-slate-800 mb-2">3.1. Roles de usuario</h3>
            <p className="mb-3">La plataforma ofrece los siguientes roles:</p>
            <ul className="list-disc ml-6 mb-4 space-y-1">
              <li><strong>Trabajador/Peón:</strong> Persona que busca empleo individual</li>
              <li><strong>Manijero (Jefe de Cuadrilla):</strong> Líder que ofrece un equipo completo</li>
              <li><strong>Empresa:</strong> Entidad que contrata trabajadores o cuadrillas</li>
              <li><strong>Ingeniero Técnico Agrícola:</strong> Profesional que ofrece servicios técnicos</li>
              <li><strong>Encargado/Capataz:</strong> Responsable de finca</li>
              <li><strong>Tractorista:</strong> Especialista en maquinaria agrícola</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">3.2. Verificación de empresas</h3>
            <p className="mb-3">
              Las empresas deben pasar un proceso de verificación para poder publicar ofertas. Este proceso
              incluye la validación de datos fiscales y de contacto. La verificación no implica respaldo
              ni garantía por parte de Red Agro.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">3.3. Compromiso de veracidad</h3>
            <p>
              El usuario se compromete a mantener la veracidad de la información proporcionada. Red Agro no se
              hace responsable de la inexactitud o falsedad de los datos proporcionados por los usuarios.
            </p>
          </section>

          {/* 4. Contenido y publicaciones */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">4. Contenido de la Plataforma</h2>

            <h3 className="font-semibold text-slate-800 mb-2">4.1. Tipos de publicaciones</h3>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li><strong>Ofertas de empleo:</strong> Publicadas por empresas verificadas</li>
              <li><strong>Ofertas compartidas:</strong> Compartidas por administradores desde fuentes externas</li>
              <li><strong>Demandas de empleo:</strong> Publicadas por trabajadores y manijeros</li>
              <li><strong>Tablón social:</strong> Publicaciones de índole social (compartir coche, buscar compañeros, etc.)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">4.2. Obligaciones del usuario sobre el contenido</h3>
            <p className="mb-3">El usuario se compromete a NO publicar contenido que:</p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li>Sea falso, inexacto o engañoso</li>
              <li>Sea discriminatorio, ofensivo, obsceno o violento</li>
              <li>Viola derechos de terceros (intimidad, imagen, propiedad intelectual)</li>
              <li>Sea publicitario o spam</li>
              <li>Contenga enlaces maliciosos o código dañino</li>
              <li>Promueva actividades ilegales</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">4.3. Moderación</h3>
            <p>
              Red Agro se reserva el derecho de moderar, eliminar o suspender cualquier contenido o usuario
              que incumpla estos Términos, sin previo aviso y sin derecho a indemnización.
            </p>
          </section>

          {/* 5. Inscripciones y contratación */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">5. Inscripciones y Proceso de Contratación</h2>

            <h3 className="font-semibold text-slate-800 mb-2">5.1. Inscripciones</h3>
            <p className="mb-3">
              Al inscribirse en una oferta, el trabajador autoriza expresamente a la empresa a ver sus datos
              de contacto (teléfono, email) para facilitar el proceso de selección.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">5.2. Relación contractual</h3>
            <p className="mb-3">
              La contratación se realiza <strong>directamente entre empresa y trabajador</strong>. Red Agro
              no interviene en la relación laboral, no paga salarios ni cotiza a la Seguridad Social.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">5.3. Condiciones laborales</h3>
            <p className="mb-3">
              Las condiciones de trabajo (salario, horario, convenio aplicable) se pactan directamente entre
              las partes. Red Agro recomienda formalizar siempre un contrato por escrito y respetar el
              convenio colectivo del sector.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">5.4. Garantías</h3>
            <p>
              Red Agro no garantiza la consecución de empleo ni la idoneidad de los candidatos. Las empresas
              son responsables de realizar las verificaciones que consideren oportunas.
            </p>
          </section>

          {/* 6. Mensajería interna */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">6. Mensajería y Comunicaciones</h2>
            <p className="mb-3">
              La plataforma dispone de un sistema de mensajería interna para facilitar la comunicación entre
              usuarios. El uso de este sistema está sujeto a las siguientes normas:
            </p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li>No enviar mensajes spam o masivos</li>
              <li>No solicitar datos bancarios por este medio</li>
              <li>No compartir contenido inapropiado</li>
              <li>Respetar la privacidad de las conversaciones</li>
            </ul>
            <p className="text-sm text-slate-600">
              Red Agro no accede al contenido de los mensajes salvo por requerimiento legal o para investigar
              denuncias.
            </p>
          </section>

          {/* 7. Tablón social */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">7. Tablón Social</h2>
            <p className="mb-3">
              El Tablón es un espacio para publicaciones de carácter social (compartir coche, buscar compañeros,
              hacer consultas, etc.). No está permitido publicar ofertas o demandas de empleo en este espacio.
            </p>
            <p className="text-sm text-slate-600">
              Las empresas no pueden publicar en el Tablón. Solo pueden hacerlo los usuarios individuales.
            </p>
          </section>

          {/* 8. Denuncias */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">8. Sistema de Denuncias</h2>
            <p className="mb-3">
              Los usuarios pueden denunciar publicaciones, comentarios u otros usuarios que incumplan estas
              normas. Las denuncias son revisadas por el administrador y pueden derivar en:
            </p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li>Eliminación del contenido</li>
              <li>Suspensión temporal de la cuenta</li>
              <li>Baneo permanente</li>
            </ul>
            <p className="text-sm text-slate-600">
              El abuso del sistema de denuncias también puede ser motivo de suspensión.
            </p>
          </section>

          {/* 9. Suspensión y cierre */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">9. Suspensión y Cierre de Cuenta</h2>

            <h3 className="font-semibold text-slate-800 mb-2">9.1. Suspensión</h3>
            <p className="mb-3">
              Podemos suspender temporalmente una cuenta por: incumplimiento de estos Términos, actividad
              sospechosa, o por necesidades de mantenimiento de la plataforma.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">9.2. Baneo</h3>
            <p className="mb-3">
              El baneo permanente puede aplicarse en casos de: fraude, acoso, contenido ilegal, o reincidencia
              en infracciones graves.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">9.3. Cierre voluntario</h3>
            <p className="mb-3">
              El usuario puede cerrar su cuenta en cualquier momento desde su perfil. El cierre implica la
              eliminación de los datos personales según lo establecido en la Política de Privacidad.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">9.4. Efectos del cierre</h3>
            <p>
              Tras el cierre de la cuenta, el usuario pierde acceso a sus publicaciones, mensajes y demás
              contenido. Red Agro conservará los datos necesarios para cumplir obligaciones legales durante
              los plazos establecidos.
            </p>
          </section>

          {/* 10. Propiedad intelectual */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">10. Propiedad Intelectual e Industrial</h2>

            <h3 className="font-semibold text-slate-800 mb-2">10.1. Contenido de la plataforma</h3>
            <p className="mb-3">
              Red Agro y todos sus elementos (diseño, logotipos, textos, gráficos, código, funcionalidades)
              son propiedad de Appstracta o de terceros que han autorizado su uso.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">10.2. Contenido del usuario</h3>
            <p className="mb-3">
              Al publicar contenido en la plataforma, el usuario garantiza que tiene derechos sobre él y
              autoriza a Red Agro a utilizarlo para los fines previstos en la plataforma.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">10.3. Licencia de uso</h3>
            <p>
              El usuario recibe una licencia limitada, no exclusiva e intransferible para usar la plataforma
              para fines personales y no comerciales. Queda prohibida la reproducción, modificación o
              explotación comercial sin autorización expresa.
            </p>
          </section>

          {/* 11. Responsabilidad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">11. Responsabilidad</h2>

            <h3 className="font-semibold text-slate-800 mb-2">11.1. Exclusiones</h3>
            <p className="mb-3">
              Red Agro no responde de:
            </p>
            <ul className="list-disc ml-6 mb-3 space-y-1">
              <li>La calidad o veracidad del contenido publicado por los usuarios</li>
              <li>El cumplimiento de obligaciones laborales entre las partes</li>
              <li>Daños derivados del uso indebido de la plataforma</li>
              <li>Perjuicios causados por fallos técnicos o interrupciones del servicio</li>
              <li>El contenido de sitios web enlazados desde la plataforma</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2">11.2. Garantías</h3>
            <p>
              La plataforma se proporciona "tal cual" sin garantías de disponibilidad, continuidad o ausencia
              de errores. Hacemos nuestros mejores esfuerzos para mantener el servicio funcionando correctamente.
            </p>
          </section>

          {/* 12. Modificaciones */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">12. Modificaciones del Servicio</h2>
            <p>
              Red Agro se reserva el derecho a modificar, suspender o discontinuar temporal o permanentemente
              cualquier aspecto de la plataforma, previa notificación a los usuarios cuando sea posible.
            </p>
          </section>

          {/* 13. Duración y terminación */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">13. Duración y Terminación</h2>
            <p>
              Estos Términos tienen vigencia indefinida mientras el usuario utilice la plataforma. Podemos
              dar por terminado el acceso a la plataforma en cualquier momento y sin previo aviso en caso
              de incumplimiento de estos Términos.
            </p>
          </section>

          {/* 14. Legislación aplicable */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">14. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes
              se someten a los Juzgados y Tribunales de <strong>Huelva</strong>, salvo que la ley determine
              otra competencia.
            </p>
          </section>

          {/* 15. Contacto */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">15. Contacto</h2>
            <p>
              Para cualquier duda, sugerencia o incidencia relacionada con estos Términos, puedes contactar
              con nosotros en <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline">contact@appstracta.app</a>.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</Link>
            <Link href="/legal" className="text-blue-600 hover:underline">Aviso Legal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
