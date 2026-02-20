// src/lib/constants.ts

// Todas las provincias de España ordenadas alfabéticamente
export const PROVINCIAS = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Cordoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
  "Illes Balears", "Jaén", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
  "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

// Mapeo de provincias a municipios principales (completo para las zonas agrícolas importantes)
export const MUNICIPIOS_POR_PROVINCIA: Record<string, string[]> = {
  "A Coruña": ["A Coruña", "Ferrol", "Santiago de Compostela", "Oleiros", "Arteixo", "Narón", "Ribeira", "Otro"],
  "Álava": ["Vitoria-Gasteiz", "Amurrio", "Laudio-Llodio", "Salvatierra", "Otro"],
  "Albacete": ["Albacete", "Hellín", "Villarrobledo", "Almansa", "La Roda", "Otro"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Elda", "San Vicente del Raspeig", "Otro"],
  "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Níjar", "Vícar", "Adra", "Berja", "Otro"],
  "Asturias": ["Oviedo", "Gijón", "Avilés", "Mieres", "Langreo", "Otro"],
  "Ávila": ["Ávila", "Arévalo", "Medina del Campo", "Otro"],
  "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Villanueva de la Serena", "Almendralejo", "Zafra", "Otro"],
  "Barcelona": ["Barcelona", "L'Hospitalet", "Badalona", "Sabadell", "Terrassa", "Mataró", "Granollers", "Otro"],
  "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Otro"],
  "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata", "Mérida", "Trujillo", "Otro"],
  "Cádiz": ["Cádiz", "Algeciras", "Jerez de la Frontera", "San Fernando", "El Puerto de Santa María", "Chiclana", "La Línea", "Otro"],
  "Cantabria": ["Santander", "Torrelavega", "Castro Urdiales", "Laredo", "Otro"],
  "Castellón": ["Castellón", "Vila-real", "Burriana", "Onda", "Otro"],
  "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Valdepeñas", "Alcázar de San Juan", "Otro"],
  "Cordoba": ["Córdoba", "Lucena", "Puente Genil", "Montoro", "Palma del Río", "Baena", "Otro"],
  "Cuenca": ["Cuenca", "Tarancón", "San Clemente", "Otro"],
  "Girona": ["Girona", "Figueres", "Blanes", "Lloret de Mar", "Olot", "Otro"],
  "Granada": ["Granada", "Motril", "Almuñécar", "Guadix", "Loja", "Baza", "Otro"],
  "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Otro"],
  "Guipúzcoa": ["San Sebastián", "Irún", "Rentería", "Otro"],
  "Huelva": ["Aljaraque", "Almonte", "Ayamonte", "Beas", "Bollullos Par del Condado", "Bonares",
    "Cartaya", "Chucena", "Escacena del Campo", "Gibraleón", "Hinojos", "Huelva",
    "Isla Cristina", "La Palma del Condado", "Lepe", "Lucena del Puerto", "Manzanilla",
    "Moguer", "Niebla", "Palos de la Frontera", "Paterna del Campo", "Puebla de Guzmán",
    "Rociana del Condado", "San Bartolomé de la Torre", "San Juan del Puerto", "San Silvestre de Guzmán",
    "Trigueros", "Valverde del Camino", "Villablanca", "Villalba del Alcor", "Villanueva de los Castillejos",
    "Villarrasa", "Zalamea la Real", "Otro"],
  "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca", "Fraga", "Otro"],
  "Illes Balears": ["Palma de Mallorca", "Ibiza", "Manacor", "Mahón", "Otro"],
  "Jaén": ["Jaén", "Linares", "Andújar", "Martos", "Úbeda", "Otro"],
  "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Otro"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Arucas", "Galdar", "Maspalomas", "Otro"],
  "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villablino", "Otro"],
  "Lleida": ["Lleida", "Balaguer", "Tàrrega", "Otro"],
  "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro", "Otro"],
  "Madrid": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Parla", "Otro"],
  "Málaga": ["Málaga", "Marbella", "Fuengirola", "Mijas", "Vélez-Málaga", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Otro"],
  "Melilla": ["Melilla", "Otro"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Otro"],
  "Navarra": ["Pamplona", "Tudela", "Barañáin", "Otro"],
  "Ourense": ["Ourense", "Verín", "O Carballiño", "Otro"],
  "Palencia": ["Palencia", "Valladolid", "Otro"],
  "Pontevedra": ["Vigo", "Pontevedra", "Ponteareas", "Marín", "Vilagarcía", "Otro"],
  "Salamanca": ["Salamanca", "Santa Marta de Tormes", "Béjar", "Otro"],
  "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Otro"],
  "Segovia": ["Segovia", "Otro"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Mairena del Aljarafe", "Alcalá de Guadaíra", "Écija", "La Rinconada", "Los Palacios", "Coria del Río", "Lebrija", "Otro"],
  "Soria": ["Soria", "Otro"],
  "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Otro"],
  "Teruel": ["Teruel", "Otro"],
  "Toledo": ["Toledo", "Talavera de la Reina", "Otro"],
  "Valencia": ["Valencia", "Paterna", "Torrente", "Gandía", "Burjassot", "Sagunto", "Otro"],
  "Valladolid": ["Valladolid", "Medina del Campo", "Otro"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Otro"],
  "Zamora": ["Zamora", "Benavente", "Otro"],
  "Zaragoza": ["Zaragoza", "Otro"]
};

export const CULTIVOS = [
  "Aceituna", "Aguacate", "Ajo/Cebolla", "Almendra", "Arándano",
  "Cereal", "Chirimoya", "Cítricos (Naranja/Limón)",
  "Frambuesa", "Fresa", "Fruta de Hueso", "Fruta de Pepita",
  "Hortalizas Aire Libre", "Invernadero General",
  "Mango", "Mandarina", "Mora", "Níspero",
  "Papaya", "Patata", "Pistacho", "Vid/Uva"
];

// Tipos de experiencia para trabajadores (usados en filtros de búsqueda)
export const EXPERIENCIAS_TRABAJADOR = [
  "Aceituna", "Aguacate", "Ajo/Cebolla", "Almendra", "Arándano",
  "Cereal", "Chirimoya", "Cítricos", "Conducción tractor", "Cosecha",
  "Embalaje", "Espaldera", "Frambuesa", "Fresa", "Fruta de hueso",
  "Fruta de pepita", "Invernadero", "Limpieza", "Mango", "Mandarina",
  "Mano de obra general", "Mora", "Níspero", "Papaya", "Patata",
  "Pistacho", "Plantación", "Poda", "Recolección", "Riego", "Vid/Uva"
];

// Especialidades para manijeros (usados en filtros de búsqueda)
export const ESPECIALIDADES_MANIJERO = [
  "Aceituna", "Aguacate", "Ajo/Cebolla", "Almendra", "Arándano",
  "Cereal", "Chirimoya", "Cítricos", "Cosecha", "Embalaje",
  "Frambuesa", "Fresa", "Fruta de hueso", "Fruta de pepita",
  "Invernadero", "Limpieza", "Mango", "Mandarina", "Mano de obra general",
  "Mora", "Níspero", "Papaya", "Patata", "Pistacho", "Plantación",
  "Poda", "Recolección", "Riego", "Vid/Uva"
];

// Niveles de carnet fitosanitario
export const NIVELES_FITOSANITARIO = [
  "Básico", "Cualificado", "Fumigación aérea"
];

// Rangos de tamaño de cuadrilla para manijeros
export const RANGOS_CUADRILLA = [
  { label: "1-5 trabajadores", min: 1, max: 5 },
  { label: "6-10 trabajadores", min: 6, max: 10 },
  { label: "11-20 trabajadores", min: 11, max: 20 },
  { label: "21-30 trabajadores", min: 21, max: 30 },
  { label: "Más de 30", min: 31, max: 999 }
];

// Rangos de años de experiencia
export const RANGOS_EXPERIENCIA = [
  { label: "Sin experiencia", min: 0, max: 0 },
  { label: "1-2 años", min: 1, max: 2 },
  { label: "3-5 años", min: 3, max: 5 },
  { label: "6-10 años", min: 6, max: 10 },
  { label: "Más de 10 años", min: 11, max: 999 }
];

// Tipos de tarea para demandas de empleo
export const TIPOS_TAREA = [
  "Recolección", "Plantación", "Poda", "Riego",
  "Limpieza", "Embalaje", "Manipulación", "Conducción tractor",
  "Tratamientos", "Invernadero", "Cosecha", "Otros"
];

// Tipos de contrato para ofertas de empleo
export const TIPOS_CONTRATO = [
  "Eventual por temporada",
  "Fijo discontinuo",
  "Obra o labor determinada",
  "Indefinido",
  "Prácticas",
  "Formación",
  "Autónomo",
  "A determinar"
];

// Periodos salariales para ofertas
export const PERIODOS_SALARIALES = [
  { value: "HORA", label: "Por hora" },
  { value: "JORNADA", label: "Por jornada" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "ANUAL", label: "Anual" },
  { value: "TEMPORADA", label: "Por temporada" },
  { value: "A_CONVENIR", label: "A convenir" }
];

// Jornadas laborales
export const TIPOS_JORNADA = [
  { value: "COMPLETA", label: "Jornada completa", horas: 40 },
  { value: "MEDIA", label: "Media jornada", horas: 20 },
  { value: "PART_TIME", label: "Part-time", horas: 15 },
  { value: "POR_HORAS", label: "Por horas", horas: null }
];

// Tipos de maquinaria para tractoristas
export const TIPOS_MAQUINARIA = [
  "Tractor agrícola", "Tractor de orugas", "Pulverizadora", "Cosechadora", "Otros"
];

// Tipos de aperos para tractoristas
export const TIPOS_APEROS = [
  "Arado", "Grada", "Sembradora", "Cultivador", "Rotovator",
  "Remolque", "Cubierta", "Vibrocultor", "Escardillo", "Fresadora",
  "Rastra", "Rulo", "Otro"
];

// Tipos de experiencia para encargados
export const EXPERIENCIAS_ENCARGADO = [
  "Gestión de personal", "Organización de day workers", "Control de calidad",
  "Gestión de almacén", "Coordinación de cuadrillas", "Control de tiempos",
  "Gestión de alojamiento", "Riego y fertilización", "Fitosanitarios",
  "Recolección", "Poda", "Plantación", "Preparación de suelo"
];
