"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { usePromptDialog } from "@/components/PromptDialog";

// Forzar que esta página sea siempre dinámica (no pre-renderizar)
export const dynamic = 'force-dynamic';

type TabType = "overview" | "users" | "companies" | "posts" | "reports" | "logs";
type UserFilterType = "all" | "USER" | "FOREMAN" | "COMPANY" | "ENGINEER" | "ENCARGADO" | "TRACTORISTA" | "banned" | "silenced";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Datos del dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    totalForemen: 0,
    totalEngineers: 0,
    totalEncargados: 0,
    totalTractoristas: 0,
    totalCompanies: 0,
    totalPosts: 0,
    pendingReports: 0,
    pendingVerifications: 0,
    pendingApprovals: 0,
    bannedUsers: 0,
    silencedUsers: 0,
  });

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!authLoading && user) {
      fetch(`/api/admin/check?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin) {
            setIsAdmin(true);
            loadStats();
          } else {
            router.push(`/${locale}`);
          }
          setLoading(false);
        })
        .catch(() => {
          router.push(`/${locale}`);
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, router]);

  const loadStats = async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      // Mapear los nombres de las propiedades de la API a los del estado
      setStats({
        totalUsers: data.totalUsers || 0,
        totalWorkers: data.workers || 0,
        totalForemen: data.foremen || 0,
        totalEngineers: data.engineers || 0,
        totalEncargados: data.encargados || 0,
        totalTractoristas: data.tractoristas || 0,
        totalCompanies: data.totalCompanies || 0,
        totalPosts: data.totalPosts || 0,
        pendingReports: data.pendingReports || 0,
        pendingVerifications: data.pendingVerifications || 0,
        pendingApprovals: data.pendingApprovals || 0,
        bannedUsers: data.bannedUsers || 0,
        silencedUsers: data.silencedUsers || 0,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header Admin */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
            </div>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-sm text-slate-400 hidden sm:inline">{user?.email}</span>
          </div>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 min-h-screen p-4 hidden md:block">
          <nav className="space-y-2">
            <AdminTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Resumen
            </AdminTabButton>
            <AdminTabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Usuarios
              {(stats.bannedUsers > 0 || stats.silencedUsers > 0) && (
                <span className="ml-auto bg-red-600 text-xs px-2 py-0.5 rounded-full">{stats.bannedUsers + stats.silencedUsers}</span>
              )}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "companies"} onClick={() => setActiveTab("companies")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Empresas
              {stats.pendingApprovals > 0 && (
                <span className="ml-auto bg-amber-600 text-xs px-2 py-0.5 rounded-full">{stats.pendingApprovals}</span>
              )}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Publicaciones
            </AdminTabButton>
            <AdminTabButton active={activeTab === "reports"} onClick={() => setActiveTab("reports")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Denuncias
              {stats.pendingReports > 0 && (
                <span className="ml-auto bg-red-600 text-xs px-2 py-0.5 rounded-full">{stats.pendingReports}</span>
              )}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Historial
            </AdminTabButton>
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("overview")} className={`p-2 rounded ${activeTab === "overview" ? "bg-emerald-600" : ""}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            <button onClick={() => setActiveTab("users")} className={`p-2 rounded ${activeTab === "users" ? "bg-emerald-600" : ""}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
            <button onClick={() => setActiveTab("companies")} className={`p-2 rounded ${activeTab === "companies" ? "bg-emerald-600" : ""}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </button>
            <button onClick={() => setActiveTab("posts")} className={`p-2 rounded ${activeTab === "posts" ? "bg-emerald-600" : ""}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button onClick={() => setActiveTab("reports")} className={`p-2 rounded ${activeTab === "reports" ? "bg-emerald-600" : ""}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {activeTab === "overview" && <AdminOverview stats={stats} />}
          {activeTab === "users" && <AdminUsers onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "companies" && <AdminCompanies onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "posts" && <AdminPosts adminId={user?.uid} onStatsUpdate={loadStats} />}
          {activeTab === "reports" && <AdminReports onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "logs" && <AdminLogs />}
        </main>
      </div>
    </div>
  );
}

function AdminTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
        active ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function AdminOverview({ stats }: { stats: any }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resumen del Sistema</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Trabajadores" value={stats.totalWorkers} icon="👨‍🌾" color="bg-blue-600" />
        <StatCard title="Manijeros" value={stats.totalForemen} icon="📋" color="bg-orange-600" />
        <StatCard title="Encargados" value={stats.totalEncargados} icon="👷" color="bg-teal-600" />
        <StatCard title="Tractoristas" value={stats.totalTractoristas} icon="🚜" color="bg-amber-600" />
        <StatCard title="Ingenieros" value={stats.totalEngineers} icon="🎓" color="bg-purple-600" />
        <StatCard title="Empresas" value={stats.totalCompanies} icon="🏢" color="bg-emerald-600" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Publicaciones" value={stats.totalPosts} icon="📝" color="bg-cyan-600" />
        <StatCard title="Denuncias Pendientes" value={stats.pendingReports} icon="🚨" color="bg-red-600" />
        <StatCard title="Por Aprobar" value={stats.pendingApprovals} icon="⏳" color="bg-yellow-600" />
        <StatCard title="Sancionados" value={stats.bannedUsers + stats.silencedUsers} icon="🔒" color="bg-slate-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4 md:p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm opacity-80">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-2xl md:text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function AdminUsers({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const { showNotification } = useNotifications();
  const { confirm: confirmDialog, ConfirmDialogComponent } = useConfirmDialog();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilterType>("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    loadUsers();
  }, [filter, search, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    // Convertir filtro a minúsculas para la API (excepto "all")
    const apiFilter = filter === "all" ? "all" : filter.toLowerCase();
    const res = await fetch(`/api/admin/users?filter=${apiFilter}&search=${search}&page=${pagination.page}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
      }
    } else {
      console.error("Error loading users:", res.status);
      setUsers([]);
    }
    setLoading(false);
  };

  const handleBan = async (userId: string, ban: boolean) => {
    let reason = "";
    if (ban) {
      reason = await prompt({
        title: "Banear usuario",
        message: "Por favor, indica la razón del baneo:",
        placeholder: "Razón del baneo...",
        type: "danger",
        required: true,
      }) || "";
      if (reason === null) return;
    }

    const res = await fetch("/api/admin/users/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ban, reason: ban ? reason : undefined, adminId }),
    });

    if (res.ok) {
      loadUsers();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: ban ? "Usuario baneado" : "Usuario desbaneado",
        message: ban ? "El usuario no podrá acceder a la plataforma." : "El usuario ha sido restituido.",
      });
    } else {
      const data = await res.json();
      showNotification({
        type: "error",
        title: "Error al realizar la acción",
        message: data.error || "Inténtalo de nuevo más tarde.",
      });
    }
  };

  const handleSilence = async (userId: string, silence: boolean) => {
    if (silence) {
      const hours = await prompt({
        title: "Silenciar usuario",
        message: "Duración del silencio (en horas):\n• 24 = 1 día\n• 48 = 2 días\n• 168 = 1 semana\n• 720 = 30 días\n• Dejar vacío = permanente",
        placeholder: "Número de horas (opcional)",
        type: "warning",
      });
      if (hours === null) return;

      const hoursNum = hours.trim() === "" ? null : parseInt(hours);
      if (hours !== "" && (hoursNum === null || isNaN(hoursNum))) {
        showNotification({
          type: "warning",
          title: "Número inválido",
          message: "Por favor, introduce un número válido de horas.",
        });
        return;
      }

      const res = await fetch("/api/admin/users/silence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, silence: true, hours: hoursNum, adminId }),
      });

      if (res.ok) {
        loadUsers();
        onStatsUpdate();
        showNotification({
          type: "success",
          title: "Usuario silenciado",
          message: "El usuario no podrá publicar temporalmente.",
        });
      } else {
        showNotification({
          type: "error",
          title: "Error al realizar la acción",
          message: "Inténtalo de nuevo más tarde.",
        });
      }
    } else {
      const res = await fetch("/api/admin/users/silence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, silence: false, adminId }),
      });

      if (res.ok) {
        loadUsers();
        onStatsUpdate();
        showNotification({
          type: "success",
          title: "Silencio retirado",
          message: "El usuario puede volver a publicar.",
        });
      } else {
        showNotification({
          type: "error",
          title: "Error al realizar la acción",
          message: "Inténtalo de nuevo más tarde.",
        });
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const confirmed = await confirmDialog({
      title: "Cambiar rol",
      message: `¿Cambiar el rol del usuario a ${newRole}?`,
      type: "warning",
    });
    if (!confirmed) return;

    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole, adminId }),
    });

    if (res.ok) {
      loadUsers();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: "Rol actualizado",
        message: "El rol del usuario ha sido cambiado correctamente.",
      });
    } else {
      showNotification({
        type: "error",
        title: "Error al actualizar rol",
        message: "Inténtalo de nuevo más tarde.",
      });
    }
  };

  const getUserName = (u: any) => {
    if (u.workerProfile?.fullName) return u.workerProfile.fullName;
    if (u.foremanProfile?.fullName) return u.foremanProfile.fullName;
    if (u.engineerProfile?.fullName) return u.engineerProfile.fullName;
    if (u.encargadoProfile?.fullName) return u.encargadoProfile.fullName;
    if (u.tractoristProfile?.fullName) return u.tractoristProfile.fullName;
    if (u.companyProfile?.companyName) return u.companyProfile.companyName;
    return u.email;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-600",
      COMPANY: "bg-emerald-600",
      FOREMAN: "bg-orange-600",
      ENGINEER: "bg-purple-600",
      USER: "bg-blue-600",
      ENCARGADO: "bg-teal-600",
      TRACTORISTA: "bg-amber-600",
    };
    const labels: Record<string, string> = {
      ADMIN: "Admin",
      COMPANY: "Empresa",
      FOREMAN: "Manijero",
      ENGINEER: "Ingeniero",
      USER: "Trabajador",
      ENCARGADO: "Encargado",
      TRACTORISTA: "Tractorista",
    };
    return { color: colors[role] || "bg-slate-600", label: labels[role] || role };
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Gestión de Usuarios</h2>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterButton>
          <FilterButton active={filter === "USER"} onClick={() => setFilter("USER")}>Trabajadores</FilterButton>
          <FilterButton active={filter === "FOREMAN"} onClick={() => setFilter("FOREMAN")}>Manijeros</FilterButton>
          <FilterButton active={filter === "ENCARGADO"} onClick={() => setFilter("ENCARGADO")}>Encargados</FilterButton>
          <FilterButton active={filter === "TRACTORISTA"} onClick={() => setFilter("TRACTORISTA")}>Tractoristas</FilterButton>
          <FilterButton active={filter === "ENGINEER"} onClick={() => setFilter("ENGINEER")}>Ingenieros</FilterButton>
          <FilterButton active={filter === "COMPANY"} onClick={() => setFilter("COMPANY")}>Empresas</FilterButton>
          <FilterButton active={filter === "banned"} onClick={() => setFilter("banned")}>Baneados</FilterButton>
          <FilterButton active={filter === "silenced"} onClick={() => setFilter("silenced")}>Silenciados</FilterButton>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          className="w-full md:w-64 px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleInfo = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-750">
                      <td className="px-4 py-3">
                        <p className="font-medium">{getUserName(u)}</p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs ${roleInfo.color} text-white border-0 cursor-pointer`}
                        >
                          <option value="USER">Trabajador</option>
                          <option value="FOREMAN">Manijero</option>
                          <option value="ENCARGADO">Encargado</option>
                          <option value="TRACTORISTA">Tractorista</option>
                          <option value="ENGINEER">Ingeniero</option>
                          <option value="COMPANY">Empresa</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {u.isBanned && <span className="bg-red-600 px-2 py-0.5 rounded text-xs">🔒 Baneado</span>}
                          {u.isSilenced && <span className="bg-amber-600 px-2 py-0.5 rounded text-xs">🔇 Silenciado</span>}
                          {!u.isBanned && !u.isSilenced && <span className="text-slate-500 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {u.isBanned ? (
                            <button onClick={() => handleBan(u.id, false)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">Desbanear</button>
                          ) : (
                            <button onClick={() => handleBan(u.id, true)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">Banear</button>
                          )}
                          {u.isSilenced ? (
                            <button onClick={() => handleSilence(u.id, false)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">Desilenciar</button>
                          ) : (
                            <button onClick={() => handleSilence(u.id, true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-xs">Silenciar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
      {/* Diálogos personalizados */}
      <ConfirmDialogComponent />
      <PromptDialogComponent />
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm transition-colors ${
        active ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function AdminCompanies({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const { showNotification } = useNotifications();
  const { confirm: confirmDialog, ConfirmDialogComponent } = useConfirmDialog();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "approved" | "unapproved">("all");

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  const loadCompanies = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/companies?filter=${filter}`);
    if (res.ok) {
      const data = await res.json();
      setCompanies(data);
    }
    setLoading(false);
  };

  const handleVerify = async (companyId: string, verify: boolean) => {
    if (verify) {
      const confirmed = await confirmDialog({
        title: "Verificar empresa",
        message: "¿Verificar esta empresa? Solo verifica empresas que hayas comprobado que son legítimas.",
        type: "warning",
      });
      if (!confirmed) return;
    }

    const res = await fetch("/api/admin/companies/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, verify, userId: adminId }),
    });

    if (res.ok) {
      loadCompanies();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: verify ? "Empresa verificada" : "Verificación retirada",
        message: verify ? "La empresa ahora puede publicar ofertas oficiales." : "La empresa ha perdido su verificación.",
      });
    } else {
      showNotification({
        type: "error",
        title: "Error al realizar la acción",
        message: "Inténtalo de nuevo más tarde.",
      });
    }
  };

  const handleApprove = async (companyId: string, approve: boolean) => {
    const confirmMsg = approve
      ? "¿Aprobar esta empresa? Podrá publicar ofertas oficiales."
      : "¿Retirar aprobación? La empresa no podrá publicar ofertas oficiales.";
    const confirmed = await confirmDialog({
      title: approve ? "Aprobar empresa" : "Retirar aprobación",
      message: confirmMsg,
      type: "warning",
    });
    if (!confirmed) return;

    const res = await fetch("/api/admin/companies/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, approve, userId: adminId }),
    });

    if (res.ok) {
      loadCompanies();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: approve ? "Empresa aprobada" : "Aprobación retirada",
        message: approve ? "La empresa ha sido aprobada." : "La aprobación ha sido retirada.",
      });
    } else {
      showNotification({
        type: "error",
        title: "Error al realizar la acción",
        message: "Inténtalo de nuevo más tarde.",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Gestión de Empresas</h2>
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterButton>
          <FilterButton active={filter === "verified"} onClick={() => setFilter("verified")}>Verificadas</FilterButton>
          <FilterButton active={filter === "unverified"} onClick={() => setFilter("unverified")}>Sin Verificar</FilterButton>
          <FilterButton active={filter === "approved"} onClick={() => setFilter("approved")}>Aprobadas</FilterButton>
          <FilterButton active={filter === "unapproved"} onClick={() => setFilter("unapproved")}>Por Aprobar</FilterButton>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell">CIF</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Verificación</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Aprobación</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-sm text-slate-400">{c.user?.email}</p>
                    {c.user?.isBanned && <span className="bg-red-600 px-2 py-0.5 rounded text-xs">🔒 Baneada</span>}
                    {c.user?.isSilenced && <span className="bg-amber-600 px-2 py-0.5 rounded text-xs ml-1">🔇 Silenciada</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm hidden md:table-cell">{c.cif}</td>
                  <td className="px-4 py-3 text-sm">{c.city ? `${c.city}, ${c.province}` : c.province || "-"}</td>
                  <td className="px-4 py-3">
                    {c.isVerified ? (
                      <span className="bg-emerald-600 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                        ✅ Verificada
                      </span>
                    ) : (
                      <span className="bg-slate-600 px-2 py-1 rounded text-xs">⏳ Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.isApproved ? (
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                        ✅ Aprobada
                      </span>
                    ) : (
                      <span className="bg-orange-600 px-2 py-1 rounded text-xs">⏳ Por Aprobar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {c.isVerified ? (
                        <button onClick={() => handleVerify(c.id, false)} className="bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded text-xs">Retirar Verif.</button>
                      ) : (
                        <button onClick={() => handleVerify(c.id, true)} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs">Verificar</button>
                      )}
                      {c.isVerified && (
                        <>
                          {c.isApproved ? (
                            <button onClick={() => handleApprove(c.id, false)} className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs">Retirar Apr.</button>
                          ) : (
                            <button onClick={() => handleApprove(c.id, true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs">Aprobar</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No hay empresas con este filtro
            </div>
          )}
        </div>
      )}
      <ConfirmDialogComponent />
    </div>
  );
}

function AdminPosts({ adminId, onStatsUpdate }: { adminId?: string; onStatsUpdate: () => void }) {
  const { showNotification } = useNotifications();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "HIDDEN" | "REMOVED">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "OFFICIAL" | "SHARED" | "DEMAND">("all");

  useEffect(() => {
    loadPosts();
  }, [filter, typeFilter]);

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/posts?filter=${filter}&type=${typeFilter}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
    setLoading(false);
  };

  const handleModerate = async (postId: string, status: "ACTIVE" | "HIDDEN" | "REMOVED") => {
    let reason: string | null | undefined = undefined;
    if (status === "REMOVED") {
      reason = await prompt({
        title: "Eliminar publicación",
        message: "Por favor, indica la razón de la eliminación:",
        placeholder: "Razón de la eliminación...",
        type: "danger",
        required: true,
      });
      if (reason === null) return;
    } else if (status === "HIDDEN") {
      reason = await prompt({
        title: "Ocultar publicación",
        message: "Razón para ocultar (opcional):",
        placeholder: "Razón para ocultar...",
        type: "warning",
      }) || undefined;
    }

    const res = await fetch("/api/admin/posts/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, status, reason, adminId }),
    });

    if (res.ok) {
      loadPosts();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: "Publicación actualizada",
        message: "El estado de la publicación ha sido cambiado.",
      });
    } else {
      showNotification({
        type: "error",
        title: "Error al realizar la acción",
        message: "Inténtalo de nuevo más tarde.",
      });
    }
  };

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case "OFFICIAL": return { label: "Oficial", color: "bg-emerald-600" };
      case "SHARED": return { label: "Compartida", color: "bg-blue-600" };
      case "DEMAND": return { label: "Demanda", color: "bg-orange-600" };
      default: return { label: type, color: "bg-slate-600" };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ACTIVE": return { label: "Activa", color: "bg-emerald-600", border: "border-emerald-600" };
      case "HIDDEN": return { label: "Oculta", color: "bg-amber-600", border: "border-amber-600" };
      case "REMOVED": return { label: "Eliminada", color: "bg-red-600", border: "border-red-600" };
      default: return { label: status, color: "bg-slate-600", border: "border-slate-600" };
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Gestión de Publicaciones</h2>

        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="HIDDEN">Ocultas</option>
            <option value="REMOVED">Eliminadas</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="OFFICIAL">Oficiales</option>
            <option value="SHARED">Compartidas</option>
            <option value="DEMAND">Demandas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const typeInfo = getPostTypeInfo(post.type);
            const statusInfo = getStatusInfo(post.status);
            return (
              <div key={post.id} className={`bg-slate-800 rounded-xl p-4 border-l-4 ${statusInfo.border}`}>
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                      {post.company?.isVerified && <span className="bg-purple-600 px-2 py-1 rounded text-xs">✅ Verificada</span>}
                      {post.contractType && (
                        <span className="bg-blue-600 px-2 py-1 rounded text-xs">📄 {post.contractType}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{post.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">📍 {post.location} {post.province && `(${post.province})`}</p>
                    <p className="text-slate-300 mt-2 line-clamp-2 text-sm">"{post.description}"</p>
                    <p className="text-slate-500 text-xs mt-2">
                      Por: {post.company?.companyName || post.publisher?.workerProfile?.fullName || post.publisher?.foremanProfile?.fullName || post.publisher?.engineerProfile?.fullName || post.publisher?.encargadoProfile?.fullName || post.publisher?.tractoristProfile?.fullName || "Usuario"}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {new Date(post.createdAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {post.moderationReason && (
                      <p className="text-red-400 text-sm mt-2">⚠️ {post.moderationReason}</p>
                    )}
                  </div>
                  <div className="flex flex-row lg:flex-col gap-2">
                    {post.status !== "ACTIVE" && (
                      <button onClick={() => handleModerate(post.id, "ACTIVE")} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm whitespace-nowrap">Activar</button>
                    )}
                    {post.status !== "HIDDEN" && (
                      <button onClick={() => handleModerate(post.id, "HIDDEN")} className="bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-sm whitespace-nowrap">Ocultar</button>
                    )}
                    {post.status !== "REMOVED" && (
                      <button onClick={() => handleModerate(post.id, "REMOVED")} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm whitespace-nowrap">Eliminar</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 border-dashed">
              <p className="text-slate-400">No hay publicaciones con estos filtros</p>
            </div>
          )}
        </div>
      )}
      <PromptDialogComponent />
    </div>
  );
}

function AdminReports({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const { showNotification } = useNotifications();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "RESOLVED" | "DISMISSED">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "USER" | "POST">("all");

  useEffect(() => {
    loadReports();
  }, [filter, typeFilter]);

  const loadReports = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?filter=${filter}&type=${typeFilter}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data);
    }
    setLoading(false);
  };

  const handleResolve = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    const resolution = await prompt({
      title: status === "RESOLVED" ? "Resolver denuncia" : "Desestimar denuncia",
      message: status === "RESOLVED" ? "Describe la resolución tomada:" : "Razón para desestimar:",
      placeholder: status === "RESOLVED" ? "Resolución..." : "Razón...",
      type: status === "RESOLVED" ? "success" : "info",
      multiline: true,
      required: true,
    });
    if (resolution === null) return;

    const res = await fetch("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status, resolution, adminId }),
    });

    if (res.ok) {
      loadReports();
      onStatsUpdate();
      showNotification({
        type: "success",
        title: "Denuncia resuelta",
        message: "La denuncia ha sido marcada como resuelta.",
      });
    } else {
      showNotification({
        type: "error",
        title: "Error al realizar la acción",
        message: "Inténtalo de nuevo más tarde.",
      });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING": return { label: "Pendiente", color: "bg-amber-600" };
      case "REVIEWED": return { label: "En revisión", color: "bg-blue-600" };
      case "RESOLVED": return { label: "Resuelta", color: "bg-emerald-600" };
      case "DISMISSED": return { label: "Desestimada", color: "bg-slate-600" };
      default: return { label: status, color: "bg-slate-600" };
    }
  };

  // Obtener nombre del reportante
  const getReporterName = (report: any) => {
    if (report.reporter?.workerProfile?.fullName) return report.reporter.workerProfile.fullName;
    if (report.reporter?.foremanProfile?.fullName) return report.reporter.foremanProfile.fullName;
    if (report.reporter?.engineerProfile?.fullName) return report.reporter.engineerProfile.fullName;
    if (report.reporter?.encargadoProfile?.fullName) return report.reporter.encargadoProfile.fullName;
    if (report.reporter?.tractoristProfile?.fullName) return report.reporter.tractoristProfile.fullName;
    if (report.reporter?.companyProfile?.companyName) return report.reporter.companyProfile.companyName;
    return report.reporter?.email || "Desconocido";
  };

  // Obtener nombre del usuario denunciado
  const getReportedUserName = (report: any) => {
    if (report.reportedUser?.workerProfile?.fullName) return report.reportedUser.workerProfile.fullName;
    if (report.reportedUser?.foremanProfile?.fullName) return report.reportedUser.foremanProfile.fullName;
    if (report.reportedUser?.engineerProfile?.fullName) return report.reportedUser.engineerProfile.fullName;
    if (report.reportedUser?.encargadoProfile?.fullName) return report.reportedUser.encargadoProfile.fullName;
    if (report.reportedUser?.tractoristProfile?.fullName) return report.reportedUser.tractoristProfile.fullName;
    if (report.reportedUser?.companyProfile?.companyName) return report.reportedUser.companyProfile.companyName;
    return report.reportedUser?.email || "Desconocido";
  };

  // Obtener etiqueta del rol
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Admin",
      COMPANY: "Empresa",
      FOREMAN: "Manijero",
      ENGINEER: "Ingeniero",
      USER: "Trabajador",
      ENCARGADO: "Encargado",
      TRACTORISTA: "Tractorista",
    };
    return labels[role] || role;
  };

  // Obtener info del tipo de post
  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case "OFFICIAL": return { label: "Oferta Oficial", color: "bg-emerald-600" };
      case "SHARED": return { label: "Oferta Compartida", color: "bg-blue-600" };
      case "DEMAND": return { label: "Demanda", color: "bg-orange-600" };
      default: return { label: type, color: "bg-slate-600" };
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Gestión de Denuncias</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="RESOLVED">Resueltas</option>
            <option value="DISMISSED">Desestimadas</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="USER">Usuarios</option>
            <option value="POST">Publicaciones</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusInfo = getStatusInfo(report.status);
            const isUserReport = report.type === "USER";

            return (
              <div key={report.id} className="bg-slate-800 rounded-xl overflow-hidden">
                {/* Cabecera con tipo y estado */}
                <div className="bg-slate-700/50 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${isUserReport ? "bg-purple-600" : "bg-blue-600"}`}>
                      {isUserReport ? "👤 Denuncia de Usuario" : "📝 Denuncia de Publicación"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleString("es-ES")}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      {/* Razón de la denuncia */}
                      <div>
                        <h4 className="font-semibold text-red-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Razón: {report.reason}
                        </h4>
                        {report.description && (
                          <p className="text-slate-400 text-sm mt-1 pl-6">{report.description}</p>
                        )}
                      </div>

                      {/* Información del reportante */}
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Denunciado por:</p>
                        <p className="text-sm font-medium">{getReporterName(report)}</p>
                        <p className="text-xs text-slate-500">{report.reporter?.email}</p>
                      </div>

                      {/* Objeto denunciado */}
                      {isUserReport ? (
                        // Información del usuario denunciado
                        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                          <p className="text-xs text-red-400 mb-2">Usuario denunciado:</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                              {getReportedUserName(report)?.[0] || "?"}
                            </div>
                            <div>
                              <p className="font-medium">{getReportedUserName(report)}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="bg-slate-600 px-2 py-0.5 rounded">
                                  {getRoleLabel(report.reportedUser?.role)}
                                </span>
                                <span>{report.reportedUser?.email}</span>
                              </div>
                              {(report.reportedUser?.workerProfile?.city || report.reportedUser?.foremanProfile?.city || report.reportedUser?.engineerProfile?.city || report.reportedUser?.encargadoProfile?.city || report.reportedUser?.tractoristProfile?.city || report.reportedUser?.companyProfile?.city) && (
                                <p className="text-xs text-slate-500 mt-1">
                                  📍 {report.reportedUser?.workerProfile?.city || report.reportedUser?.foremanProfile?.city || report.reportedUser?.engineerProfile?.city || report.reportedUser?.encargadoProfile?.city || report.reportedUser?.tractoristProfile?.city || report.reportedUser?.companyProfile?.city}
                                  {(report.reportedUser?.workerProfile?.province || report.reportedUser?.foremanProfile?.province || report.reportedUser?.engineerProfile?.province || report.reportedUser?.encargadoProfile?.province || report.reportedUser?.tractoristProfile?.province || report.reportedUser?.companyProfile?.province) &&
                                    `, ${report.reportedUser?.workerProfile?.province || report.reportedUser?.foremanProfile?.province || report.reportedUser?.engineerProfile?.province || report.reportedUser?.encargadoProfile?.province || report.reportedUser?.tractoristProfile?.province || report.reportedUser?.companyProfile?.province}`}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {report.reportedUser?.isBanned && <span className="bg-red-600 px-2 py-0.5 rounded text-xs">🔒 Baneado</span>}
                                {report.reportedUser?.isSilenced && <span className="bg-amber-600 px-2 py-0.5 rounded text-xs">🔇 Silenciado</span>}
                                {report.reportedUser?.companyProfile?.isVerified && <span className="bg-emerald-600 px-2 py-0.5 rounded text-xs">✅ Verificada</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Información de la publicación denunciada
                        report.reportedPost && (
                          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                            <p className="text-xs text-blue-400 mb-2">Publicación denunciada:</p>
                            <div className="flex items-start gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${getPostTypeInfo(report.reportedPost.type).color}`}>
                                {getPostTypeInfo(report.reportedPost.type).label}
                              </span>
                              {report.reportedPost.status !== "ACTIVE" && (
                                <span className="bg-amber-600 px-2 py-1 rounded text-xs">
                                  {report.reportedPost.status === "HIDDEN" ? "Oculta" : report.reportedPost.status === "REMOVED" ? "Eliminada" : report.reportedPost.status}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-base mt-2">{report.reportedPost.title}</h5>
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">"{report.reportedPost.description}"</p>
                            <p className="text-xs text-slate-500 mt-2">
                              📍 {report.reportedPost.location}
                              {report.reportedPost.province && `, ${report.reportedPost.province}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Por: {report.reportedPost.company?.companyName || report.reportedPost.publisher?.workerProfile?.fullName || report.reportedPost.publisher?.foremanProfile?.fullName || report.reportedPost.publisher?.engineerProfile?.fullName || report.reportedPost.publisher?.encargadoProfile?.fullName || report.reportedPost.publisher?.tractoristProfile?.fullName || "Usuario"}
                            </p>
                          </div>
                        )
                      )}

                      {/* Resolución (si existe) */}
                      {report.resolution && (
                        <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-lg p-3">
                          <p className="text-emerald-400 text-sm font-medium mb-1">✅ Resolución:</p>
                          <p className="text-emerald-300 text-sm">{report.resolution}</p>
                          {report.resolvedAt && (
                            <p className="text-emerald-400/60 text-xs mt-1">
                              Resuelto el {new Date(report.resolvedAt).toLocaleDateString("es-ES")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    {report.status === "PENDING" && (
                      <div className="flex lg:flex-col gap-2 lg:w-40">
                        <button
                          onClick={() => handleResolve(report.id, "RESOLVED")}
                          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Resolver
                        </button>
                        <button
                          onClick={() => handleResolve(report.id, "DISMISSED")}
                          className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded text-sm whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Desestimar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 border-dashed">
              <p className="text-slate-400">No hay denuncias con estos filtros</p>
            </div>
          )}
        </div>
      )}
      <PromptDialogComponent />
    </div>
  );
}

function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/logs?action=${actionFilter}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; icon: string; color: string }> = {
      BAN_USER: { label: "Baneó usuario", icon: "🔒", color: "text-red-400" },
      UNBAN_USER: { label: "Desbaneó usuario", icon: "🔓", color: "text-emerald-400" },
      SILENCE_USER: { label: "Silenció usuario", icon: "🔇", color: "text-amber-400" },
      UNSILENCE_USER: { label: "Desilenció usuario", icon: "🔊", color: "text-emerald-400" },
      VERIFY_COMPANY: { label: "Verificó empresa", icon: "✅", color: "text-emerald-400" },
      UNVERIFY_COMPANY: { label: "Retiró verificación", icon: "❌", color: "text-red-400" },
      HIDE_POST: { label: "Ocultó publicación", icon: "👁️", color: "text-amber-400" },
      SHOW_POST: { label: "Mostró publicación", icon: "👁️", color: "text-emerald-400" },
      REMOVE_POST: { label: "Eliminó publicación", icon: "🗑️", color: "text-red-400" },
      RESOLVE_REPORT: { label: "Resolvió denuncia", icon: "⚖️", color: "text-blue-400" },
      DELETE_USER: { label: "Eliminó usuario", icon: "🗑️", color: "text-red-400" },
    };
    return labels[action] || { label: action, icon: "•", color: "text-slate-400" };
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Historial de Acciones</h2>
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todas las acciones</option>
            <option value="BAN_USER">Baneos</option>
            <option value="SILENCE_USER">Silencios</option>
            <option value="VERIFY_COMPANY">Verificaciones</option>
            <option value="REMOVE_POST">Eliminaciones</option>
            <option value="RESOLVE_REPORT">Denuncias</option>
          </select>
          <button onClick={loadLogs} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Objetivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium hidden md:table-cell">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionInfo = getActionLabel(log.action);
                return (
                  <tr key={log.id} className="border-t border-slate-700 hover:bg-slate-750">
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(log.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{log.adminId.substring(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className={actionInfo.color}>
                        {actionInfo.icon} {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-slate-400">{log.targetType}:</span>
                      <span className="ml-1 font-mono">{log.targetId.substring(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{log.details || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No hay acciones registradas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
