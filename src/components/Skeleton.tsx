/**
 * Componentes de Skeleton para estados de carga
 * Proporciona feedback visual durante la carga de contenido
 */

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-3 mb-4">
        <div className="h-5 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
          <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
        </div>
        <div className="h-8 bg-emerald-200 rounded-lg w-24"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
      {/* Header con avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      {/* Campos del perfil */}
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div>
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div>
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-24 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="h-16 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export function CandidateCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-8 bg-slate-100 rounded-lg"></div>
        <div className="h-8 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-slate-200 rounded-lg flex-1"></div>
        <div className="h-10 bg-slate-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
      </div>
      {/* Filas */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-slate-100 p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
