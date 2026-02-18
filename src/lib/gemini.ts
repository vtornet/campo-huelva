// src/lib/gemini.ts
// Cliente de Google Gemini para funciones de IA en Red Agro

import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar el cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Modelo principal a utilizar
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Genera una descripción de perfil profesional mejorada
 * basada en los datos del trabajador
 */
export async function generarDescripcionPerfil(datos: {
  fullName?: string;
  experience?: string[];
  yearsExperience?: number;
  hasVehicle?: boolean;
  canRelocate?: boolean;
  machineryExperience?: string[];
  phytosanitaryLevel?: string;
  foodHandler?: boolean;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Eres un experto en recursos humanos del sector agrícola español.
Tu tarea es generar una descripción profesional atractiva para el perfil de un trabajador agrícola.

Datos del trabajador:
${JSON.stringify(datos, null, 2)}

Genera una descripción de 2-3 frases en español que:
1. Sea profesional pero cercana y auténtica
2. Destaque su experiencia y habilidades principales
3. Mencione sus ventajas (vehículo, disponibilidad, carnets, etc.)
4. Sea atractiva para empleadores y manijeros del sector

IMPORTANTE:
- Devuelve SOLO la descripción, sin marcas de formato ni explicaciones adicionales
- Usa un tono natural y directo, típico del sector agrario
- No inventes datos que no estén en la información proporcionada
- Si hay poca información, mantén la descripción breve y genérica pero profesional`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generando descripción de perfil:', error);
    throw new Error('Error al generar la descripción con IA');
  }
}

/**
 * Genera una descripción de perfil para jefe de cuadrilla (manijero)
 */
export async function generarDescripcionManijero(datos: {
  fullName?: string;
  crewSize?: number;
  specialties?: string[];
  yearsExperience?: number;
  hasVan?: boolean;
  ownTools?: boolean;
  workArea?: string[];
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Eres un experto en recursos humanos del sector agrícola español.
Tu tarea es generar una descripción profesional para un JEFE DE CUADRILLA (manijero).

Datos del manijero:
${JSON.stringify(datos, null, 2)}

Genera una descripción de 2-3 frases en español que:
1. Destaque la capacidad de liderazgo y el tamaño de la cuadrilla
2. Mencione las especialidades del equipo
3. Resalte los recursos disponibles (furgoneta, herramientas propias)
4. Sea atractiva para empresas que necesitan equipos formados

IMPORTANTE:
- Devuelve SOLO la descripción, sin marcas de formato ni explicaciones
- Usa un tono que transmita confianza y profesionalidad
- Enfatiza la ventaja de contratar un equipo completo y liderado`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generando descripción de manijero:', error);
    throw new Error('Error al generar la descripción con IA');
  }
}

/**
 * Genera una descripción de perfil para ingeniero técnico agrícola
 */
export async function generarDescripcionIngeniero(datos: {
  fullName?: string;
  collegiateNumber?: string;
  yearsExperience?: number;
  cropExperience?: string[];
  specialties?: string[];
  servicesOffered?: string[];
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Eres un experto en recursos humanos del sector agrícola español.
Tu tarea es generar una descripción profesional para un INGENIERO TÉCNICO AGRÍCOLA.

Datos del ingeniero:
${JSON.stringify(datos, null, 2)}

Genera una descripción de 2-3 frases en español que:
1. Destaque su formación y credenciales (número de colegiado si existe)
2. Mencione sus especialidades técnicas
3. Resalte los cultivos en los que tiene experiencia
4. Sea atractiva para empresas y agricultores que necesitan asesoramiento técnico

IMPORTANTE:
- Devuelve SOLO la descripción, sin marcas de formato ni explicaciones
- Usa un tono técnico pero accesible
- Enfatiza la calidad y profesionalidad del servicio`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generando descripción de ingeniero:', error);
    throw new Error('Error al generar la descripción con IA');
  }
}

/**
 * Recomienda ofertas a un trabajador basándose en su perfil
 */
export async function recomendarOfertas(
  perfilTrabajador: any,
  ofertasDisponibles: any[]
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Simplificamos los datos para el prompt
    const ofertasSimplificadas = ofertasDisponibles.map(o => ({
      id: o.id,
      titulo: o.title,
      descripcion: o.description,
      provincia: o.province,
      ubicacion: o.location,
      tipo: o.type
    }));

    const prompt = `Eres un asistente experto en empleo agrícola. Tu tarea es recomendar las mejores ofertas
de trabajo para un trabajador basándote en su perfil.

Perfil del trabajador:
${JSON.stringify(perfilTrabajador, null, 2)}

Ofertas disponibles:
${JSON.stringify(ofertasSimplificadas, null, 2)}

Analiza la compatibilidad entre el perfil y las ofertas considerando:
- Experiencia en cultivos mencionados en la oferta
- Ubicación y provincia (preferencia por cercanía)
- Tipo de trabajo demandado
- Años de experiencia requeridos

Devuelve SOLO un array JSON con los IDs de las 5 mejores ofertas ordenadas por relevancia.
Formato: ["id1", "id2", "id3", "id4", "id5"]
Si no hay ofertas compatibles, devuelve un array vacío: []`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text().trim();

    // Limpiar el texto para extraer el JSON puro
    // Usamos una regex sin la flag 's' (no compatible con ES2017)
    const jsonMatch = texto.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(texto);
  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    return []; // En caso de error, devolver array vacío
  }
}

/**
 * Recomienda trabajadores para una oferta de empresa
 */
export async function recomendarTrabajadores(
  oferta: any,
  trabajadoresDisponibles: any[]
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Simplificamos los datos
    const trabajadoresSimplificados = trabajadoresDisponibles.map(t => ({
      id: t.userId || t.id,
      nombre: t.fullName || t.workerProfile?.fullName,
      experiencia: t.experience || t.workerProfile?.experience,
      provincia: t.province || t.workerProfile?.province,
      anyosExperiencia: t.yearsExperience || t.workerProfile?.yearsExperience,
      puedeRelocarse: t.canRelocate ?? t.workerProfile?.canRelocate,
      tieneVehiculo: t.hasVehicle ?? t.workerProfile?.hasVehicle
    }));

    const ofertaSimplificada = {
      titulo: oferta.title,
      descripcion: oferta.description,
      provincia: oferta.province,
      ubicacion: oferta.location,
      tipo: oferta.type
    };

    const prompt = `Eres un asistente experto en recursos humanos agrícolas. Tu tarea es recomendar
los mejores trabajadores para una oferta de empleo.

Datos de la oferta:
${JSON.stringify(ofertaSimplificada, null, 2)}

Trabajadores disponibles:
${JSON.stringify(trabajadoresSimplificados, null, 2)}

Analiza la compatibilidad considerando:
- Experiencia relevante para el tipo de trabajo
- Ubicación y provincia (preferencia por cercanía o disponibilidad para reubicarse)
- Años de experiencia
- Disponibilidad de vehículo (si es relevante)

Devuelve SOLO un array JSON con los IDs de los 5 mejores trabajadores ordenados por relevancia.
Formato: ["id1", "id2", "id3", "id4", "id5"]
Si no hay trabajadores compatibles, devuelve un array vacío: []`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text().trim();

    // Limpiar el texto para extraer el JSON puro
    // Usamos una regex sin la flag 's' (no compatible con ES2017)
    const jsonMatch = texto.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(texto);
  } catch (error) {
    console.error('Error generando recomendaciones de trabajadores:', error);
    return [];
  }
}

/**
 * Mejora la descripción de una oferta o demanda de trabajo
 */
export async function mejorarDescripcionOferta(datos: {
  titulo?: string;
  descripcion?: string;
  provincia?: string;
  tipo?: string; // "OFFER", "DEMAND", "SHARED"
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Determinar si es una demanda o una oferta
    const esDemanda = datos.tipo === 'DEMAND';

    const prompt = esDemanda
      ? `Eres un experto en redacción de demandas de empleo agrícolas.
Tu tarea es mejorar la descripción de una DEMANDA de un trabajador que busca trabajo.

Datos del trabajador y la demanda:
${JSON.stringify(datos, null, 2)}

Mejora la descripción manteniendo:
1. El enfoque en el trabajador que OFRECE sus servicios
2. Un tono profesional pero cercano y humano
3. Destacar la experiencia y habilidades mencionadas
4. Claridad sobre qué tipo de trabajo busca el trabajador
5. Longitud adecuada (no más de 150 palabras)

IMPORTANTE:
- Es una DEMANDA: un trabajador buscando empleo, NO una empresa buscando trabajadores
- Usa primera persona ("Busco trabajo", "Tengo experiencia", "Ofrezco mis servicios")
- Destaca las fortalezas del trabajador: experiencia, disponibilidad, responsabilidad
- Devuelve SOLO la descripción mejorada, sin marcas de formato
- No inventes detalles que no estén en la información proporcionada
- Mantén el tono típico del sector agrario español`

      : `Eres un experto en redacción de ofertas de empleo agrícolas.
Tu tarea es mejorar la descripción de una OFERTA de trabajo para hacerla más atractiva.

Datos de la oferta:
${JSON.stringify(datos, null, 2)}

Mejora la descripción manteniendo:
1. La información esencial del trabajo
2. Un tono profesional pero cercano
3. Claridad sobre qué se busca y qué se ofrece
4. Longitud adecuada (no más de 200 palabras)

IMPORTANTE:
- Es una OFERTA: una empresa buscando trabajadores
- Usa tercera persona o voz activa de empresa ("Se busca", "Buscamos", "Ofrecemos")
- Devuelve SOLO la descripción mejorada, sin marcas de formato
- No inventes detalles específicos (salarios, fechas, etc.) que no estén en la original
- Mantén el tono típico del sector agrario español`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error mejorando descripción:', error);
    throw new Error('Error al mejorar la descripción con IA');
  }
}
