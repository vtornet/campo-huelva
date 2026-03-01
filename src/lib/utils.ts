/**
 * Formatea una fecha en formato: "Publicado el 01/03/26 a las 16:08"
 */
export function formatPostDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Verificar que la fecha sea válida
  if (isNaN(d.getTime())) {
    return '';
  }

  // Formatear fecha: DD/MM/YY
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2); // Últimos 2 dígitos

  // Formatear hora: HH:mm
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `Publicado el ${day}/${month}/${year} a las ${hours}:${minutes}`;
}

/**
 * Formatea una fecha relativa (hace X minutos, horas, días)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  // Si es mayor a 7 días, usar formato absoluto
  return formatPostDate(d);
}
