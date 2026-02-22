/**
 * Root Layout - El middleware de next-intl maneja la redirección
 * Este layout solo se usa como fallback
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
