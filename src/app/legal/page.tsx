import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso Legal",
  description: "Aviso Legal de Red Agro. Información legal y datos de contacto.",
};

export default function LegalNotice() {
  const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Aviso Legal</h1>
          <p className="text-slate-500">Última actualización: {fechaActual}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 text-slate-700 leading-relaxed">

          {/* Aviso sobre dirección */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> El titular del servicio reside en <strong>Lepe, Huelva (España)</strong>.
            </p>
          </div>

          {/* 1. Responsable */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">1. Datos del Responsable</h2>
            <p className="mb-3">De conformidad con el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa:</p>

            <div className="bg-slate-50 rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex">
                  <span className="font-semibold w-40 flex-shrink-0">Titular:</span>
                  <span>Víctor José Tornet García</span>
                </li>
                <li className="flex">
                  <span className="font-semibold w-40 flex-shrink-0">Nombre comercial:</span>
                  <span>Appstracta</span>
                </li>
                <li className="flex">
                  <span className="font-semibold w-40 flex-shrink-0">NIF/CIF:</span>
                  <span>77534989B</span>
                </li>
                <li className="flex">
                  <span className="font-semibold w-40 flex-shrink-0">Dirección:</span>
                  <span>Lepe, Huelva, España</span>
                </li>
                <li className="flex">
                  <span className="font-semibold w-40 flex-shrink-0">Localidad:</span>
                  <span>Lepe, Huelva, España</span>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-40 flex-shrink-0">Email:</span>
                  <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline">contact@appstracta.app</a>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-40 flex-shrink-0">Sitio web:</span>
                  <a href="https://appstracta.app" className="text-blue-600 hover:underline">appstracta.app</a>
                </li>
              </ul>
            </div>
          </section>

          {/* 2. Actividad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">2. Actividad Comercial</h2>
            <p>
              Appstracta, bajo la marca <strong>Red Agro</strong>, desarrolla una plataforma digital de empleo agrícola
              que conecta a trabajadores, profesionales y empresas del sector agrario español.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              La plataforma actúa como intermediario tecnológico y no es una empresa de trabajo temporal (ETT) ni agencia de colocación.
            </p>
          </section>

          {/* 3. Finalidad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">3. Finalidad del Sitio Web</h2>
            <p>
              Este sitio web tiene como finalidad facilitar la conexión entre profesionales del sector agrario,
              permitiendo la publicación y búsqueda de ofertas de empleo, demandas de trabajo, y la comunicación
              entre usuarios a través de herramientas de mensajería.
            </p>
          </section>

          {/* 4. Condiciones de uso */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">4. Condiciones de Uso</h2>
            <p className="mb-3">El acceso y uso de este sitio web se rige por:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Los presentes Términos y Condiciones de Uso</li>
              <li>La Política de Privacidad</li>
              <li>La Política de Cookies</li>
              <li>La legislación española vigente</li>
            </ul>
          </section>

          {/* 5. Propiedad intelectual */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">5. Propiedad Intelectual e Industrial</h2>
            <p className="mb-3">
              Todos los elementos que integran este sitio web (diseño, estructura, logotipos, textos, gráficos,
              código fuente, funcionalidades, bases de datos) son propiedad de Appstracta o de terceros que han
              autorizado su uso.
            </p>
            <p className="mb-3">
              Quedan reservados todos los derechos. Sin autorización expresa queda prohibida:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>La reproducción total o parcial</li>
              <li>La distribución, comunicación pública o transformación</li>
              <li>Cualquier forma de explotación comercial</li>
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              El mero acceso a este sitio web no otorga derecho alguno sobre los elementos contenidos en el mismo.
            </p>
          </section>

          {/* 6. Responsabilidad */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">6. Limitación de Responsabilidad</h2>
            <p className="mb-3">Appstracta no responde de:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>La veracidad y exactitud del contenido proporcionado por los usuarios</li>
              <li>Los daños que pudieran derivarse del uso del sitio web</li>
              <li>Las interrupciones, fallos técnicos o errores que puedan ocurrir</li>
              <li>El contenido de sitios web enlazados desde esta plataforma</li>
              <li>Las relaciones contractuales entre usuarios de la plataforma</li>
            </ul>
          </section>

          {/* 7. Protección de datos */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">7. Protección de Datos Personales</h2>
            <p>
              Tus datos personales serán tratados de conformidad con lo establecido en el Reglamento General de
              Protección de Datos (RGPD) y la Ley Orgánica 3/2018. Para más información, consulta nuestra
              <Link href="/privacy" className="text-blue-600 hover:underline ml-1">Política de Privacidad</Link>.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">8. Política de Cookies</h2>
            <p>
              Este sitio web utiliza cookies para mejorar la experiencia de usuario. Para más información, consulta nuestra
              <Link href="/cookies" className="text-blue-600 hover:underline ml-1">Política de Cookies</Link>.
            </p>
          </section>

          {/* 9. Legislación aplicable */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">9. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Este sitio web se rige por la legislación española. Para cualquier controversia, las partes se someten
              a los Juzgados y Tribunales de <strong>Huelva</strong>, salvo que la ley determine otra competencia.
            </p>
          </section>

          {/* 10. Contacto */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">10. Contacto</h2>
            <p>
              Para cualquier cuestión relacionada con este sitio web, puedes contactar con nosotros en
              <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline ml-1">contact@appstracta.app</a>.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link>
            <Link href="/terms" className="text-blue-600 hover:underline">Términos y Condiciones</Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
